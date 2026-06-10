// Black Seven TV — Écran de démarrage (splash). Identité visuelle + chargement.

export default function Splash() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="flex items-baseline gap-2 text-6xl font-bold tracking-tight">
        <span className="text-neutral-50">BLACK</span>
        <span className="text-primary-500">7</span>
        <span className="text-neutral-50">TV</span>
      </div>
      <span className="animate-pulse text-xl text-neutral-400">Chargement…</span>
    </div>
  );
}
