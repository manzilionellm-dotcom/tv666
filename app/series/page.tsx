"use client";

// Black Seven TV — Séries : catégories (gauche) + séries (grille). Le détail
// (saisons/épisodes) est sur /series/[id].

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getSeries, getSeriesCategories } from "@/lib/xtream";
import { categoryLocked } from "@/lib/parental";
import type { XtreamCategory, XtreamSeries } from "@/lib/types";
import Focusable from "@/components/tv/Focusable";
import PinPrompt from "@/components/PinPrompt";
import Splash from "@/components/Splash";
import SkeletonGrid from "@/components/SkeletonGrid";

export default function SeriesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [series, setSeries] = useState<XtreamSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<XtreamCategory | null>(null);

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

  function onCategory(cat: XtreamCategory) {
    if (categoryLocked(cat.category_name)) {
      setPinFor(cat);
      return;
    }
    loadSeries(cat.category_id);
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
        const first = cats.find((c) => !categoryLocked(c.category_name));
        if (first) loadSeries(first.category_id);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erreur de chargement."),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Splash />;

  return (
    <main className="flex flex-1 overflow-hidden">
      {pinFor && (
        <PinPrompt
          onSuccess={() => {
            const cat = pinFor;
            setPinFor(null);
            loadSeries(cat.category_id);
          }}
          onCancel={() => setPinFor(null)}
        />
      )}
      <aside className="tv-scroll w-1/4 max-w-xs overflow-y-auto bg-neutral-900 py-6">
        <h2 className="px-6 pb-4 text-sm uppercase tracking-wider text-neutral-400">
          Séries
        </h2>
        <ul>
          {categories.map((cat) => (
            <li key={cat.category_id}>
              <Focusable
                onClick={() => onCategory(cat)}
                className={`block w-full truncate px-6 py-3 text-left text-lg ${
                  activeCat === cat.category_id
                    ? "bg-neutral-800 text-primary-500"
                    : "text-neutral-200"
                }`}
              >
                {categoryLocked(cat.category_name) ? "🔒 " : ""}
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
        {!error && loading && <SkeletonGrid count={12} variant="poster" />}
        {!error && !loading && series.length === 0 && (
          <p className="text-xl text-neutral-400">Aucune série dans cette catégorie.</p>
        )}
        <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-6">
          {series.map((s) => (
            <Focusable
              key={s.series_id}
              onClick={() =>
                router.push(
                  `/series/detail?id=${s.series_id}&name=${encodeURIComponent(
                    s.name,
                  )}`,
                )
              }
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
