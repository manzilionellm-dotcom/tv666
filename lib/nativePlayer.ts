// The Few — Pont vers le lecteur NATIF (ExoPlayer Android via capacitor-video-player).
// Les grandes apps de streaming décodent en natif (H.264/H.265/AC-3) : c'est la
// seule façon fiable de lire l'IPTV. Sur le web (dev), on garde hls.js.
// Import dynamique du plugin pour ne pas casser l'export statique (SSR).

import { Capacitor } from "@capacitor/core";

export function nativePlaybackAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/** Ouvre le flux en plein écran dans ExoPlayer (décodage matériel). */
export async function openNativePlayer(url: string, title?: string): Promise<void> {
  const { CapacitorVideoPlayer } = await import("capacitor-video-player");
  await CapacitorVideoPlayer.initPlayer({
    mode: "fullscreen",
    url,
    playerId: "thefew",
    title: title ?? "",
    exitOnEnd: false,
    loopOnEnd: false,
  });
}

export async function stopNativePlayer(): Promise<void> {
  try {
    const { CapacitorVideoPlayer } = await import("capacitor-video-player");
    await CapacitorVideoPlayer.stopAllPlayers();
  } catch {
    // lecteur déjà fermé : on ignore
  }
}

// Capacitor fournit addListener au runtime, mais le type du plugin ne l'expose
// pas : on le décrit via une interface minimale.
type Listenable = {
  addListener(
    event: string,
    cb: () => void,
  ): Promise<{ remove: () => void }>;
};

/** S'abonne à la sortie / fin du lecteur natif. Renvoie une fonction de nettoyage. */
export async function onNativePlayerExit(cb: () => void): Promise<() => void> {
  const { CapacitorVideoPlayer } = await import("capacitor-video-player");
  const vp = CapacitorVideoPlayer as unknown as Listenable;
  const exit = await vp.addListener("jeepCapVideoPlayerExit", cb);
  const ended = await vp.addListener("jeepCapVideoPlayerEnded", cb);
  return () => {
    exit.remove();
    ended.remove();
  };
}
