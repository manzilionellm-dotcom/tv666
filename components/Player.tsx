"use client";

// Black Seven TV — Lecteur vidéo. Mode "hls" (live, .m3u8 via hls.js) ou "file"
// (VOD/séries : fichier mp4/mkv direct). Flux servis via le proxy /api/stream.

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  mode?: "hls" | "file";
  controls?: boolean;
};

export default function Player({ src, mode = "hls", controls = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // L'état initial (loading=true) est garanti frais via key={src} côté parent,
    // donc pas de reset synchrone ici.
    let hls: Hls | null = null;

    const onPlaying = () => setLoading(false);
    const onFileError = () =>
      setError(
        "Lecture impossible. Format non supporté par le navigateur (mkv ?) ou fichier indisponible.",
      );
    video.addEventListener("playing", onPlaying);

    if (mode === "file") {
      // VOD : fichier direct, le navigateur gère le téléchargement progressif + seek.
      video.addEventListener("error", onFileError);
      video.src = src;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: false, enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          setLoading(false);
          setError(
            "Lecture impossible. Le flux est peut-être hors-ligne, ou le format n'est pas compatible navigateur.",
          );
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
    } else {
      // Cas rare (aucun support HLS) : sortie d'erreur hors du flux synchrone.
      queueMicrotask(() => {
        setLoading(false);
        setError("Lecteur HLS non supporté par ce navigateur.");
      });
    }

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onFileError);
      if (hls) hls.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, mode]);

  return (
    <div className="relative h-full w-full bg-neutral-950">
      <video
        ref={videoRef}
        className="h-full w-full"
        autoPlay
        playsInline
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-12 text-center">
          {/* [I2] : erreur = icône + libellé, jamais la couleur seule. */}
          <span className="text-4xl" aria-hidden>
            ⚠️
          </span>
          <p className="max-w-2xl text-xl text-error-300">{error}</p>
        </div>
      )}
    </div>
  );
}
