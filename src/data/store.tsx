import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { startOfDay } from "@/lib/format";
import { uid } from "@/lib/utils";
import { generateDemo } from "./seed";
import type { Bon, Loss, Sale, Shipment } from "./types";

/**
 * Prototype store: everything lives in the browser (no server, no database).
 * Changes are kept in localStorage so the demo survives a reload; "Réinitialiser" starts over.
 */
const KEY = "aquacore-maquette-v2";

type State = { day: number; bons: Bon[] };

export type NewBon = {
  lines: { productId: string; kg: number; price: number }[];
  trucks: { driverId: string; marketId: string; transport: number; lines: { productId: string; kg: number }[] }[];
};

type Action =
  | { type: "reset" }
  | { type: "addBon"; bon: NewBon; id: string }
  | { type: "patchShipment"; shipmentId: string; patch: (s: Shipment) => Shipment };

function fresh(): State {
  return { day: startOfDay(Date.now()), bons: generateDemo() };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.day === startOfDay(Date.now())) return s;
    }
  } catch {
    /* storage unavailable: fresh demo */
  }
  return fresh();
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return fresh();
    case "addBon": {
      const now = Date.now();
      const next = Math.max(0, ...state.bons.map((b) => Number(b.number.slice(2)) || 0)) + 1;
      const bon: Bon = {
        id: action.id,
        number: `B-${String(next).padStart(4, "0")}`,
        at: now,
        port: "Port d'Agadir",
        lines: action.bon.lines,
        shipments: action.bon.trucks.map((t) => ({
          id: uid(),
          driverId: t.driverId,
          marketId: t.marketId,
          transport: t.transport,
          lines: t.lines.filter((l) => l.kg > 0),
          loadedAt: now,
          departedAt: now,
          sales: [],
          losses: [],
        })),
      };
      return { ...state, bons: [bon, ...state.bons] };
    }
    case "patchShipment":
      return {
        ...state,
        bons: state.bons.map((b) =>
          b.shipments.some((s) => s.id === action.shipmentId)
            ? { ...b, shipments: b.shipments.map((s) => (s.id === action.shipmentId ? action.patch(s) : s)) }
            : b,
        ),
      };
  }
}

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  // A clock that ticks every 30 s, so trucks move on the route board.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode: the demo still works, it just won't survive a reload */
    }
  }, [state]);

  return useMemo(() => {
    const patch = (shipmentId: string, fn: (s: Shipment) => Shipment) =>
      dispatch({ type: "patchShipment", shipmentId, patch: fn });
    return {
      now,
      bons: state.bons,
      reset: () => dispatch({ type: "reset" }),
      addBon: (bon: NewBon) => {
        const id = uid();
        dispatch({ type: "addBon", bon, id });
        return id;
      },
      setArrived: (shipmentId: string, arrived: boolean) =>
        patch(shipmentId, (s) => ({
          ...s,
          departedAt: s.departedAt ?? s.loadedAt,
          arrivedAt: arrived ? (s.arrivedAt ?? Date.now()) : undefined,
        })),
      addSale: (shipmentId: string, sale: Omit<Sale, "id" | "at">) =>
        patch(shipmentId, (s) => ({ ...s, sales: [...s.sales, { ...sale, id: uid(), at: Date.now() }] })),
      addLoss: (shipmentId: string, loss: Omit<Loss, "id" | "at">) =>
        patch(shipmentId, (s) => ({ ...s, losses: [...s.losses, { ...loss, id: uid(), at: Date.now() }] })),
      closeShipment: (shipmentId: string) => patch(shipmentId, (s) => ({ ...s, closedAt: Date.now() })),
    };
  }, [state.bons, now]);
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}

/** Find a shipment with its bon. */
export function findShipment(bons: Bon[], shipmentId: string) {
  for (const bon of bons) {
    const s = bon.shipments.find((x) => x.id === shipmentId);
    if (s) return { bon, shipment: s };
  }
  return null;
}
