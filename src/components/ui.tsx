import { Anchor, CheckCircle2, MapPin, PackageCheck, Truck } from "lucide-react";
import type { Stage } from "@/data/types";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-border/80 bg-surface shadow-card", className)} {...props} />;
}

const variants = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-hover active:bg-navy-950",
  accent: "bg-accent text-white shadow-sm shadow-sea-900/10 hover:bg-accent-strong active:bg-sea-700",
  secondary: "bg-surface text-ink border border-border shadow-sm hover:bg-mist-50 hover:border-mist-300",
  ghost: "text-ink-soft hover:bg-mist-100 hover:text-ink",
} as const;
const sizes = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
} as const;

export function buttonClasses(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; size?: keyof typeof sizes }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

const tones = {
  neutral: "bg-mist-100 text-mist-700 ring-mist-200",
  info: "bg-navy-50 text-navy-700 ring-navy-100",
  accent: "bg-sea-50 text-sea-800 ring-sea-100",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  warning: "bg-amber-50 text-amber-800 ring-amber-100",
  danger: "bg-rose-50 text-rose-800 ring-rose-100",
} as const;

export function Badge({ tone = "neutral", className, children }: { tone?: keyof typeof tones; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const STAGES: Record<Stage, { label: string; short: string; icon: React.ElementType; tone: keyof typeof tones }> = {
  loaded: { label: "Chargement au port", short: "Au port", icon: Anchor, tone: "neutral" },
  road: { label: "En route", short: "En route", icon: Truck, tone: "info" },
  market: { label: "Au marché", short: "Au marché", icon: MapPin, tone: "accent" },
  done: { label: "Terminé", short: "Terminé", icon: CheckCircle2, tone: "success" },
};

/** Status always shows an icon + a label, never color alone. */
export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const s = STAGES[stage];
  const Icon = s.icon;
  return (
    <Badge tone={s.tone} className={className}>
      <Icon aria-hidden />
      {s.short}
    </Badge>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Small legend chip: colored square + text in ink (text never wears the series color). */
export function Key({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
      {value && <span className="font-semibold text-ink tabular">{value}</span>}
    </span>
  );
}

export { PackageCheck };
