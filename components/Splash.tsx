// The Few — Écran de démarrage (splash) : vrai logo + chargement discret.

import Logo from "@/components/ui/Logo";

export default function Splash() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-bg">
      <Logo size="lg" />
      <span className="animate-pulse text-base tracking-[0.3em] text-muted-dim">
        CHARGEMENT…
      </span>
    </div>
  );
}
