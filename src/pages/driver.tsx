import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Banknote, Camera, Check, CheckCircle2, ChevronRight, CircleDashed, Delete, ImageOff, LogOut, MapPin, RotateCcw, Trash2, Truck, X } from "lucide-react";
import { marketDay, shipmentStats, stage } from "@/data/calc";
import { DRIVERS, FRESH_DAYS, market, product } from "@/data/catalog";
import { useStore } from "@/data/store";
import type { Bon, Shipment } from "@/data/types";
import { dh, kg, startOfDay, time } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FishPhoto, LogoMark } from "@/components/logo";

/* ───────────── Who are you? (demo only: the real app uses the driver's login) ───────────── */

export function DriverPickPage() {
  const { bons } = useStore();
  const active = (id: string) => bons.flatMap((b) => b.shipments).find((s) => s.driverId === id && stage(s) !== "done");
  return (
    <DriverFrame>
      <h1 className="text-2xl font-bold tracking-tight">Écran du chauffeur</h1>
      <p className="mt-1 text-base text-ink-soft">Démo : choisissez un chauffeur pour voir son téléphone.</p>
      <ul className="mt-5 space-y-3">
        {DRIVERS.map((d) => {
          const s = active(d.id);
          return (
            <li key={d.id}>
              <Link to={`/chauffeur/${d.id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card active:bg-mist-50">
                <span className="grid size-12 place-items-center rounded-2xl bg-navy-900 text-base font-semibold text-white">
                  {d.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-ink">{d.name}</p>
                  <p className="text-sm text-ink-muted">{s ? `→ ${market(s.marketId).city}` : "Pas de tournée"}</p>
                </div>
                <ChevronRight className="size-6 text-mist-400" />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to="/admin" className="mt-6 inline-flex h-12 items-center gap-2 text-base font-medium text-sea-700">
        <ArrowLeft className="size-5" />
        Retour à l'administration
      </Link>
    </DriverFrame>
  );
}

function DriverFrame({ children, name }: { children: React.ReactNode; name?: string }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-md items-center gap-3 px-4">
          <LogoMark className="size-9" />
          <span className="text-lg font-semibold tracking-tight">AquaCore</span>
          {name && (
            <Link to="/chauffeur" className="ml-auto flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-ink-soft active:bg-mist-100">
              {name.split(" ")[0]}
              <LogOut className="size-5" />
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pt-5 pb-16">{children}</main>
    </div>
  );
}

/* ───────────── The driver's screen ───────────── */

export function DriverPage() {
  const { driverId = "" } = useParams();
  const { bons, now, setArrived, closeShipment } = useStore();
  const d = DRIVERS.find((x) => x.id === driverId);
  const [flow, setFlow] = useState<"sale" | "loss" | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const found = bons.flatMap((bon) => bon.shipments.map((s) => ({ bon, s }))).find(({ s }) => s.driverId === driverId && stage(s) !== "done");

  if (!d) return <DriverFrame>Chauffeur inconnu.</DriverFrame>;
  if (!found) {
    return (
      <DriverFrame name={d.name}>
        <div className="rounded-3xl border border-dashed border-mist-300 bg-surface px-6 py-14 text-center">
          <Truck className="mx-auto size-12 text-mist-400" />
          <p className="mt-4 text-xl font-semibold text-ink">Pas de tournée</p>
          <p className="mt-1 text-base text-ink-soft">Le bureau vous enverra votre prochain chargement ici.</p>
        </div>
      </DriverFrame>
    );
  }

  const { bon, s } = found;
  const m = market(s.marketId);
  const x = shipmentStats(s);
  const arrived = Boolean(s.arrivedAt);
  const dayN = marketDay(s, now);
  const today = startOfDay(now);
  const soldToday = s.sales.filter((v) => v.at >= today).reduce((a, v) => a + v.amount, 0);
  const left = (pid: string) =>
    (s.lines.find((l) => l.productId === pid)?.kg ?? 0) -
    s.sales.filter((v) => v.productId === pid).reduce((a, v) => a + v.kg, 0) -
    s.losses.filter((v) => v.productId === pid).reduce((a, v) => a + v.kg, 0);

  const feed = [
    ...s.sales.map((v) => ({ id: v.id, at: v.at, sale: true, text: `${product(v.productId).name} ${kg(v.kg)}`, amount: v.amount })),
    ...s.losses.map((v) => ({ id: v.id, at: v.at, sale: false, text: `${product(v.productId).name} ${kg(v.kg)}`, amount: 0 })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 6);

  return (
    <DriverFrame name={d.name}>
      {done && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-lg font-semibold text-white">
          <CheckCircle2 className="size-7" />
          {done}
        </div>
      )}

      {/* Where to */}
      <section className="rounded-3xl bg-navy-950 p-5 text-white">
        <p className="text-sm text-mist-300">Votre marché</p>
        <p className="mt-0.5 flex items-center gap-2 text-2xl font-bold">
          <MapPin className="size-6 text-sea-300" />
          {m.city}
        </p>
        <p className="mt-1 text-sm text-mist-300">
          {bon.number} · camion <span className="font-mono">{d.truck}</span>
        </p>
        {arrived && (
          <p className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold", dayN >= FRESH_DAYS ? "bg-loss text-white" : "bg-white/10 text-white")}>
            Jour {dayN} sur {FRESH_DAYS}
            {dayN >= FRESH_DAYS ? " : vendez vite" : ""}
          </p>
        )}
      </section>

      {/* Arrived: red / green */}
      <section className="mt-4">
        {arrived ? (
          <div>
            <div role="status" className="flex min-h-24 items-center gap-4 rounded-3xl bg-emerald-600 px-5 py-4 text-white shadow-sm">
              <CheckCircle2 className="size-11 shrink-0" />
              <div>
                <p className="text-2xl font-bold">Arrivé</p>
                <p className="text-base text-emerald-50">à {time(s.arrivedAt!)}</p>
              </div>
            </div>
            <button onClick={() => setArrived(s.id, false)} className="mt-1 inline-flex h-11 items-center gap-1.5 px-2 text-sm font-medium text-ink-soft active:bg-mist-100">
              <RotateCcw className="size-4" />
              Je me suis trompé : pas encore arrivé
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setArrived(s.id, true);
              setDone(`Bien arrivé à ${m.city}`);
            }}
            className="flex min-h-28 w-full items-center gap-4 rounded-3xl bg-rose-600 px-5 py-4 text-left text-white shadow-sm active:bg-rose-700"
          >
            <CircleDashed className="size-11 shrink-0" />
            <div>
              <p className="text-2xl font-bold">Pas encore arrivé</p>
              <p className="text-base text-rose-50">Appuyez ici quand vous êtes au marché</p>
            </div>
          </button>
        )}
      </section>

      {/* Sale / loss */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <BigAction icon={Banknote} label="Vente" sub="J'ai vendu" className="bg-sea-600 active:bg-sea-700" disabled={!arrived} onClick={() => setFlow("sale")} />
        <BigAction icon={Camera} label="Perte" sub="Photo du poisson" className="bg-loss active:brightness-95" disabled={!arrived} onClick={() => setFlow("loss")} />
      </section>
      {!arrived && <p className="mt-2 text-center text-sm text-ink-muted">Ventes et pertes : après l'arrivée au marché.</p>}

      {/* What's left */}
      <section className="mt-5 rounded-3xl border border-border bg-surface p-4 shadow-card">
        <div className="flex items-baseline justify-between">
          <p className="text-base font-semibold text-ink">Dans le camion</p>
          <p className="text-lg font-bold text-ink tabular">{kg(x.kgLeft)}</p>
        </div>
        <ul className="mt-2 divide-y divide-border/70">
          {s.lines.map((l) => (
            <li key={l.productId} className="flex items-baseline justify-between py-2.5">
              <span className="text-base text-ink">{product(l.productId).name}</span>
              <span className="text-lg font-semibold text-ink tabular">{kg(Math.max(0, left(l.productId)))}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Today */}
      {arrived && (
        <section className="mt-4 rounded-3xl border border-border bg-surface p-4 shadow-card">
          <div className="flex items-baseline justify-between">
            <p className="text-base font-semibold text-ink">Vendu aujourd'hui</p>
            <p className="text-xl font-bold text-ink tabular">{dh(soldToday)}</p>
          </div>
          {feed.length > 0 && (
            <ul className="mt-2 space-y-2">
              {feed.map((f) => (
                <li key={f.id} className="flex items-center gap-3 text-base">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-white", f.sale ? "bg-sea-600" : "bg-loss")}>
                    {f.sale ? <Banknote className="size-4" /> : <Trash2 className="size-4" />}
                  </span>
                  <span className="flex-1 text-ink-soft">{f.text}</span>
                  <span className="font-semibold text-ink tabular">{f.sale ? dh(f.amount) : "perte"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {arrived && (
        <button
          onClick={() => {
            if (confirm("Terminer la tournée ? Tout est vendu ou déclaré ?")) closeShipment(s.id);
          }}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-surface text-lg font-semibold text-ink active:bg-mist-100"
        >
          <Check className="size-5" />
          Tournée terminée
        </button>
      )}

      {flow && (
        <DeclareFlow
          kind={flow}
          bon={bon}
          s={s}
          left={left}
          onClose={() => setFlow(null)}
          onDone={(msg) => {
            setFlow(null);
            setDone(msg);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </DriverFrame>
  );
}

function BigAction({ icon: Icon, label, sub, className, disabled, onClick }: { icon: React.ElementType; label: string; sub: string; className: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("flex min-h-32 flex-col items-center justify-center gap-1 rounded-3xl text-white shadow-sm disabled:bg-mist-300 disabled:shadow-none", className)}
    >
      <Icon className="size-10" />
      <span className="text-2xl font-bold">{label}</span>
      <span className="text-sm opacity-90">{sub}</span>
    </button>
  );
}

/* ───────────── Declare a sale or a loss, one big step at a time ───────────── */

function DeclareFlow({
  kind,
  bon,
  s,
  left,
  onClose,
  onDone,
}: {
  kind: "sale" | "loss";
  bon: Bon;
  s: Shipment;
  left: (pid: string) => number;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const { addSale, addLoss } = useStore();
  const sale = kind === "sale";
  const steps = sale ? (["product", "kg", "amount"] as const) : (["photo", "product", "kg"] as const);
  const [i, setI] = useState(0);
  const [pid, setPid] = useState("");
  const [kgStr, setKg] = useState("");
  const [amount, setAmount] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const step = steps[i]!;
  const n = (v: string) => Number(v.replace(",", ".")) || 0;
  void bon;

  const next = () => (i < steps.length - 1 ? setI(i + 1) : finish());
  const finish = () => {
    if (sale) {
      addSale(s.id, { productId: pid, kg: n(kgStr), amount: n(amount) });
      onDone(`Vente enregistrée : ${dh(n(amount))}`);
    } else {
      addLoss(s.id, { productId: pid, kg: n(kgStr), photo: photo ?? undefined });
      onDone(`Perte déclarée : ${kg(n(kgStr))}`);
    }
  };

  const canGo = step === "product" ? Boolean(pid) : step === "kg" ? n(kgStr) > 0 : step === "amount" ? n(amount) > 0 : true;
  const titles = {
    photo: "Prenez une photo du poisson perdu",
    product: sale ? "Quel poisson avez-vous vendu ?" : "Quel poisson est perdu ?",
    kg: "Combien de kilos ?",
    amount: "Combien d'argent ?",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className={cn("flex h-16 items-center gap-3 px-4 text-white", sale ? "bg-sea-600" : "bg-loss")}>
        <button onClick={i ? () => setI(i - 1) : onClose} aria-label="Retour" className="grid size-11 place-items-center rounded-xl active:bg-white/15">
          {i ? <ArrowLeft className="size-6" /> : <X className="size-6" />}
        </button>
        <p className="text-xl font-bold">{sale ? "Vente" : "Perte"}</p>
        <div className="ml-auto flex gap-1.5">
          {steps.map((_, j) => (
            <span key={j} className={cn("h-2 w-6 rounded-full", j <= i ? "bg-white" : "bg-white/35")} />
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 pt-5 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-ink">{titles[step]}</h2>

        {step === "photo" && <PhotoStep photo={photo} onPhoto={setPhoto} />}

        {step === "product" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {s.lines.map((l) => (
              <button
                key={l.productId}
                onClick={() => {
                  setPid(l.productId);
                  setI(i + 1);
                }}
                className={cn(
                  "flex min-h-24 flex-col items-start justify-center rounded-2xl border-2 bg-surface p-4 text-left active:bg-mist-50",
                  pid === l.productId ? "border-navy-900" : "border-border",
                )}
              >
                <span className="text-xl font-bold text-ink">{product(l.productId).name}</span>
                <span className="text-base text-ink-muted tabular">reste {kg(Math.max(0, left(l.productId)))}</span>
              </button>
            ))}
          </div>
        )}

        {step === "kg" && (
          <Keypad
            value={kgStr}
            onChange={setKg}
            unit="kg"
            chips={[5, 10, 20, 50].map(String).concat(String(Math.max(0, Math.round(left(pid) * 10) / 10)))}
            chipLabel={(c, k) => (k === 4 ? `Tout (${c})` : c)}
          />
        )}

        {step === "amount" && (
          <>
            <Keypad value={amount} onChange={setAmount} unit="DH" hint={`${product(pid).name} · ${kg(n(kgStr))}`} />
            <PriceCheck productId={pid} kgSold={n(kgStr)} amount={n(amount)} />
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-6">
        {step !== "product" && (
          <button
            onClick={next}
            disabled={!canGo}
            className={cn(
              "flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-xl font-bold text-white disabled:bg-mist-300",
              sale ? "bg-sea-600 active:bg-sea-700" : "bg-loss active:brightness-95",
            )}
          >
            {i === steps.length - 1 ? (
              <>
                <Check className="size-6" />
                {sale ? "Enregistrer la vente" : "Déclarer la perte"}
              </>
            ) : step === "photo" && !photo ? (
              <>
                <ImageOff className="size-6" />
                Continuer sans photo
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="size-6" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/** Shows the price per kg, and warns when it is far from the usual price (typing mistake). */
function PriceCheck({ productId, kgSold, amount }: { productId: string; kgSold: number; amount: number }) {
  if (!amount || !kgSold) return null;
  const perKg = amount / kgSold;
  const usual = product(productId).sell;
  const odd = perKg > usual * 2 || perKg < usual * 0.4;
  return (
    <p
      className={cn(
        "mt-3 rounded-2xl px-4 py-3 text-base",
        odd ? "border-2 border-amber-300 bg-amber-50 font-semibold text-amber-950" : "bg-mist-100 text-ink-soft",
      )}
    >
      {odd ? "Vérifiez le montant : " : "Soit "}
      <span className="tabular">{dh(perKg)} par kg</span>
      {odd && ` (d'habitude ≈ ${dh(usual)} par kg)`}
    </p>
  );
}

function PhotoStep({ photo, onPhoto }: { photo?: string; onPhoto: (p?: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  /** Shrink the photo (max 720 px) so the demo can keep it in the browser. */
  const read = (file: File) => {
    setBusy(true);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 720 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      onPhoto(c.toDataURL("image/jpeg", 0.7));
      URL.revokeObjectURL(img.src);
      setBusy(false);
    };
    img.onerror = () => setBusy(false);
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="mt-4">
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
      {photo ? (
        <div className="overflow-hidden rounded-3xl border border-border">
          <img src={photo} alt="Photo de la perte" className="max-h-80 w-full object-cover" />
          <button onClick={() => input.current?.click()} className="flex h-14 w-full items-center justify-center gap-2 bg-surface text-base font-semibold text-ink active:bg-mist-100">
            <RotateCcw className="size-5" />
            Reprendre la photo
          </button>
        </div>
      ) : (
        <button
          onClick={() => input.current?.click()}
          className="flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-loss/50 bg-orange-50 text-orange-900 active:bg-orange-100"
        >
          <span className="grid size-20 place-items-center rounded-full bg-loss text-white">
            <Camera className="size-10" />
          </span>
          <span className="text-xl font-bold">{busy ? "…" : "Ouvrir l'appareil photo"}</span>
        </button>
      )}
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-mist-100 p-3 text-sm text-ink-soft">
        <FishPhoto className="h-12 w-16 shrink-0 rounded-lg" />
        Photographiez le poisson avant de le jeter. Le bureau la verra tout de suite.
      </div>
    </div>
  );
}

function Keypad({
  value,
  onChange,
  unit,
  chips,
  chipLabel,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  chips?: string[];
  chipLabel?: (c: string, i: number) => string;
  hint?: string;
}) {
  const press = (k: string) => {
    if (k === "del") return onChange(value.slice(0, -1));
    if (k === "," && value.includes(",")) return;
    if (value.length >= 7) return;
    onChange(value === "0" && k !== "," ? k : value + k);
  };
  return (
    <div className="mt-4 flex flex-1 flex-col">
      {hint && <p className="text-base text-ink-muted">{hint}</p>}
      <div className="mt-2 flex items-baseline justify-center gap-2 rounded-3xl bg-surface py-6 shadow-card ring-1 ring-border">
        <span className="text-6xl font-bold tracking-tight text-ink tabular">{value || "0"}</span>
        <span className="text-2xl font-semibold text-ink-muted">{unit}</span>
      </div>
      {chips && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <button key={i} onClick={() => onChange(c.replace(".", ","))} className="h-11 rounded-full bg-mist-100 px-4 text-base font-semibold text-ink active:bg-mist-200">
              {chipLabel ? chipLabel(c, i) : c}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "del"].map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k === "del" ? "Effacer" : k}
            className="grid h-16 place-items-center rounded-2xl bg-surface text-2xl font-semibold text-ink shadow-card ring-1 ring-border active:bg-mist-100"
          >
            {k === "del" ? <Delete className="size-7" /> : k}
          </button>
        ))}
      </div>
    </div>
  );
}

