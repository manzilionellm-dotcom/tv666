"use client";

// Black Seven TV — Films (VOD) : catégories (gauche) + affiches (grille droite).

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getVodCategories, getVodStreams } from "@/lib/xtream";
import type { XtreamCategory, XtreamVodStream } from "@/lib/types";
import Focusable from "@/components/tv/Focusable";
import Splash from "@/components/Splash";

export default function VodPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [movies, setMovies] = useState<XtreamVodStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creds = typeof window !== "undefined" ? loadCredentials() : null;

  const loadMovies = useCallback(
    (categoryId: string) => {
      if (!creds) return;
      setActiveCat(categoryId);
      setLoading(true);
      setError(null);
      getVodStreams(creds, categoryId)
        .then(setMovies)
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Erreur de chargement."),
        )
        .finally(() => setLoading(false));
    },
    [creds],
  );

  useEffect(() => {
    if (!creds) {
      router.replace("/login");
      return;
    }
    setReady(true);
    getVodCategories(creds)
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) loadMovies(cats[0].category_id);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erreur de chargement."),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Splash />;

  return (
    <main className="flex flex-1 overflow-hidden">
      <aside className="tv-scroll w-1/4 max-w-xs overflow-y-auto bg-neutral-900 py-6">
        <h2 className="px-6 pb-4 text-sm uppercase tracking-wider text-neutral-400">
          Films
        </h2>
        <ul>
          {categories.map((cat) => (
            <li key={cat.category_id}>
              <Focusable
                onClick={() => loadMovies(cat.category_id)}
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
        {!error && !loading && movies.length === 0 && (
          <p className="text-xl text-neutral-400">Aucun film dans cette catégorie.</p>
        )}
        <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-6">
          {movies.map((m) => (
            <Focusable
              key={m.stream_id}
              onClick={() =>
                router.push(
                  `/play?kind=movie&id=${m.stream_id}&ext=${encodeURIComponent(
                    m.container_extension,
                  )}&name=${encodeURIComponent(m.name)}`,
                )
              }
              className="flex flex-col overflow-hidden rounded-xl bg-neutral-900 text-left"
            >
              <div className="aspect-[2/3] w-full bg-neutral-800">
                {m.stream_icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.stream_icon}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility =
                        "hidden";
                    }}
                  />
                )}
              </div>
              <span className="truncate p-3 text-sm text-neutral-50">{m.name}</span>
            </Focusable>
          ))}
        </div>
      </section>
    </main>
  );
}
