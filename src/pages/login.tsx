import { Link, useNavigate } from "react-router";
import { ArrowRight, Smartphone } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, Card } from "@/components/ui";

/** Fake login: this prototype has no accounts. "Se connecter" opens the admin dashboard. */
export function LoginPage() {
  const go = useNavigate();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col">
        <Logo tone="light" />
        <div className="mt-auto max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight">Du port au marché, chaque bon suivi en direct.</h1>
          <p className="mt-4 text-mist-300">Achats au port, camions sur la route, ventes et pertes au marché, bénéfice de chaque bon.</p>
        </div>
        <svg viewBox="0 0 600 120" className="absolute inset-x-0 bottom-0 w-full opacity-40" aria-hidden>
          <path d="M0 60c50-30 100-30 150 0s100 30 150 0 100-30 150 0 100 30 150 0v60H0Z" fill="#00a199" />
          <path d="M0 85c50-25 100-25 150 0s100 25 150 0 100-25 150 0 100 25 150 0v35H0Z" fill="#26c6b6" opacity=".6" />
        </svg>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h2 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">Connexion</h2>
          <p className="mt-1 text-[15px] text-ink-soft">Accédez à votre espace de gestion.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              go("/admin");
            }}
          >
            <label className="block">
              <span className="text-[13px] font-medium text-mist-700">Identifiant</span>
              <input defaultValue="admin" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] outline-none focus:border-sea-400 focus:ring-4 focus:ring-sea-400/15" />
            </label>
            <label className="block">
              <span className="text-[13px] font-medium text-mist-700">Mot de passe</span>
              <input type="password" defaultValue="maquette" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] outline-none focus:border-sea-400 focus:ring-4 focus:ring-sea-400/15" />
            </label>
            <Button type="submit" size="lg" className="w-full">
              Se connecter
              <ArrowRight />
            </Button>
          </form>
          <Card className="mt-6 flex items-center gap-3 border-dashed p-4">
            <Smartphone className="size-5 shrink-0 text-sea-700" />
            <p className="text-[13px] text-ink-soft">
              Maquette : aucune donnée réelle.{" "}
              <Link to="/chauffeur" className="font-medium text-sea-700 underline">
                Voir l'écran du chauffeur
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
