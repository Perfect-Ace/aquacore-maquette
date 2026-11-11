import { NavLink, Outlet, Link } from "react-router";
import { BarChart3, ClipboardList, LayoutDashboard, LogOut, Plus, RotateCcw, Smartphone } from "lucide-react";
import { useStore } from "@/data/store";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "./logo";

const NAV = [
  { to: "/admin", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard, end: true },
  { to: "/admin/bons", label: "Bons", short: "Bons", icon: ClipboardList },
  { to: "/admin/analyse", label: "Analyse", short: "Analyse", icon: BarChart3 },
];

export function AdminShell() {
  const { reset } = useStore();
  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy-950 text-white lg:flex">
        <div className="px-5 pt-5 pb-6">
          <Logo tone="light" />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-mist-300 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <n.icon className="size-[18px]" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <Link to="/chauffeur" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-mist-300 hover:bg-white/5 hover:text-white">
            <Smartphone className="size-[18px]" />
            Écran chauffeur
          </Link>
          <button onClick={reset} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-mist-300 hover:bg-white/5 hover:text-white">
            <RotateCcw className="size-[18px]" />
            Réinitialiser la démo
          </button>
          <Link to="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-mist-300 hover:bg-white/5 hover:text-white">
            <LogOut className="size-[18px]" />
            Se déconnecter
          </Link>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/admin" className="flex items-center gap-2 lg:hidden">
              <LogoMark className="size-8" />
              <span className="font-semibold tracking-tight">AquaCore</span>
            </Link>
            <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 sm:inline">
              Maquette : données d'exemple
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-sea-400 to-sea-600 text-[13px] font-semibold text-white">
                AF
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav with a central "+" */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-safe backdrop-blur lg:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {NAV.slice(0, 2).map((n) => (
            <MobileItem key={n.to} {...n} />
          ))}
          <Link to="/admin/bons/nouveau" aria-label="Nouveau bon" className="mx-auto -mt-6 grid size-14 place-items-center rounded-2xl bg-accent text-white shadow-pop active:bg-sea-700">
            <Plus className="size-6" />
          </Link>
          <MobileItem {...NAV[2]!} />
          <MobileItem to="/chauffeur" short="Chauffeur" icon={Smartphone} />
        </div>
      </nav>
    </div>
  );
}

function MobileItem({ to, short, icon: Icon, end }: { to: string; short: string; icon: React.ElementType; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-[11px] font-medium", isActive ? "text-sea-700" : "text-ink-muted")}
    >
      <Icon className="size-5" />
      {short}
    </NavLink>
  );
}
