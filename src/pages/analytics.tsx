import { useMemo, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { bonStats, shipmentStats } from "@/data/calc";
import { DRIVERS, PRODUCTS } from "@/data/catalog";
import { useStore } from "@/data/store";
import type { Bon } from "@/data/types";
import { DAY, dh, kg, percent, short, startOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BarChart, RankBars } from "@/components/charts";
import { CityAnalysis } from "@/components/city-analysis";
import { Card, Key, SectionTitle } from "@/components/ui";

type Period = "jour" | "semaine" | "annee";
const PERIODS: { id: Period; label: string; sub: string }[] = [
  { id: "jour", label: "Jour", sub: "14 derniers jours" },
  { id: "semaine", label: "Semaine", sub: "12 dernières semaines" },
  { id: "annee", label: "Année", sub: "12 derniers mois" },
];

const SALES = "var(--color-sales)";
const COST = "var(--color-cost)";
const LOSS = "var(--color-loss)";
const PROFIT = "#122039";

type Bucket = { label: string; full: string; start: number; end: number };

function buckets(period: Period, now: number): Bucket[] {
  const today = startOfDay(now);
  if (period === "jour") {
    return Array.from({ length: 14 }, (_, i) => {
      const start = today - (13 - i) * DAY;
      return {
        start,
        end: start + DAY,
        label: new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(start),
        full: new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(start),
      };
    });
  }
  if (period === "semaine") {
    const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY;
    return Array.from({ length: 12 }, (_, i) => {
      const start = monday - (11 - i) * 7 * DAY;
      const f = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
      return { start, end: start + 7 * DAY, label: f.format(start), full: `Semaine du ${f.format(start)}` };
    });
  }
  const d = new Date(today);
  return Array.from({ length: 12 }, (_, i) => {
    const s = new Date(d.getFullYear(), d.getMonth() - 11 + i, 1).getTime();
    const e = new Date(d.getFullYear(), d.getMonth() - 10 + i, 1).getTime();
    return {
      start: s,
      end: e,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(s).replace(".", ""),
      full: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(s),
    };
  });
}

/** Everything is counted on the bon's purchase date. */
function totals(bons: Bon[]) {
  const t = { purchase: 0, revenue: 0, lossValue: 0, lossKg: 0, kg: 0, transport: 0, profit: 0, count: bons.length };
  for (const b of bons) {
    const x = bonStats(b);
    t.purchase += x.purchase;
    t.revenue += x.revenue;
    t.lossValue += x.lossValue;
    t.lossKg += x.kgLost;
    t.kg += x.kgLoaded;
    t.transport += x.transport;
    t.profit += x.profit;
  }
  return t;
}

export function AnalyticsPage() {
  const { bons, now } = useStore();
  const [period, setPeriod] = useState<Period>("semaine");
  const [asTable, setAsTable] = useState(false);

  const { rows, sum, first } = useMemo(() => {
    const bs = buckets(period, now);
    const rows = bs.map((b) => {
      const t = totals(bons.filter((x) => x.at >= b.start && x.at < b.end));
      return { label: b.label, full: b.full, ...t };
    });
    const first = bs[0]!.start;
    const sum = totals(bons.filter((x) => x.at >= first && x.at < bs[bs.length - 1]!.end));
    return { rows, sum, first };
  }, [bons, now, period]);

  const inRange = bons.filter((b) => b.at >= first);
  const byProduct = PRODUCTS.map((p) => {
    let revenue = 0;
    let soldKg = 0;
    let lostKg = 0;
    for (const b of inRange)
      for (const s of b.shipments) {
        for (const v of s.sales) if (v.productId === p.id) {
          revenue += v.amount;
          soldKg += v.kg;
        }
        for (const l of s.losses) if (l.productId === p.id) lostKg += l.kg;
      }
    return { label: p.name, value: revenue, lossRate: soldKg + lostKg ? lostKg / (soldKg + lostKg) : 0 };
  }).sort((a, b) => b.value - a.value);

  const byDriver = DRIVERS.map((d) => {
    let profit = 0;
    let lost = 0;
    let loaded = 0;
    for (const b of inRange) for (const s of b.shipments) if (s.driverId === d.id) {
      const x = shipmentStats(s, b);
      profit += x.profit;
      lost += x.kgLost;
      loaded += x.kgLoaded;
    }
    return { label: d.name.split(" ").slice(0, 2).join(" "), value: profit, note: loaded ? `${percent(lost / loaded)} perdu` : undefined };
  }).sort((a, b) => b.value - a.value);

  const margin = sum.revenue ? sum.profit / sum.revenue : 0;
  const sub = PERIODS.find((p) => p.id === period)!.sub;

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Analyse</h1>
          <p className="mt-1 text-[15px] text-ink-soft">Tous les bons : achats, ventes, pertes et bénéfice · {sub}</p>
        </div>
        <div className="inline-flex rounded-xl bg-mist-100 p-1" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={cn("h-9 rounded-lg px-4 text-sm font-medium", period === p.id ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Bons" value={String(sum.count)} sub={kg(sum.kg)} />
        <Stat label="Achats au port" value={dh(sum.purchase)} color={COST} />
        <Stat label="Ventes" value={dh(sum.revenue)} color={SALES} />
        <Stat label="Pertes" value={dh(sum.lossValue)} sub={`${kg(sum.lossKg)} · ${percent(sum.kg ? sum.lossKg / sum.kg : 0)}`} color={LOSS} />
        <Stat label="Transport" value={dh(sum.transport)} color={COST} />
        <Stat label="Bénéfice" value={dh(sum.profit)} sub={`marge ${percent(margin)}`} strong />
      </div>

      <CityAnalysis bons={inRange} />

      {/* Sales vs purchases */}
      <Card className="p-5">
        <SectionTitle
          title="Ventes et achats"
          subtitle="Par date d'achat du bon. Les bons en cours ne sont pas encore tout vendus."
          action={
            <button
              onClick={() => setAsTable((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-soft hover:bg-mist-100"
            >
              {asTable ? <BarChart3 className="size-4" /> : <Table2 className="size-4" />}
              {asTable ? "Graphique" : "Tableau"}
            </button>
          }
        />
        <div className="mt-3 flex flex-wrap gap-4">
          <Key color={SALES} label="Ventes" />
          <Key color={COST} label="Achats au port" />
        </div>
        <div className="mt-4">
          {asTable ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-ink-muted">
                    <th className="py-2 font-medium">Période</th>
                    <th className="py-2 text-right font-medium">Achats</th>
                    <th className="py-2 text-right font-medium">Ventes</th>
                    <th className="py-2 text-right font-medium">Pertes</th>
                    <th className="py-2 text-right font-medium">Bénéfice</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.full} className="border-b border-border/60 last:border-0">
                      <td className="py-2 text-ink first-letter:uppercase">{r.full}</td>
                      <td className="py-2 text-right text-ink-soft tabular">{dh(r.purchase)}</td>
                      <td className="py-2 text-right text-ink-soft tabular">{dh(r.revenue)}</td>
                      <td className="py-2 text-right text-ink-soft tabular">{dh(r.lossValue)}</td>
                      <td className="py-2 text-right font-semibold text-ink tabular">{dh(r.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <BarChart
              rows={rows}
              series={[
                { key: "revenue", name: "Ventes", color: SALES },
                { key: "purchase", name: "Achats", color: COST },
              ]}
              format={dh}
              axis={short}
              height={240}
            />
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="Bénéfice" subtitle="Ventes − achat de ce qui est vendu − pertes − transport" />
          <div className="mt-4">
            <BarChart rows={rows} series={[{ key: "profit", name: "Bénéfice", color: PROFIT }]} format={dh} axis={short} height={190} />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Pertes" subtitle="Poisson jeté (plus de 3 jours), en DH" />
          <div className="mt-4">
            <BarChart rows={rows} series={[{ key: "lossValue", name: "Pertes", color: LOSS }]} format={dh} axis={short} height={190} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="Ventes par produit" subtitle="avec le taux de perte" />
          <div className="mt-4">
            <RankBars
              items={byProduct.slice(0, 8).map((p) => ({ label: p.label, value: p.value, note: `${percent(p.lossRate)} perdu` }))}
              color={SALES}
              format={short}
            />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Bénéfice par chauffeur" subtitle="avec la part de marchandise perdue" />
          <div className="mt-4">
            <RankBars items={byDriver} color={PROFIT} format={short} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color, strong }: { label: string; value: string; sub?: string; color?: string; strong?: boolean }) {
  return (
    <Card className={cn("p-4", strong && "bg-navy-950 text-white")}>
      <p className={cn("flex items-center gap-1.5 text-[13px]", strong ? "text-mist-300" : "text-ink-muted")}>
        {color && <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: color }} />}
        {label}
      </p>
      <p className={cn("mt-1.5 text-lg font-semibold tracking-tight tabular sm:text-xl", strong ? "text-white" : "text-ink")}>{value}</p>
      {sub && <p className={cn("text-xs tabular", strong ? "text-mist-300" : "text-ink-muted")}>{sub}</p>}
    </Card>
  );
}
