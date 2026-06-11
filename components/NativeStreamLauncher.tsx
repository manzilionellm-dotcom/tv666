"use client";

// The Few — Lance le flux dans le lecteur NATIF (ExoPlayer) plein écran.
// Affiche une attente de marque (pas de « chargement » web) ; le lecteur natif
// recouvre l'écran. À la sortie / fin, on remonte via onExit.

import { useEffect } from "react";
import {
  onNativePlayerExit,
  openNativePlayer,
  stopNativePlayer,
} from "@/lib/nativePlayer";

export default function NativeStreamLauncher({
  url,
  title,
  onExit,
}: {
  url: string;
  title?: string;
  onExit: () => void;
}) {
  useEffect(() => {
    let active = true;
    let cleanup = () => {};

    openNativePlayer(url, title).catch(() => {
      if (active) onExit();
    });
    onNativePlayerExit(() => {
      if (active) onExit();
    }).then((c) => {
      cleanup = c;
    });

    return () => {
      active = false;
      cleanup();
      stopNativePlayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Écran de marque sobre derrière le lecteur natif (rien de « web »).
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-neutral-950">
      <span className="text-5xl font-semibold tracking-[0.18em] text-neutral-50">
        The Few
      </span>
      <span className="mt-3 animate-pulse text-sm tracking-[0.5em] text-primary-500">
        NOT FOR EVERYONE
      </span>
    </main>
  );
}
