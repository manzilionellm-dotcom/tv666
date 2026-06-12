"use client";

// The Few — Lance le flux dans libVLC natif (Activity plein écran dédiée).
// On déclenche la lecture puis on remet la liste derrière (onExit) : quand
// l'utilisateur quitte VLC avec « Retour », il retombe sur la liste.

import { useEffect } from "react";
import { playNative } from "@/lib/nativePlayer";

export default function NativeStreamLauncher({
  url,
  title,
  live = true,
  onExit,
}: {
  url: string;
  title?: string;
  live?: boolean;
  onExit: () => void;
}) {
  useEffect(() => {
    let active = true;
    playNative(url, { title, live }).finally(() => {
      if (active) onExit();
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Écran de marque sobre le temps que VLC s'ouvre par-dessus.
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
