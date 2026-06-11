"use client";

// The Few — Lecteur vidéo. Mode "hls" (live, .m3u8 via hls.js) ou "file"
// (VOD/séries : fichier direct). Flux chargés directement depuis le serveur
// Xtream (HTTP natif CapacitorHttp sur l'appareil).
//
// Robustesse : chien de garde anti-blocage (timeout), récupération auto sur
// erreur réseau/média, message d'erreur DÉTAILLÉ (code hls.js) + « Réessayer ».

import Hls, { ErrorTypes, type HlsConfig } from "hls.js";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import Focusable from "@/components/tv/Focusable";
import { CapacitorHlsLoader } from "@/lib/hlsCapacitorLoader";

type Props = {
  src: string;
  mode?: "hls" | "file";
  controls?: boolean;
  muted?: boolean;
};

const WATCHDOG_MS = 25000;

export default function Player({
  src,
  mode = "hls",
  controls = false,
  muted = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let recoveries = 0;
    let started = false;

    // Chien de garde : si rien ne démarre, on sort du silence (plus de
    // « Chargement… » infini comme sur la capture).
    const watchdog = window.setTimeout(() => {
      if (!started) {
        setLoading(false);
        setError(
          "⏱️ Le flux ne démarre pas (25 s). Causes probables : codec non supporté par la WebView (H.265/HEVC), serveur IPTV lent/hors-ligne, ou requête bloquée.",
        );
      }
    }, WATCHDOG_MS);

    const onPlaying = () => {
      started = true;
      window.clearTimeout(watchdog);
      setLoading(false);
    };
    video.addEventListener("playing", onPlaying);

    const onFileError = () => {
      window.clearTimeout(watchdog);
      setLoading(false);
      setError(
        "Lecture impossible. Format non supporté par la WebView (mkv / H.265 ?) ou fichier indisponible.",
      );
    };

    if (mode === "file") {
      video.addEventListener("error", onFileError);
      video.src = src;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hlsConfig: Partial<HlsConfig> = {
        lowLatencyMode: false,
        // WebView Capacitor : le worker (blob) est souvent bloqué et fait caler
        // le flux en silence -> transmuxing sur le thread principal, plus fiable.
        enableWorker: false,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 4,
      };
      // Sur appareil : loader natif (CapacitorHttp) qui évite la corruption de la
      // playlist par le patch global (cause de levelParsingError).
      if (Capacitor.isNativePlatform()) {
        hlsConfig.loader = CapacitorHlsLoader;
      }
      hls = new Hls(hlsConfig);
      const inst = hls;
      inst.loadSource(src);
      inst.attachMedia(video);
      inst.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      inst.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        // Tentatives de récupération avant d'abandonner.
        if (data.type === ErrorTypes.NETWORK_ERROR && recoveries < 2) {
          recoveries += 1;
          inst.startLoad();
          return;
        }
        if (data.type === ErrorTypes.MEDIA_ERROR && recoveries < 2) {
          recoveries += 1;
          inst.recoverMediaError();
          return;
        }
        window.clearTimeout(watchdog);
        setLoading(false);
        setError(
          `Lecture impossible (${data.details || data.type}). Flux hors-ligne, codec non supporté, ou requête bloquée.`,
        );
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
    } else {
      queueMicrotask(() => {
        window.clearTimeout(watchdog);
        setLoading(false);
        setError("Lecteur HLS non supporté par cette WebView.");
      });
    }

    return () => {
      window.clearTimeout(watchdog);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onFileError);
      if (hls) hls.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, mode, attempt]);

  function retry() {
    setError(null);
    setLoading(true);
    setAttempt((a) => a + 1);
  }

  return (
    <div className="relative h-full w-full bg-neutral-950">
      <video
        ref={videoRef}
        className="h-full w-full"
        autoPlay
        playsInline
        muted={muted}
        controls={controls}
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="animate-pulse text-2xl text-neutral-200">
            Chargement du flux…
          </span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-12 text-center">
          {/* [I2] : erreur = icône + libellé, jamais la couleur seule. */}
          <span className="text-4xl" aria-hidden>
            ⚠️
          </span>
          <p className="max-w-3xl text-xl text-error-300">{error}</p>
          <Focusable
            autoFocusOnMount
            onClick={retry}
            className="rounded-full border border-primary-500 px-8 py-3 text-lg text-primary-500 hover:bg-primary-500/10"
          >
            Réessayer
          </Focusable>
        </div>
      )}
    </div>
  );
}
