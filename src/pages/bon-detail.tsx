import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Anchor, ArrowLeft, Banknote, CheckCircle2, Flag, MapPin, Phone, Trash2, Truck, X } from "lucide-react";
import { atRisk, bonDone, bonStats, shipmentStats, stage } from "@/data/calc";
import { driver, market, product } from "@/data/catalog";
import { useStore } from "@/data/store";
import type { Bon, Loss, Shipment } from "@/data/types";
import { dayTime, dh, dh2, kg, percent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FishPhoto } from "@/components/logo";
import { Badge, Card, Key, SectionTitle, StageBadge } from "@/components/ui";
import { JourneyTrack, KgBar, MoneyFlow } from "@/components/visuals";

export function BonDetailPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const { bons, now } = useStore();
  const bon = bons.find((b) => b.id === id);
  const [photo, setPhoto] = useState<{ loss: Loss; i: number } | null>(null);

  if (!bon) {
    return (
      <Card className="p-10 text-center">
        <p className="text-ink-soft">Ce bon n'existe pas (la démo a peut-être été réinitialisée).</p>
        <Link to="/admin/bons" className="mt-3 inline-block font-medium text-sea-700">
          Voir les bons
        </Link>
      </Card>
    );
  }

  const x = bonStats(bon);
  const done = bonDone(bon);
  const margin = x.revenue > 0 ? x.profit / x.revenue : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <Link to="/admin/bons" className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-soft hover:bg-mist-100">
        <ArrowLeft className="size-4" />
        Bons
      </Link>

      {sp.get("nouveau") && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="size-4 text-emerald-600" />
          Bon créé. {bon.shipments.length > 1 ? "Les camions sont partis" : "Le camion est parti"} : suivez-{bon.shipments.length > 1 ? "les" : "le"} ici et sur le tableau de bord.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-[28px]">{bon.number}</h1>
            {done ? (
              <Badge tone="success">
                <CheckCircle2 aria-hidden />
                Terminé
              </Badge>
            ) : (
              <Badge tone="info">
                <Truck aria-hidden />
                En cours
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[15px] text-ink-soft">
            {bon.port} · {dayTime(bon.at)} · {bon.shipments.length > 1 ? `réparti sur ${bon.shipments.length} camions` : `1 camion`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-muted">{done ? "Bénéfice" : "Bénéfice à ce jour"}</p>
          {x.revenue > 0 || done ? (
            <>
              <p className={cn("text-3xl font-bold tracking-tight tabular", x.profit >= 0 ? "text-ink" : "text-rose-700")}>{dh(x.profit)}</p>
              <p className="text-[13px] text-ink-soft">marge {percent(margin)} des ventes</p>
            </>
          ) : (
            <p className="mt-1 text-lg font-semibold text-ink-soft">Pas encore de ventes</p>
          )}
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fig label="Acheté au port" value={dh(x.purchase)} sub={kg(x.kgLoaded)} color="var(--color-cost)" />
        <Fig label="Vendu" value={dh(x.revenue)} sub={kg(x.kgSold)} color="var(--color-sales)" />
        <Fig label="Pertes" value={dh(x.lossValue)} sub={kg(x.kgLost)} color="var(--color-loss)" />
        <Fig label="Transport" value={dh(x.transport)} sub={`${bon.shipments.length} trajet${bon.shipments.length > 1 ? "s" : ""}`} color="var(--color-cost)" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <SectionTitle title="Où est passé l'argent" subtitle="Des ventes au bénéfice" />
          <div className="mt-4">
            <MoneyFlow
              revenue={x.revenue}
              costSold={x.costSold}
              lossValue={x.lossValue}
              transport={x.transport}
              profit={x.profit}
              leftValue={x.leftValue}
              leftKg={x.kgLeft}
            />
          </div>
        </Card>
        <Card className="overflow-clip lg:col-span-2">
          <div className="p-5 pb-3">
            <SectionTitle title="Marchandise du bon" subtitle="Ce qui est devenu chaque produit" />
          </div>
          <ul className="divide-y divide-border/70">
            {bon.lines.map((l) => {
              const sold = sumKg(bon, (s) => s.sales, l.productId);
              const lost = sumKg(bon, (s) => s.losses, l.productId);
              return (
                <li key={l.productId} className="px-5 py-3">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-ink">{product(l.productId).name}</span>
                    <span className="text-xs text-ink-muted tabular">
                      {kg(l.kg)} × {dh2(l.price)}
                    </span>
                  </div>
                  <KgBar sold={sold} lost={lost} left={Math.max(0, l.kg - sold - lost)} showLegend={false} height="h-2" />
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border px-5 py-3">
            <Key color="var(--color-sales)" label="Vendu" value={kg(x.kgSold)} />
            <Key color="var(--color-loss)" label="Perdu" value={kg(x.kgLost)} />
            <Key color="var(--color-left)" label="Dans le camion" value={kg(x.kgLeft)} />
          </div>
        </Card>
      </div>

      {/* Trucks */}
      {bon.shipments.map((s, i) => (
        <ShipmentSection key={s.id} bon={bon} s={s} n={bon.shipments.length > 1 ? i + 1 : 0} now={now} onPhoto={(loss, j) => setPhoto({ loss, i: j })} />
      ))}

      {photo && <PhotoViewer loss={photo.loss} seed={photo.i} onClose={() => setPhoto(null)} />}
    </div>
  );
}

const sumKg = (bon: Bon, pick: (s: Shipment) => { productId: string; kg: number }[], productId: string) =>
  bon.shipments.reduce((a, s) => a + pick(s).filter((x) => x.productId === productId).reduce((b, x) => b + x.kg, 0), 0);

function Fig({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
        <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: color }} />
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink tabular">{value}</p>
      <p className="text-xs text-ink-muted tabular">{sub}</p>
    </Card>
  );
}

function ShipmentSection({ bon, s, n, now, onPhoto }: { bon: Bon; s: Shipment; n: number; now: number; onPhoto: (l: Loss, i: number) => void }) {
  const d = driver(s.driverId);
  const m = market(s.marketId);
  const x = shipmentStats(s, bon);
  const risk = atRisk(s, now);

  type Ev = { at: number; icon: React.ElementType; tone: string; text: React.ReactNode; loss?: Loss; i?: number };
  const events: Ev[] = [
    { at: s.loadedAt, icon: Anchor, tone: "bg-navy-900", text: <>Chargé au port · {kg(x.kgLoaded)}</> },
    ...(s.departedAt ? [{ at: s.departedAt, icon: Truck, tone: "bg-navy-600", text: <>Départ vers {m.city}</> }] : []),
    ...(s.arrivedAt ? [{ at: s.arrivedAt, icon: MapPin, tone: "bg-sea-600", text: <>Arrivé au {m.name.toLowerCase()}</> }] : []),
    ...s.sales.map((v) => ({
      at: v.at,
      icon: Banknote,
      tone: "bg-sales",
      text: (
        <>
          Vente : {product(v.productId).name} {kg(v.kg)} → <b className="text-ink">{dh(v.amount)}</b>
        </>
      ),
    })),
    ...s.losses.map((l, i) => ({
      at: l.at,
      icon: Trash2,
      tone: "bg-loss",
      text: (
        <>
          Perte : {product(l.productId).name} {kg(l.kg)}
        </>
      ),
      loss: l,
      i,
    })),
    ...(s.closedAt ? [{ at: s.closedAt, icon: Flag, tone: "bg-emerald-600", text: <>Tournée terminée</> }] : []),
  ].sort((a, b) => b.at - a.at);

  const photos = s.losses.filter((l) => l.photo);

  return (
    <Card className={cn("overflow-clip", risk && "border-loss/40")}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border/70 p-5">
        <span className="grid size-11 place-items-center rounded-xl bg-navy-900 text-white">
          <Truck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">
            {n ? `Camion ${n} · ` : ""}
            {d.name}
          </p>
          <p className="text-xs text-ink-muted">
            <span className="font-mono">{d.truck}</span> · {m.name} · {m.km} km
          </p>
        </div>
        <StageBadge stage={stage(s)} />
        <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="grid size-10 place-items-center rounded-xl border border-border text-sea-700 hover:bg-sea-50" aria-label={`Appeler ${d.name}`}>
          <Phone className="size-4" />
        </a>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div className="space-y-5">
          <JourneyTrack s={s} now={now} />
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Marchandise du camion</p>
            <KgBar sold={x.kgSold} lost={x.kgLost} left={x.kgLeft} />
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-mist-50 p-4 text-sm sm:grid-cols-4">
            <Mini label="Ventes" value={dh(x.revenue)} />
            <Mini label="Pertes" value={dh(x.lossValue)} />
            <Mini label="Transport" value={dh(x.transport)} />
            <Mini label="Bénéfice" value={dh(x.profit)} strong negative={x.profit < 0} />
          </dl>
          {photos.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-soft">Photos des pertes ({photos.length})</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((l, i) => (
                  <button key={l.id} type="button" onClick={() => onPhoto(l, i)} className="group relative overflow-hidden rounded-lg ring-1 ring-border">
                    {l.photo && l.photo !== "demo" ? (
                      <img src={l.photo} alt={`Perte ${product(l.productId).name}`} className="h-20 w-28 object-cover" />
                    ) : (
                      <FishPhoto seed={i} className="h-20 w-28" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-navy-950/70 px-1.5 py-0.5 text-left text-[11px] text-white">
                      {product(l.productId).name} · {kg(l.kg)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-soft">Ce qui s'est passé</p>
          <ol className="max-h-[26rem] space-y-0 overflow-y-auto pr-1">
            {events.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                  {i < events.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-[13px] w-px bg-border" />}
                  <span className={cn("relative grid size-7 shrink-0 place-items-center rounded-full text-white", e.tone)}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 pt-0.5 text-[13px] text-ink-soft">
                    <p>{e.text}</p>
                    <p className="text-[11px] text-ink-muted">{dayTime(e.at)}</p>
                    {e.loss?.photo && (
                      <button type="button" onClick={() => onPhoto(e.loss!, e.i ?? 0)} className="mt-1 text-[11px] font-medium text-sea-700 hover:underline">
                        Voir la photo
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Card>
  );
}

function Mini({ label, value, strong, negative }: { label: string; value: string; strong?: boolean; negative?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={cn("tabular", strong ? "font-bold" : "font-medium", negative ? "text-rose-700" : "text-ink")}>{value}</dd>
    </div>
  );
}

function PhotoViewer({ loss, seed, onClose }: { loss: Loss; seed: number; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 grid place-items-center bg-navy-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        {loss.photo && loss.photo !== "demo" ? (
          <img src={loss.photo} alt="" className="max-h-[60vh] w-full object-contain" />
        ) : (
          <FishPhoto seed={seed} className="w-full" />
        )}
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-ink">
              Perte : {product(loss.productId).name} · {kg(loss.kg)}
            </p>
            <p className="text-xs text-ink-muted">{dayTime(loss.at)} · photo prise par le chauffeur</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="grid size-10 place-items-center rounded-xl hover:bg-mist-100">
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
