"use client";

// The Few — Fiche film (panel get_vod_info) : affiche large, synopsis, durée,
// note, genre + actions Lire / Favori / À regarder plus tard.

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getVodInfo } from "@/lib/xtream";
import type { XtreamVodInfo } from "@/lib/types";
import { isWatchLater, toggleWatchLater } from "@/lib/watchlater";
import Focusable from "@/components/tv/Focusable";
import FavButton from "@/components/FavButton";
import Splash from "@/components/Splash";

function year(release?: string): string {
  if (!release) return "";
  const y = release.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "";
}

function Detail() {
  const router = useRouter();
  const search = useSearchParams();
  const id = search.get("id");
  const ext = search.get("ext") ?? "mp4";
  const name = search.get("name") ?? "Film";
  const [info, setInfo] = useState<XtreamVodInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [later, setLater] = useState(false);

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds || !id) {
      router.replace("/vod");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLater(isWatchLater("movie", id));
    getVodInfo(creds, Number(id))
      .then(setInfo)
      .catch(() => setFailed(true));
  }, [id, router]);

  if (!id) return <Splash />;
  // Le panel ne répond pas : on propose quand même la lecture (jamais bloquant).
  if (!info && !failed) return <Splash />;

  const i = info?.info;
  const backdrop = i?.backdrop_path?.[0] || i?.movie_image || "";
  const meta = [
    year(i?.releasedate),
    i?.duration,
    i?.genre,
    i?.rating ? `★ ${i.rating}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="relative flex flex-1 flex-col justify-end overflow-hidden bg-neutral-950">
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />

      <div className="tv-safe relative flex flex-col gap-5">
        <h1 className="max-w-4xl text-4xl font-semibold text-neutral-50">
          {name}
        </h1>
        {meta && <p className="text-lg text-primary-500">{meta}</p>}
        {i?.plot && (
          <p className="max-w-3xl text-lg leading-relaxed text-neutral-200">
            {i.plot}
          </p>
        )}
        {(i?.director || i?.cast) && (
          <p className="max-w-3xl text-base text-neutral-400">
            {i?.director ? `Réalisation : ${i.director}` : ""}
            {i?.director && i?.cast ? " · " : ""}
            {i?.cast ? `Avec : ${i.cast}` : ""}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Focusable
            autoFocusOnMount
            onClick={() =>
              router.push(
                `/play?kind=movie&id=${id}&ext=${encodeURIComponent(
                  ext,
                )}&name=${encodeURIComponent(name)}`,
              )
            }
            className="rounded-full bg-primary-500 px-10 py-4 text-xl font-semibold text-neutral-950 hover:bg-primary-400"
          >
            ▶ Lire
          </Focusable>
          <FavButton item={{ type: "movie", id, name, ext }} />
          <Focusable
            aria-pressed={later}
            onClick={() =>
              setLater(toggleWatchLater({ type: "movie", id, name, ext }))
            }
            className={`flex items-center gap-2 rounded-full border px-6 py-3 text-lg ${
              later
                ? "border-primary-500 bg-primary-500/10 text-primary-500"
                : "border-neutral-700 text-neutral-50 hover:bg-neutral-800"
            }`}
          >
            🕒 {later ? "Dans À regarder" : "À regarder plus tard"}
          </Focusable>
          <Focusable
            onClick={() => router.back()}
            className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
          >
            ← Retour
          </Focusable>
        </div>
      </div>
    </main>
  );
}

export default function VodDetailPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Detail />
    </Suspense>
  );
}
