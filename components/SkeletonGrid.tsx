"use client";

// The Few — Squelette de chargement : cartes fantômes qui pulsent (perception
// de vitesse façon Netflix), à la place d'un texte « Chargement… ».

export default function SkeletonGrid({
  count = 9,
  variant = "row",
}: {
  count?: number;
  variant?: "row" | "poster";
}) {
  const items = Array.from({ length: count });
  if (variant === "poster") {
    return (
      <div
        aria-hidden
        className="grid animate-pulse grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-6"
      >
        {items.map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-neutral-900">
            <div className="aspect-[2/3] w-full bg-neutral-800" />
            <div className="m-3 h-4 rounded bg-neutral-800" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl bg-neutral-900 p-4"
        >
          <span className="h-12 w-12 shrink-0 rounded bg-neutral-800" />
          <span className="h-5 flex-1 rounded bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}
