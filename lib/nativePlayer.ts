// The Few — Pont vers le lecteur NATIF libVLC (plugin Capacitor « Vlc »).
// libVLC décode TOUT en logiciel si besoin (H.265/HEVC, AC-3…) — c'est le
// lecteur le plus complet au monde, indépendant du décodeur matériel de la box.
// Sur le web (dev), on garde hls.js (composant Player).

import { Capacitor, registerPlugin } from "@capacitor/core";

interface VlcPlugin {
  /** Ouvre l'URL en plein écran dans libVLC (Activity native dédiée). */
  play(options: { url: string; title?: string; live?: boolean }): Promise<void>;
}

const Vlc = registerPlugin<VlcPlugin>("Vlc");

export function nativePlaybackAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function playNative(
  url: string,
  opts?: { title?: string; live?: boolean },
): Promise<void> {
  await Vlc.play({ url, title: opts?.title, live: opts?.live ?? true });
}
