"use client";

// Black Seven TV — TV en direct : catégories (gauche) + chaînes (grille droite).

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getLiveCategories, getLiveStreams } from "@/lib/xtream";
import { categoryLocked } from "@/lib/parental";
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

  const creds = typeof window !== "undefined" ? loadCredentials() : null;

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
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {channels.map((ch) => (
            <Focusable
              key={ch.stream_id}
              onClick={() =>
                router.push(
                  `/watch?id=${ch.stream_id}&name=${encodeURIComponent(
                    ch.name,
                  )}&arch=${ch.tv_archive ? 1 : 0}`,
                )
              }
              className="flex items-center gap-4 rounded-xl bg-neutral-900 p-4 text-left"
            >
              {/* Logo distant : <img> volontaire (hôtes arbitraires, pas next/image). */}
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
              <span className="truncate text-lg text-neutral-50">{ch.name}</span>
            </Focusable>
          ))}
        </div>
      </section>
    </main>
  );
}
