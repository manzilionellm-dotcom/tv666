"use client";

// The Few — Logo. Vrai fichier /the-few-logo.jpg (or sur noir) : on le fond sur
// les surfaces sombres via mix-blend-lighten (le noir disparaît, l'or reste).
// Repli typographique or si le fichier est absent.

import { useState } from "react";

export default function Logo({
  size = "md",
  productLabel = false,
}: {
  size?: "sm" | "md" | "lg";
  productLabel?: boolean;
}) {
  const [imgOk, setImgOk] = useState(true);
  const w = { sm: "w-36", md: "w-52", lg: "w-80" }[size];
  const text = { sm: "text-2xl", md: "text-4xl", lg: "text-6xl" }[size];

  return (
    <div className="flex flex-col items-center leading-none">
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/the-few-logo.jpg"
          alt="The Few — Not for everyone"
          className={`${w} h-auto object-contain mix-blend-lighten`}
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="flex flex-col items-center">
          <span className={`font-display ${text} italic tracking-wide text-gold`}>
            The&nbsp;Few
          </span>
          <span className="mt-2 text-[0.62rem] uppercase tracking-[0.42em] text-muted">
            Not for everyone
          </span>
        </div>
      )}
      {productLabel && (
        <span className="mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-gold">
          DEFEW TV
        </span>
      )}
    </div>
  );
}
