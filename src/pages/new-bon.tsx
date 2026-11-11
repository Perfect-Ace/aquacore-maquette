import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, Check, Minus, Plus, Split, Trash2, Truck } from "lucide-react";
import { DRIVERS, MARKETS, PRODUCTS, market, product } from "@/data/catalog";
import { stage } from "@/data/calc";
import { useStore } from "@/data/store";
import { dh, kg } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button, Card, buttonClasses } from "@/components/ui";

type Line = { productId: string; kg: string; price: string };
type TruckState = { driverId: string; marketId: string; transport: string; kg: Record<string, string> };

const num = (s: string) => {
  const n = Number(s.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const estimate = (marketId: string) => Math.round((market(marketId).km * 2.9) / 50) * 50;

export function NewBonPage() {
  const { addBon, bons } = useStore();
  const go = useNavigate();
  const busy = useMemo(
    () => new Set(bons.flatMap((b) => b.shipments.filter((s) => stage(s) !== "done").map((s) => s.driverId))),
    [bons],
  );
  const freeDrivers = DRIVERS.filter((d) => !busy.has(d.id));
  const [lines, setLines] = useState<Line[]>([]);
  const [trucks, setTrucks] = useState<TruckState[]>([
    { driverId: freeDrivers[0]?.id ?? DRIVERS[0]!.id, marketId: "marrakech", transport: String(estimate("marrakech")), kg: {} },
  ]);
  const [tried, setTried] = useState(false);

  const split = trucks.length > 1;
  const total = lines.reduce((a, l) => a + num(l.kg) * num(l.price), 0);
  const totalKg = lines.reduce((a, l) => a + num(l.kg), 0);
  const assigned = (pid: string) => trucks.reduce((a, t) => a + num(t.kg[pid] ?? ""), 0);

  const errors: string[] = [];
  if (lines.length === 0) errors.push("Ajoutez au moins un produit.");
  if (lines.some((l) => num(l.kg) <= 0 || num(l.price) <= 0)) errors.push("Indiquez le poids et le prix de chaque produit.");
  if (split && lines.some((l) => Math.abs(assigned(l.productId) - num(l.kg)) > 0.01)) errors.push("Répartissez tous les kg entre les camions.");
  if (new Set(trucks.map((t) => t.driverId)).size !== trucks.length) errors.push("Choisissez un chauffeur différent pour chaque camion.");

  const addProduct = (id: string) =>
    setLines((ls) => (ls.some((l) => l.productId === id) ? ls : [...ls, { productId: id, kg: "", price: String(product(id).buy) }]));

  const setTruck = (i: number, patch: Partial<TruckState>) => setTrucks((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const addTruck = () => {
    const next = DRIVERS.find((d) => !busy.has(d.id) && !trucks.some((t) => t.driverId === d.id)) ?? DRIVERS.find((d) => !trucks.some((t) => t.driverId === d.id))!;
    setTrucks((ts) => {
      // First split: truck 1 keeps half, truck 2 takes the other half.
      const halves = ts.length === 1 ? Object.fromEntries(lines.map((l) => [l.productId, String(Math.round(num(l.kg) / 2))])) : {};
      const first = ts.length === 1 ? { ...ts[0]!, kg: Object.fromEntries(lines.map((l) => [l.productId, String(num(l.kg) - Math.round(num(l.kg) / 2))])) } : ts[0]!;
      return [first, ...ts.slice(1), { driverId: next.id, marketId: "casablanca", transport: String(estimate("casablanca")), kg: halves }];
    });
  };

  const submit = () => {
    setTried(true);
    if (errors.length) return;
    const id = addBon({
      lines: lines.map((l) => ({ productId: l.productId, kg: num(l.kg), price: num(l.price) })),
      trucks: trucks.map((t) => ({
        driverId: t.driverId,
        marketId: t.marketId,
        transport: num(t.transport),
        lines: lines.map((l) => ({ productId: l.productId, kg: split ? num(t.kg[l.productId] ?? "") : num(l.kg) })),
      })),
    });
    go(`/admin/bons/${id}?nouveau=1`);
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-up space-y-5">
      <div>
        <Link to="/admin" className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-soft hover:bg-mist-100">
          <ArrowLeft className="size-4" />
          Tableau de bord
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">Nouveau bon</h1>
        <p className="mt-1 text-[15px] text-ink-soft">Ce que vous achetez au port d'Agadir, et le camion qui l'emporte.</p>
      </div>

      {/* 1. Goods */}
      <Card className="overflow-clip">
        <Step n={1} title="Marchandise achetée" hint="Touchez un produit pour l'ajouter." />
        <div className="grid grid-cols-3 gap-2 px-4 sm:grid-cols-5 sm:px-5">
          {PRODUCTS.map((p) => {
            const on = lines.some((l) => l.productId === p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => (on ? setLines((ls) => ls.filter((l) => l.productId !== p.id)) : addProduct(p.id))}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                  on ? "border-sea-400 bg-sea-50 text-sea-900 ring-2 ring-sea-400/30" : "border-border bg-surface text-ink hover:border-mist-300",
                )}
              >
                {p.name}
                <span className="text-[11px] font-normal text-ink-muted">~{p.buy} DH/kg</span>
              </button>
            );
          })}
        </div>

        {lines.length > 0 && (
          <ul className="mt-4 divide-y divide-border/70 border-t border-border/70">
            {lines.map((l, i) => (
              <li key={l.productId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem_auto] sm:px-5">
                <p className="font-medium text-ink">{product(l.productId).name}</p>
                <button
                  type="button"
                  aria-label="Retirer"
                  onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                  className="grid size-9 place-items-center rounded-lg text-mist-500 hover:bg-rose-50 hover:text-rose-600 sm:order-last"
                >
                  <Trash2 className="size-4" />
                </button>
                <NumInput label="Poids" suffix="kg" value={l.kg} invalid={tried && num(l.kg) <= 0} onChange={(v) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, kg: v } : x)))} />
                <NumInput label="Prix" suffix="DH/kg" value={l.price} invalid={tried && num(l.price) <= 0} onChange={(v) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, price: v } : x)))} />
                <p className="col-span-2 text-right text-sm font-semibold text-ink tabular sm:col-span-1">{dh(num(l.kg) * num(l.price))}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-border bg-mist-50/60 px-4 py-3 sm:px-5">
          <span className="text-sm text-ink-soft">
            Total <span className="font-medium text-ink tabular">{kg(totalKg)}</span>
          </span>
          <span className="text-lg font-semibold text-ink tabular">{dh(total)}</span>
        </div>
      </Card>

      {/* 2. Trucks */}
      <Card className="overflow-clip">
        <Step n={2} title={split ? "Camions (bon réparti)" : "Camion"} hint={split ? "Indiquez combien de kg de chaque produit part dans chaque camion." : "Le chauffeur est aussi le vendeur au marché."} />
        <div className="space-y-4 px-4 pb-4 sm:px-5">
          {trucks.map((t, i) => (
            <div key={i} className="rounded-xl border border-border bg-mist-50/40 p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Truck className="size-4 text-sea-700" />
                  Camion {i + 1}
                </p>
                {i > 0 && (
                  <button type="button" onClick={() => setTrucks((ts) => ts.filter((_, j) => j !== i))} className="text-xs font-medium text-rose-700 hover:underline">
                    Retirer ce camion
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[13px] font-medium text-mist-700">Chauffeur-vendeur</span>
                  <select
                    value={t.driverId}
                    onChange={(e) => setTruck(i, { driverId: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[15px] outline-none focus:border-sea-400 focus:ring-4 focus:ring-sea-400/15"
                  >
                    {DRIVERS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.truck}
                        {busy.has(d.id) ? " (en tournée)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-mist-700">Marché</span>
                  <select
                    value={t.marketId}
                    onChange={(e) => setTruck(i, { marketId: e.target.value, transport: String(estimate(e.target.value)) })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[15px] outline-none focus:border-sea-400 focus:ring-4 focus:ring-sea-400/15"
                  >
                    {MARKETS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.city} · {m.km} km
                      </option>
                    ))}
                  </select>
                </label>
                <NumInput label="Transport" suffix="DH" value={t.transport} onChange={(v) => setTruck(i, { transport: v })} block />
              </div>

              {split && lines.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {lines.map((l) => (
                    <NumInput
                      key={l.productId}
                      label={product(l.productId).name}
                      suffix="kg"
                      value={t.kg[l.productId] ?? ""}
                      onChange={(v) => setTruck(i, { kg: { ...t.kg, [l.productId]: v } })}
                      block
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {split && lines.length > 0 && (
            <div className="rounded-xl bg-mist-50 p-3">
              <p className="mb-2 text-xs font-semibold text-ink-soft">Reste à répartir</p>
              <div className="flex flex-wrap gap-2">
                {lines.map((l) => {
                  const rest = num(l.kg) - assigned(l.productId);
                  const ok = Math.abs(rest) < 0.01;
                  return (
                    <span
                      key={l.productId}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-amber-200",
                      )}
                    >
                      {ok ? <Check className="size-3.5" /> : rest > 0 ? <Plus className="size-3.5" /> : <Minus className="size-3.5" />}
                      {product(l.productId).name} {ok ? "réparti" : `${kg(Math.abs(rest))} ${rest > 0 ? "à placer" : "en trop"}`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {trucks.length < 3 && (
            <Button variant="secondary" onClick={addTruck} className="w-full border-dashed">
              <Split />
              Répartir sur un {trucks.length === 1 ? "2e" : "3e"} camion
            </Button>
          )}
        </div>
      </Card>

      {tried && errors.length > 0 && (
        <div role="alert" className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          {errors.map((e) => (
            <p key={e} className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              {e}
            </p>
          ))}
        </div>
      )}

      <div className="sticky bottom-20 z-10 flex flex-col-reverse gap-2 rounded-2xl border border-border bg-surface/95 p-3 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
        <p className="px-1 text-sm text-ink-soft">
          {lines.length} produits · <span className="font-medium text-ink tabular">{kg(totalKg)}</span> ·{" "}
          {trucks.length} {trucks.length > 1 ? "camions" : "camion"}
        </p>
        <div className="flex gap-2">
          <Link to="/admin" className={buttonClasses("secondary", "lg", "flex-1 sm:flex-none")}>
            Annuler
          </Link>
          <Button size="lg" onClick={submit} className="flex-1 sm:flex-none">
            <Check />
            Créer le bon · {dh(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 px-4 pt-4 pb-3 sm:px-5">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-navy-900 text-sm font-semibold text-white">{n}</span>
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="text-[13px] text-ink-muted">{hint}</p>
      </div>
    </div>
  );
}

function NumInput({
  label,
  suffix,
  value,
  onChange,
  invalid,
  block,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  block?: boolean;
}) {
  return (
    <label className={cn("block", !block && "col-span-1")}>
      <span className={cn("text-[11px] font-medium text-mist-700", !block && "sm:sr-only")}>{label}</span>
      <div className="relative mt-1 sm:mt-0">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          aria-label={label}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-surface pr-14 pl-3 text-[15px] text-ink tabular outline-none focus:border-sea-400 focus:ring-4 focus:ring-sea-400/15 aria-invalid:border-rose-400",
            block && "mt-1",
          )}
        />
        <span className={cn("pointer-events-none absolute right-3 text-xs text-ink-muted", block ? "top-[calc(50%+2px)] -translate-y-1/2" : "top-1/2 -translate-y-1/2")}>
          {suffix}
        </span>
      </div>
    </label>
  );
}
