const fix = (s: string) => s.replace(/ /g, " ");

const money = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

/** 12 400 DH */
export const dh = (v: number) => `${fix(money.format(Math.round(v)))} DH`;
/** 12,50 DH */
export const dh2 = (v: number) => `${fix(money2.format(v))} DH`;
/** 12,4 k */
export const short = (v: number) => fix(compact.format(v));
/** 50 kg */
export const kg = (v: number) => `${fix(qty.format(v))} kg`;
/** 18,4 % */
export const percent = (r: number) => fix(pct.format(r));

export const time = (d: Date | number) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
export const day = (d: Date | number, opts?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", opts ?? { day: "numeric", month: "short" }).format(d);
export const dayTime = (d: Date | number) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
export const longDay = (d: Date | number) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(d);

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** "il y a 2 h", "il y a 3 j" */
export function ago(t: number, now = Date.now()) {
  const m = Math.round((now - t) / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

/** "2 h 30" */
export function duration(ms: number) {
  const m = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} h${r ? ` ${String(r).padStart(2, "0")}` : ""}` : `${r} min`;
}

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
