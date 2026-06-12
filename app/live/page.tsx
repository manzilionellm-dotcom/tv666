"use client";

// The Few — TV en direct : catégories (gauche) + chaînes (grille droite).
// Chaque chaîne : lecture, ⭐ favori, 🕒 à regarder. Recherche globale en haut.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getLiveCategories, getLiveStreams } from "@/lib/xtream";
import { categoryLocked } from "@/lib/parental";
import { FAV_EVENT, isFavorite, toggleFavorite } from "@/lib/favorites";
import {
  WATCHLATER_EVENT,
  isWatchLater,
  toggleWatchLater,
} from "@/lib/watchlater";
import type { XtreamCategory, XtreamLiveStream } from "@/lib/types";
import Focusable from "@/components/tv/Focusable";
import PinPrompt from "@/components/PinPrompt";
import Splash from "@/components/Splash";

export default function LivePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [channels, setChannels] = useState<XtreamLiveStream[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<XtreamCategory | null>(null);
  const [, setTick] = useState(0);

  const creds = typeof window !== "undefined" ? loadCredentials() : null;

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener(FAV_EVENT, refresh);
    window.addEventListener(WATCHLATER_EVENT, refresh);
    return () => {
      window.removeEventListener(FAV_EVENT, refresh);
      window.removeEventListener(WATCHLATER_EVENT, refresh);
    };
  }, []);

  const loadChannels = useCallback(
    (categoryId: string) => {
      if (!creds) return;
      setActiveCat(categoryId);
      setLoadingChannels(true);
      setError(null);
      getLiveStreams(creds, categoryId)
        .then((list) => setChannels(list))
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Erreur de chargement."),
        )
        .finally(() => setLoadingChannels(false));
    },
    [creds],
  );

  function onCategory(cat: XtreamCategory) {
    if (categoryLocked(cat.category_name)) {
      setPinFor(cat);
      return;
    }
    loadChannels(cat.category_id);
  }

  useEffect(() => {
    if (!creds) {
      router.replace("/login");
      return;
    }
    setReady(true);
    getLiveCategories(creds)
      .then((cats) => {
        setCategories(cats);
        const first = cats.find((c) => !categoryLocked(c.category_name));
        if (first) loadChannels(first.category_id);
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
            loadChannels(cat.category_id);
          }}
          onCancel={() => setPinFor(null)}
        />
      )}
      {/* Catégories */}
      <aside className="tv-scroll w-1/4 max-w-xs overflow-y-auto bg-neutral-900 py-6">
        <h2 className="px-6 pb-4 text-sm uppercase tracking-wider text-neutral-400">
          Catégories
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

      {/* Chaînes */}
      <section className="tv-scroll flex-1 overflow-y-auto p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider text-neutral-400">
            Chaînes
          </h2>
          <Focusable
            onClick={() => router.push("/search")}
            className="flex items-center gap-2 rounded-full border border-neutral-700 px-5 py-2 text-base text-neutral-50 hover:bg-neutral-800"
          >
            🔎 Rechercher
          </Focusable>
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-xl text-error-300">
            <span aria-hidden>⚠️</span>
            {error}
          </p>
        )}
        {!error && loadingChannels && (
          <p className="text-xl text-neutral-400">Chargement des chaînes…</p>
        )}
        {!error && !loadingChannels && channels.length === 0 && (
          <p className="text-xl text-neutral-400">Aucune chaîne dans cette catégorie.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((ch) => {
            const cid = String(ch.stream_id);
            const fav = isFavorite("live", cid);
            const later = isWatchLater("live", cid);
            return (
              <div
                key={ch.stream_id}
                className="flex items-stretch gap-1 overflow-hidden rounded-xl bg-neutral-900"
              >
                <Focusable
                  onClick={() =>
                    router.push(
                      `/watch?id=${ch.stream_id}&name=${encodeURIComponent(
                        ch.name,
                      )}&arch=${ch.tv_archive ? 1 : 0}`,
                    )
                  }
                  className="flex flex-1 items-center gap-3 p-4 text-left"
                >
                  {ch.stream_icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ch.stream_icon}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility =
                          "hidden";
                      }}
                    />
                  ) : (
                    <span className="h-12 w-12 shrink-0 rounded bg-neutral-800" />
                  )}
                  <span className="truncate text-lg text-neutral-50">
                    {ch.name}
                  </span>
                </Focusable>

                <Focusable
                  aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  onClick={() =>
                    toggleFavorite({ type: "live", id: cid, name: ch.name })
                  }
                  className={`px-3 text-2xl ${fav ? "text-primary-500" : "text-neutral-400"}`}
                >
                  {fav ? "★" : "☆"}
                </Focusable>

                <Focusable
                  aria-label={later ? "Retirer de À regarder" : "À regarder plus tard"}
                  onClick={() =>
                    toggleWatchLater({
                      type: "live",
                      id: cid,
                      name: ch.name,
                      arch: ch.tv_archive ? 1 : 0,
                    })
                  }
                  className={`px-3 text-xl ${later ? "text-primary-500" : "text-neutral-400"}`}
                >
                  🕒
                </Focusable>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
