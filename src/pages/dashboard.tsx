import { Link } from "react-router";
import { AlertTriangle, Anchor, ArrowRight, Fish, Plus, ShoppingBasket, Trash2, TrendingUp, Truck } from "lucide-react";
import { atRisk, bonDone, bonStats, shipmentStats, stage } from "@/data/calc";
import { driver, market } from "@/data/catalog";
import { useStore } from "@/data/store";
import { DAY, dh, kg, longDay, startOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TruckCard } from "@/components/truck-card";
import { Card, SectionTitle, StageBadge, buttonClasses } from "@/components/ui";
import { KgBar, RouteBoard } from "@/components/visuals";

export function DashboardPage() {
  const { bons, now } = useStore();
  const today = startOfDay(now);
  const yesterday = today - DAY;

  const all = bons.flatMap((bon) => bon.shipments.map((s) => ({ bon, s })));
  const live = all.filter(({ s }) => stage(s) !== "done");

  // Today's figures, compared with yesterday.
  const inDay = (t: number, start: number) => t >= start && t < start + DAY;
  const fig = (start: number) => {
    const bought = bons.filter((b) => inDay(b.at, start)).reduce((a, b) => a + bonStats(b).purchase, 0);
    let sold = 0;
    let lostKg = 0;
    let lostDh = 0;
    for (const { bon, s } of all) {
      for (const v of s.sales) if (inDay(v.at, start)) sold += v.amount;
      for (const l of s.losses)
        if (inDay(l.at, start)) {
          lostKg += l.kg;
          lostDh += l.kg * (bon.lines.find((x) => x.productId === l.productId)?.price ?? 0);
        }
    }
    return { bought, sold, lostKg, lostDh };
  };
  const t = fig(today);
  const y = fig(yesterday);

  const risky = live.filter(({ s }) => atRisk(s, now));
  const loading = live.filter(({ s }) => stage(s) === "loaded");
  const recent = bons.slice(0, 6);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-ink-muted first-letter:uppercase">{longDay(now)}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Bonjour Anas</h1>
          <p className="mt-1 text-[15px] text-ink-soft">
            {live.length} camions en activité · {risky.length > 0 ? `${risky.length} à surveiller` : "rien à signaler"}
          </p>
        </div>
        <Link to="/admin/bons/nouveau" className={buttonClasses("accent", "lg")}>
          <Plus />
          Nouveau bon
        </Link>
      </div>

      {/* Today */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={ShoppingBasket} label="Achats au port" value={dh(t.bought)} prev={y.bought} cur={t.bought} />
        <Tile icon={TrendingUp} label="Ventes du jour" value={dh(t.sold)} prev={y.sold} cur={t.sold} good="up" />
        <Tile icon={Trash2} label="Pertes du jour" value={dh(t.lostDh)} sub={kg(t.lostKg)} prev={y.lostDh} cur={t.lostDh} good="down" />
        <Tile icon={Truck} label="Camions actifs" value={String(live.length)} sub={`${live.filter(({ s }) => stage(s) === "road").length} en route`} />
      </div>

      {/* Alerts */}
      {(risky.length > 0 || loading.length > 0) && (
        <div className="grid gap-2 md:grid-cols-2">
          {risky.map(({ bon, s }) => (
            <Link
              key={s.id}
              to={`/admin/bons/${bon.id}`}
              className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950 hover:bg-orange-100/70"
            >
              <AlertTriangle className="size-5 shrink-0 text-loss" />
              <span className="flex-1">
                <b>{driver(s.driverId).name}</b> à {market(s.marketId).city} : jour 3, encore{" "}
                <b className="tabular">{kg(shipmentStats(s).kgLeft)}</b> à vendre.
              </span>
              <ArrowRight className="size-4" />
            </Link>
          ))}
          {loading.map(({ bon, s }) => (
            <Link
              key={s.id}
              to={`/admin/bons/${bon.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-soft hover:bg-mist-50"
            >
              <Anchor className="size-5 shrink-0 text-navy-700" />
              <span className="flex-1">
                <b className="text-ink">{driver(s.driverId).name}</b> charge le {bon.number} au port, direction {market(s.marketId).city}.
              </span>
              <ArrowRight className="size-4" />
            </Link>
          ))}
        </div>
      )}

      {/* Route board + list */}
      <div className="grid gap-5 xl:grid-cols-5">
        <Card className="p-4 xl:col-span-3">
          <SectionTitle title="Où sont les camions" subtitle="En direct, du port d'Agadir aux marchés" />
          <div className="mt-3">
            <RouteBoard items={all} now={now} />
          </div>
        </Card>
        <Card className="flex flex-col p-4 xl:col-span-2">
          <SectionTitle title="Camions en activité" subtitle={`${live.length} camions`} />
          <ul className="mt-3 divide-y divide-border/70">
            {live.map(({ bon, s }) => {
              const x = shipmentStats(s, bon);
              return (
                <li key={s.id}>
                  <Link to={`/admin/bons/${bon.id}`} className="flex items-center gap-3 rounded-lg px-1 py-3 hover:bg-mist-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">{driver(s.driverId).name}</p>
                        {atRisk(s, now) && <AlertTriangle className="size-3.5 shrink-0 text-loss" aria-label="À surveiller" />}
                      </div>
                      <p className="truncate text-xs text-ink-muted">
                        {bon.number} → {market(s.marketId).city}
                      </p>
                      <div className="mt-1.5">
                        <KgBar sold={x.kgSold} lost={x.kgLost} left={x.kgLeft} showLegend={false} height="h-1.5" />
                      </div>
                    </div>
                    <StageBadge stage={stage(s)} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Truck cards */}
      <section className="space-y-3">
        <SectionTitle title="Suivi détaillé" subtitle="Chaque camion, du port à la fin de la vente" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {live.map(({ bon, s }) => (
            <TruckCard key={s.id} bon={bon} s={s} now={now} />
          ))}
        </div>
      </section>

      {/* Recent bons */}
      <section className="space-y-3">
        <SectionTitle
          title="Derniers bons"
          action={
            <Link to="/admin/bons" className="text-sm font-medium text-sea-700 hover:text-sea-800">
              Tout voir
            </Link>
          }
        />
        <Card className="divide-y divide-border/70 overflow-clip">
          {recent.map((bon) => {
            const x = bonStats(bon);
            const done = bonDone(bon);
            return (
              <Link key={bon.id} to={`/admin/bons/${bon.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 hover:bg-mist-50 sm:grid-cols-[10rem_minmax(0,1fr)_8rem_8rem]">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-ink">{bon.number}</p>
                  <p className="text-xs text-ink-muted">
                    {kg(x.kgLoaded)} · {bon.shipments.length > 1 ? `${bon.shipments.length} camions` : market(bon.shipments[0]!.marketId).city}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <KgBar sold={x.kgSold} lost={x.kgLost} left={x.kgLeft} showLegend={false} height="h-2" />
                </div>
                <p className="hidden text-right text-sm text-ink-soft tabular sm:block">{dh(x.purchase)}</p>
                <p className={cn("text-right text-sm font-semibold tabular", done ? (x.profit >= 0 ? "text-ink" : "text-rose-700") : "text-ink-muted")}>
                  {done ? dh(x.profit) : "en cours"}
                </p>
              </Link>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  prev,
  cur,
  good,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  prev?: number;
  cur?: number;
  good?: "up" | "down";
}) {
  const delta = prev && cur !== undefined ? (cur - prev) / prev : null;
  const positive = delta !== null && (good === "down" ? delta < 0 : delta > 0);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[13px] text-ink-muted">
        <span className="grid size-7 place-items-center rounded-lg bg-sea-50 text-sea-700">
          <Icon className="size-4" />
        </span>
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-ink tabular sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        {sub}
        {delta !== null && good && (
          <span className={cn("font-medium", positive ? "text-emerald-700" : "text-rose-700")}>
            {sub ? " · " : ""}
            {delta > 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 100))} % vs hier
          </span>
        )}
      </p>
    </Card>
  );
}

export { Fish };
