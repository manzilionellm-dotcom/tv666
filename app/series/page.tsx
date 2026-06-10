"use client";

// Black Seven TV — Séries : catégories + séries, puis saisons/épisodes en panneau.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getSeries, getSeriesCategories, getSeriesInfo } from "@/lib/xtream";
import type {
  XtreamCategory,
  XtreamSeries,
  XtreamSeriesInfo,
} from "@/lib/types";
import Focusable from "@/components/tv/Focusable";
import Splash from "@/components/Splash";

export default function SeriesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [series, setSeries] = useState<XtreamSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    title: string;
    info: XtreamSeriesInfo;
  } | null>(null);

  const creds = typeof window !== "undefined" ? loadCredentials() : null;

  const loadSeries = useCallback(
    (categoryId: string) => {
      if (!creds) return;
      setActiveCat(categoryId);
      setLoading(true);
      setError(null);
      getSeries(creds, categoryId)
        .then(setSeries)
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Erreur de chargement."),
        )
        .finally(() => setLoading(false));
    },
    [creds],
  );

  function openSeries(s: XtreamSeries) {
    if (!creds) return;
    getSeriesInfo(creds, s.series_id)
      .then((info) => setDetail({ title: s.name, info }))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Détails indisponibles."),
      );
  }

  useEffect(() => {
    if (!creds) {
      router.replace("/login");
      return;
    }
    setReady(true);
    getSeriesCategories(creds)
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) loadSeries(cats[0].category_id);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erreur de chargement."),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Splash />;

  // Panneau saisons / épisodes.
  if (detail) {
    const seasons = Object.entries(detail.info.episodes || {});
    return (
      <main className="tv-safe tv-scroll flex flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-6">
          <Focusable
            autoFocusOnMount
            onClick={() => setDetail(null)}
            className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
          >
            ← Retour
          </Focusable>
          <h1 className="text-3xl font-semibold text-neutral-50">
            {detail.title}
          </h1>
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
                      )}&name=${encodeURIComponent(`${detail.title} — ${ep.title}`)}`,
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

  return (
    <main className="flex flex-1 overflow-hidden">
      <aside className="tv-scroll w-1/4 max-w-xs overflow-y-auto bg-neutral-900 py-6">
        <h2 className="px-6 pb-4 text-sm uppercase tracking-wider text-neutral-400">
          Séries
        </h2>
        <ul>
          {categories.map((cat) => (
            <li key={cat.category_id}>
              <Focusable
                onClick={() => loadSeries(cat.category_id)}
                className={`block w-full truncate px-6 py-3 text-left text-lg ${
                  activeCat === cat.category_id
                    ? "bg-neutral-800 text-primary-500"
                    : "text-neutral-200"
                }`}
              >
                {cat.category_name}
              </Focusable>
            </li>
          ))}
        </ul>
      </aside>

      <section className="tv-scroll flex-1 overflow-y-auto p-8">
        {error && (
          <p role="alert" className="flex items-center gap-2 text-xl text-error-300">
            <span aria-hidden>⚠️</span>
            {error}
          </p>
        )}
        {!error && loading && (
          <p className="text-xl text-neutral-400">Chargement…</p>
        )}
        {!error && !loading && series.length === 0 && (
          <p className="text-xl text-neutral-400">Aucune série dans cette catégorie.</p>
        )}
        <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-6">
          {series.map((s) => (
            <Focusable
              key={s.series_id}
              onClick={() => openSeries(s)}
              className="flex flex-col overflow-hidden rounded-xl bg-neutral-900 text-left"
            >
              <div className="aspect-[2/3] w-full bg-neutral-800">
                {s.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.cover}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility =
                        "hidden";
                    }}
                  />
                )}
              </div>
              <span className="truncate p-3 text-sm text-neutral-50">{s.name}</span>
            </Focusable>
          ))}
        </div>
      </section>
    </main>
  );
}
