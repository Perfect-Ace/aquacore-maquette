import { useMemo, useState } from "react";
import { MapPin, ThumbsUp, Trash2 } from "lucide-react";
import { MARKETS, PRODUCTS } from "@/data/catalog";
import type { Bon } from "@/data/types";
import { dh, kg, percent, short } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, SectionTitle } from "./ui";

/** One product in one city: what was sold, lost and earned (before transport). */
type Cell = { revenue: number; soldKg: number; lostKg: number; lossValue: number; profit: number };
const empty = (): Cell => ({ revenue: 0, soldKg: 0, lostKg: 0, lossValue: 0, profit: 0 });

type Metric = "profit" | "loss" | "revenue";
const METRICS: { id: Metric; label: string; hint: string }[] = [
  { id: "profit", label: "Bénéfice", hint: "Ventes − achat de ce qui est vendu − pertes (avant transport)" },
  { id: "loss", label: "Pertes", hint: "Part des kg jetés (plus de 3 jours)" },
  { id: "revenue", label: "Ventes", hint: "Chiffre d'affaires en DH" },
];

const lossRate = (c: Cell) => (c.soldKg + c.lostKg > 0 ? c.lostKg / (c.soldKg + c.lostKg) : 0);

/* Color scales (one hue light → dark; profit is diverging around zero with a gray midpoint). */
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i]! - v) * t)).join(",")})`;
};
const SEQ = { revenue: ["#e3f8f4", "#046b67"], loss: ["#fff1e8", "#b4441a"] } as const;
const POS = ["#eef4f3", "#046b67"] as const;
const NEG = ["#fbeff1", "#be123c"] as const;

function cellStyle(metric: Metric, v: number, max: number, maxNeg: number, min = 0) {
  let t = 0;
  let bg: string;
  if (metric === "profit") {
    if (v >= 0) {
      t = max ? v / max : 0;
      bg = mix(POS[0], POS[1], t);
    } else {
      t = maxNeg ? Math.abs(v) / maxNeg : 0;
      bg = mix(NEG[0], NEG[1], t);
    }
  } else {
    // Stretched from the lowest to the highest value, so the gaps between cities stand out.
    t = max > min ? (v - min) / (max - min) : 0;
    bg = mix(SEQ[metric][0], SEQ[metric][1], t);
  }
  return { background: bg, color: t > 0.55 ? "#fff" : "var(--color-ink)" };
}

export function CityAnalysis({ bons }: { bons: Bon[] }) {
  const [metric, setMetric] = useState<Metric>("profit");
  const [city, setCity] = useState<string | null>(null);
  const [sel, setSel] = useState<{ m: string; p: string } | null>(null);

  const data = useMemo(() => {
    const cells = new Map<string, Cell>(); // `${market}|${product}`
    const cities = new Map<string, { revenue: number; profit: number; transport: number; kgLoaded: number; lostKg: number; trips: number }>();
    for (const m of MARKETS) cities.set(m.id, { revenue: 0, profit: 0, transport: 0, kgLoaded: 0, lostKg: 0, trips: 0 });
    for (const b of bons) {
      const price = (pid: string) => b.lines.find((l) => l.productId === pid)?.price ?? 0;
      for (const s of b.shipments) {
        const c = cities.get(s.marketId)!;
        c.trips++;
        c.transport += s.transport;
        c.kgLoaded += s.lines.reduce((a, l) => a + l.kg, 0);
        for (const v of s.sales) {
          const k = `${s.marketId}|${v.productId}`;
          const cell = cells.get(k) ?? empty();
          cell.revenue += v.amount;
          cell.soldKg += v.kg;
          cell.profit += v.amount - v.kg * price(v.productId);
          cells.set(k, cell);
        }
        for (const l of s.losses) {
          const k = `${s.marketId}|${l.productId}`;
          const cell = cells.get(k) ?? empty();
          cell.lostKg += l.kg;
          cell.lossValue += l.kg * price(l.productId);
          cell.profit -= l.kg * price(l.productId);
          cells.set(k, cell);
          c.lostKg += l.kg;
        }
      }
    }
    for (const [k, cell] of cells) {
      const c = cities.get(k.split("|")[0]!)!;
      c.revenue += cell.revenue;
      c.profit += cell.profit;
    }
    for (const c of cities.values()) c.profit -= c.transport;
    return { cells, cities };
  }, [bons]);

  const at = (m: string, p: string) => data.cells.get(`${m}|${p}`);
  const value = (c: Cell) => (metric === "profit" ? c.profit : metric === "loss" ? lossRate(c) : c.revenue);
  const fmt = (v: number) => (metric === "loss" ? percent(v) : short(v));
  const all = [...data.cells.values()].map(value);
  const max = Math.max(0, ...all);
  const maxNeg = Math.abs(Math.min(0, ...all));
  const min = metric === "profit" ? 0 : Math.min(...all);

  const markets = [...MARKETS].sort((a, b) => data.cities.get(b.id)!.profit - data.cities.get(a.id)!.profit);
  const products = PRODUCTS.filter((p) => MARKETS.some((m) => at(m.id, p.id)));

  /** Best product (most profit) and the most-lost product of a city. */
  const highlights = (marketId: string) => {
    const list = products.map((p) => ({ p, c: at(marketId, p.id) })).filter((x): x is { p: (typeof PRODUCTS)[number]; c: Cell } => Boolean(x.c && x.c.soldKg > 0));
    const best = [...list].sort((a, b) => b.c.profit - a.c.profit)[0];
    const worst = [...list].sort((a, b) => lossRate(b.c) - lossRate(a.c))[0];
    return { best, worst };
  };

  const shownMarkets = city ? markets.filter((m) => m.id === city) : markets;

  return (
    <section className="space-y-3">
      <SectionTitle title="Par ville" subtitle="Comment ça marche dans chaque marché, et sur quels produits" />

      {/* City cards */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 xl:grid-cols-5 [scrollbar-width:none]">
        {markets.map((m, rank) => {
          const c = data.cities.get(m.id)!;
          const rate = c.kgLoaded ? c.lostKg / c.kgLoaded : 0;
          const { best, worst } = highlights(m.id);
          const on = city === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setCity(on ? null : m.id)}
              aria-pressed={on}
              className={cn(
                "w-64 shrink-0 snap-start rounded-card border bg-surface p-4 text-left shadow-card transition-shadow hover:shadow-lift sm:w-auto",
                on ? "border-navy-900 ring-2 ring-navy-900/15" : "border-border/80",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-semibold text-ink">
                  <MapPin className="size-4 text-sea-700" />
                  {m.city}
                </p>
                <span className="rounded-md bg-mist-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft tabular">n° {rank + 1}</span>
              </div>
              <p className={cn("mt-2 text-xl font-semibold tracking-tight tabular", c.profit < 0 ? "text-rose-700" : "text-ink")}>{dh(c.profit)}</p>
              <p className="text-xs text-ink-muted">
                bénéfice · {c.trips} tournées · marge {percent(c.revenue ? c.profit / c.revenue : 0)}
              </p>

              <div className="mt-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-ink-soft">Pertes</span>
                  <span className="font-semibold text-ink tabular">
                    {percent(rate)} · {kg(c.lostKg)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-mist-100">
                  <div className="h-full rounded-full bg-loss" style={{ width: `${Math.min(rate / 0.1, 1) * 100}%` }} />
                </div>
              </div>

              <div className="mt-3 space-y-1 border-t border-border/70 pt-2.5 text-xs">
                {best && (
                  <p className="flex items-center gap-1.5 text-ink-soft">
                    <ThumbsUp className="size-3.5 shrink-0 text-sea-700" />
                    <span className="truncate">
                      Meilleur : <b className="text-ink">{best.p.name}</b> ({short(best.c.profit)})
                    </span>
                  </p>
                )}
                {worst && lossRate(worst.c) > 0 && (
                  <p className="flex items-center gap-1.5 text-ink-soft">
                    <Trash2 className="size-3.5 shrink-0 text-loss" />
                    <span className="truncate">
                      Plus perdu : <b className="text-ink">{worst.p.name}</b> ({percent(lossRate(worst.c))})
                    </span>
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* City × product grid */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">
              Produits par ville{city ? ` · ${MARKETS.find((m) => m.id === city)!.city}` : ""}
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-muted">{METRICS.find((m) => m.id === metric)!.hint}</p>
          </div>
          <div className="inline-flex rounded-xl bg-mist-100 p-1" role="tablist">
            {METRICS.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={metric === m.id}
                onClick={() => setMetric(m.id)}
                className={cn("h-8 rounded-lg px-3 text-[13px] font-medium", metric === m.id ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink")}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] table-fixed border-separate border-spacing-[3px] text-[13px]">
            <thead>
              <tr>
                <th className="w-28 text-left text-xs font-medium text-ink-muted">Produit</th>
                {shownMarkets.map((m) => (
                  <th key={m.id} className="px-1 pb-1 text-center text-xs font-semibold text-ink">
                    {m.city}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="pr-2 text-ink-soft">{p.name}</td>
                  {shownMarkets.map((m) => {
                    const c = at(m.id, p.id);
                    if (!c || c.soldKg + c.lostKg === 0)
                      return (
                        <td key={m.id} className="h-10 rounded-[4px] bg-mist-50 text-center text-mist-300">
                          —
                        </td>
                      );
                    const v = value(c);
                    return (
                      <td
                        key={m.id}
                        title={`${p.name} à ${m.city} — ventes ${dh(c.revenue)} · ${kg(c.soldKg)} vendus · ${kg(c.lostKg)} perdus (${percent(lossRate(c))}) · bénéfice ${dh(c.profit)}`}
                        onClick={() => setSel(sel?.m === m.id && sel.p === p.id ? null : { m: m.id, p: p.id })}
                        className={cn(
                          "h-10 cursor-pointer rounded-[4px] text-center font-semibold tabular",
                          sel?.m === m.id && sel.p === p.id && "outline-2 outline-offset-1 outline-navy-900",
                        )}
                        style={cellStyle(metric, v, max, maxNeg, min)}
                      >
                        {fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail of the tapped cell (hover doesn't exist on phones) */}
        {sel && at(sel.m, sel.p) && (() => {
          const c = at(sel.m, sel.p)!;
          return (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-mist-50 p-3 text-[13px] sm:grid-cols-5">
              <p className="col-span-2 font-semibold text-ink sm:col-span-1">
                {PRODUCTS.find((p) => p.id === sel.p)!.name} · {MARKETS.find((m) => m.id === sel.m)!.city}
              </p>
              <p className="text-ink-soft">Ventes <b className="text-ink tabular">{dh(c.revenue)}</b></p>
              <p className="text-ink-soft">Vendu <b className="text-ink tabular">{kg(c.soldKg)}</b></p>
              <p className="text-ink-soft">Perdu <b className="text-ink tabular">{kg(c.lostKg)} ({percent(lossRate(c))})</b></p>
              <p className="text-ink-soft">Bénéfice <b className={cn("tabular", c.profit < 0 ? "text-rose-700" : "text-ink")}>{dh(c.profit)}</b></p>
            </div>
          );
        })()}

        {/* Scale legend */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          {metric === "profit" ? (
            <>
              <span>Perte d'argent</span>
              <span className="h-2.5 w-16 rounded-[3px]" style={{ background: `linear-gradient(90deg, ${NEG[1]}, ${NEG[0]})` }} />
              <span className="h-2.5 w-16 rounded-[3px]" style={{ background: `linear-gradient(90deg, ${POS[0]}, ${POS[1]})` }} />
              <span>Plus de bénéfice</span>
            </>
          ) : (
            <>
              <span>{metric === "loss" ? "Peu de pertes" : "Peu de ventes"}</span>
              <span className="h-2.5 w-24 rounded-[3px]" style={{ background: `linear-gradient(90deg, ${SEQ[metric][0]}, ${SEQ[metric][1]})` }} />
              <span>{metric === "loss" ? "Beaucoup de pertes" : "Beaucoup de ventes"}</span>
            </>
          )}
          <span className="ml-auto">Touchez une case pour le détail · touchez une ville pour la voir seule</span>
        </div>
      </Card>
    </section>
  );
}
