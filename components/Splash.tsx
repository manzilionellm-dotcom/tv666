// The Few — Écran de démarrage (splash). Identité visuelle + chargement.
// Wordmark texte provisoire : sera remplacé par la signature SVG (BrandLogo)
// dès que the-few-or.svg sera disponible dans public/.

export default function Splash() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-neutral-950">
      <div className="flex flex-col items-center leading-none">
        <span className="text-6xl font-semibold tracking-[0.18em] text-neutral-50">
          The Few
        </span>
        <span className="mt-4 text-base tracking-[0.5em] text-primary-500">
          NOT FOR EVERYONE
        </span>
      </div>
      <span className="animate-pulse text-lg text-neutral-400">Chargement…</span>
    </div>
  );
}
