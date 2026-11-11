import { DAY, startOfDay } from "@/lib/format";
import { FRESH_DAYS, market } from "./catalog";
import type { Bon, Shipment, Stage } from "./types";

/** Purchase price of a product on this bon (DH/kg). */
const priceOf = (bon: Bon, productId: string) => bon.lines.find((l) => l.productId === productId)?.price ?? 0;

export function stage(s: Shipment): Stage {
  if (s.closedAt) return "done";
  if (s.arrivedAt) return "market";
  if (s.departedAt) return "road";
  return "loaded";
}

/** 0 → 1 along the road (estimated from the usual travel time). */
export function roadProgress(s: Shipment, now = Date.now()) {
  if (s.arrivedAt) return 1;
  if (!s.departedAt) return 0;
  const total = market(s.marketId).hours * 3_600_000;
  return Math.max(0, Math.min(0.95, (now - s.departedAt) / total));
}

/** Day on the market (1, 2, 3…), or 0 if not arrived. */
export function marketDay(s: Shipment, now = Date.now()) {
  if (!s.arrivedAt) return 0;
  // Calendar days, like a seller counts them: the arrival day is day 1.
  return Math.max(1, Math.round((startOfDay(s.closedAt ?? now) - startOfDay(s.arrivedAt)) / DAY) + 1);
}

export const atRisk = (s: Shipment, now = Date.now()) =>
  stage(s) === "market" && marketDay(s, now) >= FRESH_DAYS && shipmentStats(s).kgLeft > 0;

/** Kg and money of one truck. Profit = sales − cost of what left the truck (sold + lost) − transport. */
export function shipmentStats(s: Shipment, bon?: Bon) {
  const kgLoaded = s.lines.reduce((a, l) => a + l.kg, 0);
  const kgSold = s.sales.reduce((a, x) => a + x.kg, 0);
  const kgLost = s.losses.reduce((a, x) => a + x.kg, 0);
  // A finished trip has nothing left in the truck (only rounding crumbs).
  const kgLeft = s.closedAt ? 0 : Math.max(0, kgLoaded - kgSold - kgLost);
  const revenue = s.sales.reduce((a, x) => a + x.amount, 0);
  const purchase = bon ? s.lines.reduce((a, l) => a + l.kg * priceOf(bon, l.productId), 0) : 0;
  const costSold = bon ? s.sales.reduce((a, x) => a + x.kg * priceOf(bon, x.productId), 0) : 0;
  const lossValue = bon ? s.losses.reduce((a, x) => a + x.kg * priceOf(bon, x.productId), 0) : 0;
  const leftValue = s.closedAt ? 0 : Math.max(0, purchase - costSold - lossValue);
  const profit = revenue - costSold - lossValue - s.transport;
  return { kgLoaded, kgSold, kgLost, kgLeft, revenue, purchase, costSold, lossValue, leftValue, transport: s.transport, profit };
}

export type Stats = ReturnType<typeof shipmentStats>;

export function bonStats(bon: Bon) {
  const parts = bon.shipments.map((s) => shipmentStats(s, bon));
  const sum = (k: keyof Stats) => parts.reduce((a, p) => a + p[k], 0);
  return {
    kgLoaded: sum("kgLoaded"),
    kgSold: sum("kgSold"),
    kgLost: sum("kgLost"),
    kgLeft: sum("kgLeft"),
    revenue: sum("revenue"),
    purchase: bon.lines.reduce((a, l) => a + l.kg * l.price, 0),
    costSold: sum("costSold"),
    lossValue: sum("lossValue"),
    leftValue: sum("leftValue"),
    transport: sum("transport"),
    profit: sum("profit"),
  };
}

/** The bon is finished when every truck is done. */
export const bonDone = (bon: Bon) => bon.shipments.every((s) => stage(s) === "done");
