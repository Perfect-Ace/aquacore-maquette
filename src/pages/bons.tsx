import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, Plus, Search } from "lucide-react";
import { bonDone, bonStats, stage } from "@/data/calc";
import { driver, market } from "@/data/catalog";
import { useStore } from "@/data/store";
import { day, dh, kg } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, StageBadge, buttonClasses } from "@/components/ui";
import { KgBar } from "@/components/visuals";

const TABS = [
  { id: "live", label: "En cours" },
  { id: "done", label: "Terminés" },
  { id: "all", label: "Tous" },
] as const;

export function BonsPage() {
  const { bons } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("live");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(30);

  const filtered = bons.filter((b) => {
    if (tab === "live" && bonDone(b)) return false;
    if (tab === "done" && !bonDone(b)) return false;
    if (!q.trim()) return true;
    const t = q.trim().toLowerCase();
    return (
      b.number.toLowerCase().includes(t) ||
      b.shipments.some((s) => driver(s.driverId).name.toLowerCase().includes(t) || market(s.marketId).city.toLowerCase().includes(t))
    );
  });
  const count = (id: string) => bons.filter((b) => (id === "live" ? !bonDone(b) : id === "done" ? bonDone(b) : true)).length;

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Bons</h1>
          <p className="mt-1 text-[15px] text-ink-soft">Chaque achat au port, du camion jusqu'au bénéfice.</p>
        </div>
        <Link to="/admin/bons/nouveau" className={buttonClasses("accent", "md")}>
          <Plus />
          <span className="hidden sm:inline">Nouveau bon</span>
          <span className="sm:hidden">Nouveau</span>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex self-start rounded-xl bg-mist-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn("flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium", tab === t.id ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink")}
            >
              {t.label}
              <span className="rounded-md bg-mist-200/70 px-1.5 text-xs text-ink-muted tabular">{count(t.id)}</span>
            </button>
          ))}
        </div>
        <label className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mist-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="N° de bon, chauffeur, ville…"
            className="h-11 w-full rounded-xl border border-border bg-surface pr-3 pl-10 text-[15px] outline-none focus:border-sea-400 focus:ring-4 focus:ring-sea-400/15"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.slice(0, limit).map((b) => {
          const x = bonStats(b);
          const done = bonDone(b);
          return (
            <Link key={b.id} to={`/admin/bons/${b.id}`}>
              <Card className="group flex h-full flex-col gap-3 p-4 transition-shadow hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-semibold text-ink">{b.number}</p>
                    <p className="text-xs text-ink-muted first-letter:uppercase">{day(b.at, { weekday: "short", day: "numeric", month: "short" })} · {kg(x.kgLoaded)}</p>
                  </div>
                  <ChevronRight className="size-4 text-mist-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <ul className="space-y-1.5">
                  {b.shipments.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="truncate text-ink-soft">
                        {driver(s.driverId).name.split(" ")[0]} → {market(s.marketId).city}
                      </span>
                      <StageBadge stage={stage(s)} />
                    </li>
                  ))}
                </ul>
                <KgBar sold={x.kgSold} lost={x.kgLost} left={x.kgLeft} showLegend={false} height="h-2" />
                <div className="mt-auto flex items-baseline justify-between border-t border-border/70 pt-3 text-xs text-ink-muted">
                  <span>
                    Acheté <span className="font-medium text-ink tabular">{dh(x.purchase)}</span>
                  </span>
                  <span>
                    {done ? "Bénéfice " : "À ce jour "}
                    <span className={cn("text-sm font-semibold tabular", x.profit >= 0 ? "text-ink" : "text-rose-700")}>{dh(x.profit)}</span>
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      {filtered.length > limit && (
        <div className="text-center">
          <button onClick={() => setLimit((l) => l + 30)} className={buttonClasses("secondary", "md")}>
            Voir plus ({filtered.length - limit})
          </button>
        </div>
      )}
      {filtered.length === 0 && <Card className="p-10 text-center text-ink-soft">Aucun bon ne correspond.</Card>}
    </div>
  );
}
