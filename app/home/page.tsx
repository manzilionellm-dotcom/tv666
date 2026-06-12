"use client";

// The Few — Accueil : Dernières vues + Favoris + sections + statut du compte.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { authenticate } from "@/lib/xtream";
import { FAV_EVENT, listFavorites, type FavItem } from "@/lib/favorites";
import { RECENT_EVENT, listRecent, type RecentItem } from "@/lib/recent";
import {
  WATCHLATER_EVENT,
  listWatchLater,
  type WatchItem,
} from "@/lib/watchlater";
import Focusable from "@/components/tv/Focusable";
import Splash from "@/components/Splash";

const SECTIONS = [
  { title: "TV en direct", sub: "Chaînes live", route: "/live" },
  { title: "Films (VOD)", sub: "Bibliothèque", route: "/vod" },
  { title: "Séries", sub: "Saisons & épisodes", route: "/series" },
  { title: "Guide TV", sub: "EPG en cours / à suivre", route: "/guide" },
  { title: "Recherche", sub: "Chaînes, films, séries", route: "/search" },
  { title: "Favoris", sub: "Ta sélection", route: "/favorites" },
  { title: "Multiview", sub: "Mosaïque 4 chaînes", route: "/multiview" },
  { title: "Réglages", sub: "Compte & contrôle parental", route: "/settings" },
];

const TYPE_LABEL = { live: "Chaîne", movie: "Film", series: "Série" } as const;

function recentHref(r: RecentItem): string {
  const n = encodeURIComponent(r.name);
  if (r.type === "live") return `/watch?id=${r.id}&name=${n}&arch=${r.arch ?? 0}`;
  const ext = encodeURIComponent(r.ext ?? "mp4");
  return `/play?kind=${r.type}&id=${encodeURIComponent(r.id)}&ext=${ext}&name=${n}`;
}

function favHref(f: FavItem): string {
  const n = encodeURIComponent(f.name);
  if (f.type === "live") return `/watch?id=${f.id}&name=${n}&arch=0`;
  if (f.type === "movie")
    return `/play?kind=movie&id=${f.id}&ext=${encodeURIComponent(f.ext ?? "mp4")}&name=${n}`;
  return `/series/detail?id=${f.id}&name=${n}`;
}

function watchHref(w: WatchItem): string {
  const n = encodeURIComponent(w.name);
  if (w.type === "live")
    return `/watch?id=${w.id}&name=${n}&arch=${w.arch ?? 0}`;
  if (w.type === "movie")
    return `/play?kind=movie&id=${w.id}&ext=${encodeURIComponent(w.ext ?? "mp4")}&name=${n}`;
  return `/series/detail?id=${w.id}&name=${n}`;
}

function formatExpiry(exp: string | null): string {
  if (!exp) return "Illimité";
  const d = new Date(Number(exp) * 1000);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [later, setLater] = useState<WatchItem[]>([]);

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) {
      router.replace("/login");
      return;
    }
    // Garde de montage client-only (identifiants en localStorage), SSR-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    const refresh = () => {
      setRecent(listRecent());
      setFavs(listFavorites());
      setLater(listWatchLater());
    };
    refresh();
    window.addEventListener(RECENT_EVENT, refresh);
    window.addEventListener(FAV_EVENT, refresh);
    window.addEventListener(WATCHLATER_EVENT, refresh);
    authenticate(creds)
      .then((info) => {
        setStatus(info.user_info.status || "Active");
        setExpiry(formatExpiry(info.user_info.exp_date));
      })
      .catch(() => setStatus("hors-ligne"));
    return () => {
      window.removeEventListener(RECENT_EVENT, refresh);
      window.removeEventListener(FAV_EVENT, refresh);
      window.removeEventListener(WATCHLATER_EVENT, refresh);
    };
  }, [router]);

  if (!ready) return <Splash />;

  const hasRecent = recent.length > 0;

  return (
    <main className="tv-safe tv-scroll flex flex-1 flex-col gap-8 overflow-y-auto">
      <header className="flex items-center justify-between">
        <div className="flex flex-col leading-none">
          <span className="text-3xl font-semibold tracking-[0.18em] text-neutral-50">
            The Few
          </span>
          <span className="mt-1 text-[0.7rem] tracking-[0.42em] text-primary-500">
            NOT FOR EVERYONE
          </span>
        </div>
        <div className="flex items-center gap-6">
          {status && (
            <span className="text-lg text-neutral-200">
              Compte : <span className="text-neutral-50">{status}</span>
              {expiry && (
                <span className="text-neutral-400"> · expire le {expiry}</span>
              )}
            </span>
          )}
          <Focusable
            onClick={() => router.push("/settings")}
            className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
          >
            Réglages
          </Focusable>
        </div>
      </header>

      {hasRecent && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl text-neutral-200">Dernières vues</h2>
          <div className="tv-scroll flex gap-4 overflow-x-auto pb-1">
            {recent.map((r, i) => (
              <Focusable
                key={`${r.type}:${r.id}`}
                autoFocusOnMount={i === 0}
                onClick={() => router.push(recentHref(r))}
                className="flex aspect-video w-60 shrink-0 flex-col justify-end rounded-xl bg-neutral-900 p-4 text-left"
              >
                <span className="text-sm text-primary-500">
                  {TYPE_LABEL[r.type]}
                </span>
                <span className="truncate text-lg text-neutral-50">{r.name}</span>
              </Focusable>
            ))}
          </div>
        </section>
      )}

      {favs.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl text-neutral-200">Favoris</h2>
          <div className="tv-scroll flex gap-4 overflow-x-auto pb-1">
            {favs.map((f) => (
              <Focusable
                key={`${f.type}:${f.id}`}
                onClick={() => router.push(favHref(f))}
                className="flex aspect-video w-60 shrink-0 flex-col justify-end rounded-xl bg-neutral-900 p-4 text-left"
              >
                <span className="text-sm text-primary-500">
                  {TYPE_LABEL[f.type]}
                </span>
                <span className="truncate text-lg text-neutral-50">{f.name}</span>
              </Focusable>
            ))}
          </div>
        </section>
      )}

      {later.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl text-neutral-200">À regarder plus tard</h2>
          <div className="tv-scroll flex gap-4 overflow-x-auto pb-1">
            {later.map((w) => (
              <Focusable
                key={`${w.type}:${w.id}`}
                onClick={() => router.push(watchHref(w))}
                className="flex aspect-video w-60 shrink-0 flex-col justify-end rounded-xl bg-neutral-900 p-4 text-left"
              >
                <span className="text-sm text-primary-500">
                  {TYPE_LABEL[w.type]}
                </span>
                <span className="truncate text-lg text-neutral-50">{w.name}</span>
              </Focusable>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {SECTIONS.map((card, i) => (
          <Focusable
            key={card.route}
            autoFocusOnMount={!hasRecent && i === 0}
            onClick={() => router.push(card.route)}
            className="flex aspect-video flex-col justify-end rounded-2xl bg-neutral-900 p-6 text-left"
          >
            <span className="text-2xl font-semibold text-neutral-50">
              {card.title}
            </span>
            <span className="text-base text-neutral-200">{card.sub}</span>
          </Focusable>
        ))}
      </section>
    </main>
  );
}
