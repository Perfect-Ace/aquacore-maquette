import { Link } from "react-router";
import { Anchor, Check, Flag, MapPin, Truck } from "lucide-react";
import { atRisk, marketDay, roadProgress, stage } from "@/data/calc";
import { FRESH_DAYS, MARKETS, PORT_XY, driver, market } from "@/data/catalog";
import type { Bon, Shipment } from "@/data/types";
import { dayTime, dh, kg, percent, time } from "@/lib/format";
import { cn } from "@/lib/utils";

const W = 400;
const H = 300;

/** Control point of the curved road from the port to a market. */
const ctrl = (m: { x: number; y: number }) => {
  // Gentle bow to the right of each road, so roads fan out from the port instead of bundling.
  const dx = m.x - PORT_XY.x;
  const dy = m.y - PORT_XY.y;
  return { x: (PORT_XY.x + m.x) / 2 - dy * 0.12, y: (PORT_XY.y + m.y) / 2 + dx * 0.12 };
};
function along(m: { x: number; y: number }, t: number) {
  const c = ctrl(m);
  const u = 1 - t;
  return { x: u * u * PORT_XY.x + 2 * u * t * c.x + t * t * m.x, y: u * u * PORT_XY.y + 2 * u * t * c.y + t * t * m.y };
}
const pct = (p: { x: number; y: number }) => ({ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` });

/**
 * Route board: the port, the markets, and every live truck placed on its road.
 * Schematic (not a real map): it shows who is where at a glance.
 */
export function RouteBoard({ items, now }: { items: { bon: Bon; s: Shipment }[]; now: number }) {
  const live = items.filter(({ s }) => stage(s) !== "done");
  const activeMarkets = new Set(live.map(({ s }) => s.marketId));
  const atPort = live.filter(({ s }) => stage(s) === "loaded");

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#f7faf9] ring-1 ring-border/70 sm:aspect-[4/3]">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {/* Atlantic */}
        <path d="M250 0C228 28 206 46 186 64S108 126 68 160 50 236 62 300H0V0Z" fill="#e6f4f5" />
        <path d="M250 0C228 28 206 46 186 64S108 126 68 160 50 236 62 300" fill="none" stroke="#c9e6e6" strokeWidth="2" />
        {[40, 80, 120].map((o) => (
          <path key={o} d={`M${10} ${o + 110}q8 -5 16 0t16 0`} fill="none" stroke="#b4dcdc" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <text x="14" y="70" fontSize="9" fill="#6b9a9a" fontStyle="italic" fontFamily="Geist, sans-serif">
          Océan Atlantique
        </text>
        {/* Roads */}
        {MARKETS.map((m) => {
          const c = ctrl(m);
          const active = activeMarkets.has(m.id);
          return (
            <path
              key={m.id}
              d={`M${PORT_XY.x} ${PORT_XY.y}Q${c.x} ${c.y} ${m.x} ${m.y}`}
              fill="none"
              stroke={active ? "#00a199" : "#c9d2de"}
              strokeWidth={active ? 2.5 : 1.5}
              strokeDasharray={active ? undefined : "4 5"}
              strokeLinecap="round"
              opacity={active ? 0.55 : 1}
            />
          );
        })}
      </svg>

      {/* Markets */}
      {MARKETS.map((m) => {
        const here = live.filter(({ s }) => s.marketId === m.id && stage(s) === "market");
        const risk = here.some(({ s }) => atRisk(s, now));
        return (
          <div key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(m)}>
            <div className="relative flex flex-col items-center">
              {here.length > 0 && (
                <span aria-hidden className={cn("absolute top-0 size-5 rounded-full animate-pulse-ring", risk ? "bg-loss/50" : "bg-sea-400/50")} />
              )}
              <span
                className={cn(
                  "relative grid size-5 place-items-center rounded-full ring-2 ring-white",
                  here.length ? (risk ? "bg-loss text-white" : "bg-sea-500 text-white") : "bg-mist-300 text-white",
                )}
              >
                {here.length ? <span className="text-[10px] font-bold">{here.length}</span> : <MapPin className="size-3" />}
              </span>
              <span className="mt-0.5 rounded bg-white/85 px-1 text-[10px] font-medium whitespace-nowrap text-ink-soft sm:text-[11px]">
                {m.city}
              </span>
            </div>
          </div>
        );
      })}

      {/* Port */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(PORT_XY)}>
        <div className="flex flex-col items-center">
          <span className="grid size-8 place-items-center rounded-xl bg-navy-900 text-white shadow-lift ring-2 ring-white">
            <Anchor className="size-4" />
          </span>
          <span className="mt-0.5 rounded bg-white/85 px-1 text-[11px] font-semibold whitespace-nowrap text-ink">Port d'Agadir</span>
          {atPort.length > 0 && (
            <span className="mt-0.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-medium text-amber-900">{atPort.length} en chargement</span>
          )}
        </div>
      </div>

      {/* Trucks on the road (labels nudged apart when two trucks are close) */}
      {placeTrucks(live.filter(({ s }) => stage(s) === "road"), now)
        .map(({ bon, s, p, side }) => {
          const m = market(s.marketId);
          const d = driver(s.driverId);
          return (
            <Link
              key={s.id}
              to={`/admin/bons/${bon.id}`}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={pct(p)}
              title={`${d.name} → ${m.city}`}
            >
              <span className="relative grid size-6 animate-drive place-items-center rounded-full bg-navy-900 text-white shadow-lift ring-2 ring-white transition-transform group-hover:scale-110">
                <Truck className="size-3.5" />
              </span>
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white shadow-lift sm:text-[11px]",
                  side === "right" ? "left-[calc(100%+4px)]" : "right-[calc(100%+4px)]",
                )}
              >
                {d.name.split(" ")[0]}
              </span>
            </Link>
          );
        })}
    </div>
  );
}

function placeTrucks(items: { bon: Bon; s: Shipment }[], now: number) {
  // The truck dot stays on its road; only the name label moves (right, or left if it would overlap).
  const placed: { bon: Bon; s: Shipment; p: { x: number; y: number }; side: "left" | "right" }[] = [];
  for (const it of [...items].sort((a, b) => roadProgress(b.s, now) - roadProgress(a.s, now))) {
    const p = along(market(it.s.marketId), roadProgress(it.s, now));
    const clash = placed.some((o) => o.side === "right" && Math.abs(o.p.y - p.y) < 16 && p.x < o.p.x + 70 && p.x > o.p.x - 70);
    placed.push({ ...it, p, side: clash ? "left" : "right" });
  }
  return placed;
}

/** Port → road → market → done, with times. The truck sits on the current step. */
export function JourneyTrack({ s, now, compact }: { s: Shipment; now: number; compact?: boolean }) {
  const st = stage(s);
  const m = market(s.marketId);
  const dayN = marketDay(s, now);
  const steps = [
    { key: "loaded", icon: Anchor, label: "Port", sub: time(s.loadedAt), done: true },
    {
      key: "road",
      icon: Truck,
      label: "Route",
      sub: s.departedAt ? (st === "road" ? `${percent(roadProgress(s, now))} du trajet` : time(s.departedAt)) : "pas parti",
      done: Boolean(s.departedAt),
    },
    {
      key: "market",
      icon: MapPin,
      label: m.city,
      sub: s.arrivedAt ? (st === "market" ? `jour ${dayN} / ${FRESH_DAYS}` : dayTime(s.arrivedAt)) : "pas arrivé",
      done: Boolean(s.arrivedAt),
    },
    { key: "done", icon: Flag, label: "Terminé", sub: s.closedAt ? dayTime(s.closedAt) : "—", done: Boolean(s.closedAt) },
  ];
  const current = ["loaded", "road", "market", "done"].indexOf(st);
  const fill = st === "road" ? 1 / 3 + roadProgress(s, now) / 3 : current / 3;

  return (
    <div className="relative" aria-label={`Étape : ${steps[current]?.label}`}>
      <div className="absolute top-3.5 right-[12.5%] left-[12.5%] h-1 rounded-full bg-mist-200">
        <div className="h-full rounded-full bg-sea-500 transition-[width] duration-700" style={{ width: `${Math.min(fill / 1, 1) * 100}%` }} />
      </div>
      <ol className="relative grid grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isCurrent = i === current && st !== "done";
          return (
            <li key={step.key} className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full ring-4 ring-surface",
                  isCurrent ? "bg-navy-900 text-white" : step.done ? "bg-sea-500 text-white" : "bg-mist-100 text-mist-400",
                )}
              >
                {step.done && !isCurrent ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span className={cn("mt-1.5 text-xs font-medium", isCurrent ? "text-ink" : "text-ink-soft")}>{step.label}</span>
              {!compact && <span className="text-[11px] text-ink-muted tabular">{step.sub}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Loaded kg split into sold / lost / still in the truck (2px gaps between segments). */
export function KgBar({ sold, lost, left, showLegend = true, height = "h-3" }: { sold: number; lost: number; left: number; showLegend?: boolean; height?: string }) {
  const total = sold + lost + left || 1;
  const parts = [
    { v: sold, color: "var(--color-sales)", label: "Vendu" },
    { v: lost, color: "var(--color-loss)", label: "Perdu" },
    { v: left, color: "var(--color-left)", label: "Dans le camion" },
  ];
  return (
    <div>
      <div className={cn("flex w-full gap-0.5 overflow-hidden rounded-[4px]", height)} role="img" aria-label={`Vendu ${kg(sold)}, perdu ${kg(lost)}, reste ${kg(left)}`}>
        {parts
          .filter((p) => p.v > 0)
          .map((p) => (
            <div key={p.label} title={`${p.label} : ${kg(p.v)}`} style={{ width: `${(p.v / total) * 100}%`, background: p.color }} className="min-w-[3px] first:rounded-l-[4px] last:rounded-r-[4px]" />
          ))}
      </div>
      {showLegend && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
          {parts.map((p) => (
            <span key={p.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
              {p.label} <span className="font-semibold text-ink tabular">{kg(p.v)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Where the money went, as a bridge: sales, minus the cost of what was sold,
 * minus losses, minus transport = profit.
 */
export function MoneyFlow({
  revenue,
  costSold,
  lossValue,
  transport,
  profit,
  leftValue,
  leftKg,
}: {
  revenue: number;
  costSold: number;
  lossValue: number;
  transport: number;
  profit: number;
  leftValue: number;
  leftKg: number;
}) {
  const max = Math.max(revenue, costSold + lossValue + transport, 1);
  let cursor = revenue;
  const rows = [
    { label: "Ventes", value: revenue, from: 0, to: revenue, color: "var(--color-sales)", sign: "" },
    ...[
      { label: "Achat de ce qui est vendu", value: costSold, color: "var(--color-cost)" },
      { label: "Pertes (poisson jeté)", value: lossValue, color: "var(--color-loss)" },
      { label: "Transport", value: transport, color: "var(--color-cost)" },
    ].map((r) => {
      const to = cursor;
      cursor -= r.value;
      return { ...r, from: Math.max(cursor, Math.min(cursor, 0)), to, sign: "− " };
    }),
  ];
  const lo = Math.min(0, profit);
  const span = max - lo || 1;
  const x = (v: number) => ((v - lo) / span) * 100;

  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_7rem]">
          <span className="truncate text-[13px] text-ink-soft">{r.label}</span>
          <div className="relative h-6">
            <div
              className="absolute inset-y-0 rounded-[4px]"
              style={{ left: `${x(Math.min(r.from, r.to))}%`, width: `${Math.max(x(Math.max(r.from, r.to)) - x(Math.min(r.from, r.to)), 0.6)}%`, background: r.color }}
            />
          </div>
          <span className="text-right text-[13px] font-medium text-ink tabular">
            {r.sign}
            {dh(r.value)}
          </span>
        </div>
      ))}
      <div className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-2.5 sm:grid-cols-[12rem_minmax(0,1fr)_7rem]">
        <span className="text-sm font-semibold text-ink">Bénéfice</span>
        <div className="relative h-7">
          <div
            className={cn("absolute inset-y-0 rounded-[4px]", profit >= 0 ? "bg-navy-900" : "bg-rose-600")}
            style={{ left: `${x(Math.min(0, profit))}%`, width: `${Math.max(Math.abs(x(profit) - x(0)), 0.6)}%` }}
          />
        </div>
        <span className={cn("text-right text-base font-bold tabular", profit >= 0 ? "text-ink" : "text-rose-700")}>{dh(profit)}</span>
      </div>
      {leftKg > 0 && (
        <p className="rounded-lg bg-mist-50 px-3 py-2 text-xs text-ink-soft">
          Encore dans le camion : <span className="font-semibold text-ink">{kg(leftKg)}</span> (acheté {dh(leftValue)}), pas encore compté dans le bénéfice.
        </p>
      )}
    </div>
  );
}
