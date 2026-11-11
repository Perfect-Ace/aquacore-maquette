import { cn } from "@/lib/utils";

/** Brand mark from the alpha: a fish over two waves. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-9 shrink-0", className)}>
      <rect width="64" height="64" rx="16" fill="#122039" />
      <rect width="64" height="32" rx="16" fill="#1b2c4f" opacity=".6" />
      <path d="M12 38c5-4 9-4 14 0s9 4 14 0 9-4 14 0" fill="none" stroke="#26c6b6" strokeWidth="4" strokeLinecap="round" />
      <path d="M12 47c5-4 9-4 14 0s9 4 14 0 9-4 14 0" fill="none" stroke="#00a199" strokeWidth="4" strokeLinecap="round" opacity=".55" />
      <path d="M20 26c4-6 10-9 16-9 5 0 8 3 10 6-2 3-5 6-10 6-6 0-12-3-16-3Zm26-3 6-5v10Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className={cn("text-[17px] font-semibold tracking-tight", tone === "light" ? "text-white" : "text-ink")}>AquaCore</span>
    </div>
  );
}

/** Demo illustration for a loss photo (a crate of fish), used when there is no real photo. */
export function FishPhoto({ seed = 0, className }: { seed?: number; className?: string }) {
  const tilt = (seed % 5) * 6 - 12;
  return (
    <svg viewBox="0 0 120 90" className={cn("block", className)} role="img" aria-label="Photo de la perte (exemple)">
      <rect width="120" height="90" fill="#2a323e" />
      <rect x="8" y="30" width="104" height="52" rx="4" fill="#3f4959" />
      <rect x="8" y="30" width="104" height="8" rx="3" fill="#515d6f" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${22 + i * 30} ${52 + (i % 2) * 8}) rotate(${tilt + i * 9})`}>
          <path d="M-14 0c5-7 13-9 20-7 4 1 6 4 7 7-1 3-3 6-7 7-7 2-15 0-20-7Zm21 0 8-6v12Z" fill="#97a3b4" />
          <circle cx="-8" cy="-1" r="1.4" fill="#2a323e" />
        </g>
      ))}
      <rect x="0" y="0" width="120" height="16" fill="#1a2029" opacity=".7" />
      <circle cx="10" cy="8" r="3" fill="#e34948" />
      <text x="18" y="11" fontSize="7" fill="#dfe5ed" fontFamily="Geist, sans-serif">Photo</text>
    </svg>
  );
}
