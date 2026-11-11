import { Link } from "react-router";
import { AlertTriangle, ChevronRight, Phone } from "lucide-react";
import { atRisk, shipmentStats, stage } from "@/data/calc";
import { driver, market } from "@/data/catalog";
import type { Bon, Shipment } from "@/data/types";
import { dh, kg } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, StageBadge } from "./ui";
import { JourneyTrack, KgBar } from "./visuals";

/** One truck at a glance: who, where to, how far, how much sold / lost, money so far. */
export function TruckCard({ bon, s, now }: { bon: Bon; s: Shipment; now: number }) {
  const d = driver(s.driverId);
  const m = market(s.marketId);
  const st = stage(s);
  const x = shipmentStats(s, bon);
  const risk = atRisk(s, now);
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4 p-4 transition-shadow hover:shadow-lift", risk && "border-loss/40 ring-2 ring-loss/15")}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-sm font-semibold text-navy-800">
          {d.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{d.name}</p>
          <p className="truncate text-xs text-ink-muted">
            <span className="font-mono">{d.truck}</span> · {bon.number} → {m.city}
          </p>
        </div>
        <StageBadge stage={st} />
      </div>

      <JourneyTrack s={s} now={now} />

      <KgBar sold={x.kgSold} lost={x.kgLost} left={x.kgLeft} />

      {risk && (
        <p className="flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-900">
          <AlertTriangle className="mt-px size-3.5 shrink-0 text-loss" />
          Jour 3 : encore {kg(x.kgLeft)} à vendre, sinon perte.
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <div className="text-xs text-ink-muted">
          Ventes <span className="text-sm font-semibold text-ink tabular">{dh(x.revenue)}</span>
          {st !== "loaded" && st !== "road" && (
            <>
              {" · "}Bénéfice{" "}
              <span className={cn("text-sm font-semibold tabular", x.profit >= 0 ? "text-ink" : "text-rose-700")}>{dh(x.profit)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <a href={`tel:${d.phone.replace(/\s/g, "")}`} aria-label={`Appeler ${d.name}`} className="grid size-9 place-items-center rounded-lg text-sea-700 hover:bg-sea-50">
            <Phone className="size-4" />
          </a>
          <Link to={`/admin/bons/${bon.id}`} aria-label={`Ouvrir ${bon.number}`} className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-mist-100">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
