"use client";

// Black Seven TV — Lecteur plein écran d'une chaîne live + "en cours" (EPG) +
// favori + catch-up (replay) si la chaîne dispose de l'archive (tv_archive).

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import {
  decodeEpg,
  getShortEpg,
  liveStreamUrl,
  timeshiftUrl,
  toTimeshiftStart,
} from "@/lib/xtream";
import { addRecent } from "@/lib/recent";
import { nativePlaybackAvailable } from "@/lib/nativePlayer";
import Player from "@/components/Player";
import NativeStreamLauncher from "@/components/NativeStreamLauncher";
import FavButton from "@/components/FavButton";
import Focusable from "@/components/tv/Focusable";
import Splash from "@/components/Splash";

const REPLAY_OFFSETS = [
  { label: "Direct", min: 0 },
  { label: "-30 min", min: 30 },
  { label: "-1 h", min: 60 },
  { label: "-2 h", min: 120 },
];

function Watch() {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const name = params.get("name") ?? "";
  const hasArchive = params.get("arch") === "1";
  const streamId = idParam ? Number(idParam) : NaN;

  const [now, setNow] = useState<string>("");
  const [offset, setOffset] = useState(0); // minutes en arrière ; 0 = direct
  const [replayStart, setReplayStart] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds || Number.isNaN(streamId)) {
      router.replace("/live");
      return;
    }
    setMounted(true);
    addRecent({
      type: "live",
      id: String(streamId),
      name,
      arch: hasArchive ? 1 : 0,
    });
    getShortEpg(creds, streamId, 1)
      .then((res) => {
        const first = res.epg_listings?.[0];
        if (first) setNow(decodeEpg(first.title));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le calcul de la date de départ (Date.now, impur) se fait dans un effet.
  useEffect(() => {
    if (offset === 0) {
      setReplayStart(null);
      return;
    }
    setReplayStart(toTimeshiftStart(Math.floor(Date.now() / 1000) - offset * 60));
  }, [offset]);

  // Source : direct ou timeshift selon l'offset choisi.
  const src = useMemo(() => {
    if (!mounted) return null;
    const creds = loadCredentials();
    if (!creds || Number.isNaN(streamId)) return null;
    if (offset === 0 || !replayStart) return liveStreamUrl(creds, streamId);
    return timeshiftUrl(creds, streamId, replayStart, 120);
  }, [mounted, streamId, offset, replayStart]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") {
        e.preventDefault();
        router.push("/live");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!src) return <Splash />;

  // Appareil : lecteur natif ExoPlayer (décodage matériel H.264/H.265/AC-3).
  if (nativePlaybackAvailable()) {
    return (
      <NativeStreamLauncher
        url={src}
        title={name}
        onExit={() => router.push("/live")}
      />
    );
  }

  return (
    <main className="relative flex flex-1 bg-neutral-950">
      <Player key={src} src={src} />
      <div className="pointer-events-none absolute left-0 top-0 w-full bg-gradient-to-b from-neutral-950/80 to-transparent p-8">
        <h1 className="text-3xl font-semibold text-neutral-50">{name}</h1>
        {now && <p className="mt-1 text-xl text-neutral-200">En cours : {now}</p>}
        {offset > 0 && (
          <p className="mt-1 text-lg text-primary-500">
            Replay · il y a {offset >= 60 ? `${offset / 60} h` : `${offset} min`}
          </p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 flex w-full flex-wrap items-center gap-3 bg-gradient-to-t from-neutral-950/80 to-transparent p-8">
        <FavButton item={{ type: "live", id: String(streamId), name }} />
        {hasArchive &&
          REPLAY_OFFSETS.map((o) => (
            <Focusable
              key={o.min}
              onClick={() => setOffset(o.min)}
              aria-pressed={offset === o.min}
              className={`rounded-full border px-5 py-3 text-lg ${
                offset === o.min
                  ? "border-primary-500 bg-primary-500/10 text-primary-500"
                  : "border-neutral-700 text-neutral-50 hover:bg-neutral-800"
              }`}
            >
              {o.label}
            </Focusable>
          ))}
      </div>
    </main>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Watch />
    </Suspense>
  );
}
