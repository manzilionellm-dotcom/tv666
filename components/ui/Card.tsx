// The Few — Carte : fond --card, bordure discrète, filet d'accent or en haut.

import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border border-line-soft bg-card ${className}`}
    >
      {/* Filet d'accent en haut (transparent → or → transparent). */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      {children}
    </div>
  );
}
