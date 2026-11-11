import { useState } from "react";
import { cn } from "@/lib/utils";

export type Series = { key: string; name: string; color: string };
type Row = { label: string; full: string } & Record<string, number | string>;

/** Rounded "nice" axis maximum and 4 ticks. */
function ticks(max: number, min = 0) {
  const span = Math.max(max - min, 1);
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(v);
  return { lo, hi, out };
}

/**
 * Vertical bars, one group per period (one or two series side by side). Values may be negative:
 * bars then hang below a zero line. Hover (or tap) a period to read every value.
 */
export function BarChart({
  rows,
  series,
  format,
  axis,
  height = 220,
}: {
  rows: Row[];
  series: Series[];
  format: (v: number) => string;
  axis: (v: number) => string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const values = rows.flatMap((r) => series.map((s) => Number(r[s.key])));
  const { lo, hi, out } = ticks(Math.max(0, ...values), Math.min(0, ...values));
  const y = (v: number) => ((hi - v) / (hi - lo)) * 100;
  const zero = y(0);
  const h = hover !== null ? rows[hover] : null;
  const labelEvery = rows.length > 16 ? 3 : rows.length > 10 ? 2 : 1;

  return (
    <div>
      <div className="relative" style={{ height }}>
        {/* Grid + axis labels (recessive) */}
        {out.map((v) => (
          <div key={v} className="absolute inset-x-0 flex items-center" style={{ top: `${y(v)}%` }}>
            <span className="w-11 shrink-0 -translate-y-1/2 pr-2 text-right text-[10px] text-ink-muted tabular">{axis(v)}</span>
            <span className={cn("h-px flex-1 -translate-y-1/2", v === 0 ? "bg-mist-400" : "bg-chart-grid")} />
          </div>
        ))}
        {/* Bars */}
        <div className="absolute inset-y-0 right-0 left-11 flex">
          {rows.map((r, i) => (
            <div
              key={i}
              className={cn("relative flex h-full min-w-0 flex-1 cursor-default justify-center gap-[2px] px-[3px] sm:px-1.5", hover === i && "bg-mist-100/70")}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
            >
              {series.map((s) => {
                const v = Number(r[s.key]);
                const top = v >= 0 ? y(v) : zero;
                const bottom = v >= 0 ? zero : y(v);
                return (
                  <div key={s.key} className="relative h-full min-w-0 flex-1" style={{ maxWidth: 28 }}>
                    <div
                      className={cn("absolute inset-x-0", v >= 0 ? "rounded-t-[4px]" : "rounded-b-[4px]")}
                      style={{ top: `${top}%`, height: `max(${bottom - top}%, ${v === 0 ? 0 : 2}px)`, background: s.color }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        {/* Tooltip */}
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-pop"
            style={{
              left: `${((hover + 0.5) / rows.length) * 100}%`,
              transform: hover > rows.length / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="mb-1 font-semibold text-ink first-letter:uppercase">{h.full}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4 text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-ink tabular">{format(Number(h[s.key]))}</span>
              </p>
            ))}
          </div>
        )}
        </div>
      </div>
      {/* X labels */}
      <div className="ml-11 flex">
        {rows.map((r, i) => (
          <span key={i} className="flex-1 truncate pt-1.5 text-center text-[10px] text-ink-muted">
            {i % labelEvery === 0 ? r.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Ranked horizontal bars with the value written at the end (direct labels). */
export function RankBars({ items, color, format }: { items: { label: string; value: number; note?: string }[]; color: string; format: (v: number) => string }) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
          <span className="truncate text-ink-soft">{it.label}</span>
          <div className="h-2.5 rounded-[4px] bg-mist-100">
            <div className="h-full rounded-[4px]" style={{ width: `${(Math.max(it.value, 0) / max) * 100}%`, background: color }} />
          </div>
          <span className="text-right text-ink tabular">
            <span className="font-semibold">{format(it.value)}</span>
            {it.note && <span className="ml-1.5 text-xs text-ink-muted">{it.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
