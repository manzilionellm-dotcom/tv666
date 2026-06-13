"use client";

// The Few — Favoris (live, films, séries). Persistés en local.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FAV_EVENT,
  listFavorites,
  removeFavorite,
  type FavItem,
} from "@/lib/favorites";
import TopBar from "@/components/TopBar";
import Focusable from "@/components/tv/Focusable";

function playHref(f: FavItem): string {
  if (f.type === "live")
    return `/watch?id=${f.id}&name=${encodeURIComponent(f.name)}&arch=0`;
  if (f.type === "movie")
    return `/play?kind=movie&id=${f.id}&ext=${encodeURIComponent(
      f.ext ?? "mp4",
    )}&name=${encodeURIComponent(f.name)}`;
  return `/series/detail?id=${f.id}&name=${encodeURIComponent(f.name)}`;
}

const TYPE_LABEL: Record<FavItem["type"], string> = {
  live: "Chaîne",
  movie: "Film",
  series: "Série",
};

export default function FavoritesPage() {
  const router = useRouter();
  const [items, setItems] = useState<FavItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(listFavorites());
    refresh();
    window.addEventListener(FAV_EVENT, refresh);
    return () => window.removeEventListener(FAV_EVENT, refresh);
  }, []);

  return (
    <main className="tv-safe tv-scroll flex flex-1 flex-col gap-8 overflow-y-auto">
      <TopBar title="Favoris" focusBack={items.length === 0} />

      {items.length === 0 ? (
        <p className="text-xl text-neutral-400">
          Aucun favori pour l’instant. Ajoute des chaînes, films ou séries avec
          l’étoile ★ pendant la lecture.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((f, i) => (
            <li
              key={`${f.type}:${f.id}`}
              className="flex items-center gap-4 rounded-xl bg-neutral-900 p-4"
            >
              <Focusable
                autoFocusOnMount={i === 0}
                onClick={() => router.push(playHref(f))}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <span className="rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                  {TYPE_LABEL[f.type]}
                </span>
                <span className="truncate text-lg text-neutral-50">
                  {f.name}
                </span>
              </Focusable>
              <Focusable
                onClick={() => removeFavorite(f.type, f.id)}
                aria-label={`Retirer ${f.name} des favoris`}
                className="rounded-full border border-neutral-700 px-5 py-2 text-lg text-neutral-200 hover:bg-neutral-800"
              >
                ✕ Retirer
              </Focusable>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
