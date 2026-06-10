"use client";

// Black Seven TV — Détail d'une série : saisons / épisodes + favori.

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getSeriesInfo } from "@/lib/xtream";
import type { XtreamSeriesInfo } from "@/lib/types";
import Focusable from "@/components/tv/Focusable";
import FavButton from "@/components/FavButton";
import Splash from "@/components/Splash";

export default function SeriesDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const seriesId = params?.id;
  const name = search.get("name") ?? "Série";
  const [info, setInfo] = useState<XtreamSeriesInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds || !seriesId) {
      router.replace("/series");
      return;
    }
    getSeriesInfo(creds, Number(seriesId))
      .then(setInfo)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Détails indisponibles."),
      );
  }, [seriesId, router]);

  if (error) {
    return (
      <main className="tv-safe flex flex-1 flex-col gap-6">
        <Focusable
          autoFocusOnMount
          onClick={() => router.push("/series")}
          className="self-start rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
        >
          ← Retour
        </Focusable>
        <p role="alert" className="flex items-center gap-2 text-xl text-error-300">
          <span aria-hidden>⚠️</span>
          {error}
        </p>
      </main>
    );
  }

  if (!info) return <Splash />;

  const seasons = Object.entries(info.episodes || {});

  return (
    <main className="tv-safe tv-scroll flex flex-1 flex-col gap-6 overflow-y-auto">
      <div className="flex flex-wrap items-center gap-4">
        <Focusable
          autoFocusOnMount
          onClick={() => router.push("/series")}
          className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
        >
          ← Retour
        </Focusable>
        <h1 className="text-3xl font-semibold text-neutral-50">{name}</h1>
        <FavButton item={{ type: "series", id: String(seriesId), name }} />
      </div>

      {seasons.length === 0 && (
        <p className="text-xl text-neutral-400">Aucun épisode disponible.</p>
      )}
      {seasons.map(([season, episodes]) => (
        <section key={season} className="flex flex-col gap-3">
          <h2 className="text-xl text-neutral-200">Saison {season}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {episodes.map((ep) => (
              <Focusable
                key={ep.id}
                onClick={() =>
                  router.push(
                    `/play?kind=series&id=${encodeURIComponent(
                      ep.id,
                    )}&ext=${encodeURIComponent(
                      ep.container_extension,
                    )}&name=${encodeURIComponent(`${name} — ${ep.title}`)}`,
                  )
                }
                className="rounded-xl bg-neutral-900 p-4 text-left"
              >
                <span className="text-sm text-neutral-400">
                  Épisode {ep.episode_num}
                </span>
                <span className="block truncate text-lg text-neutral-50">
                  {ep.title}
                </span>
              </Focusable>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
