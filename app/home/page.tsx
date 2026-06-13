"use client";

// The Few — Accueil « DEFEW TV » : sidebar + salut/météo + rangées de contenu.

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
import { dayLabel, getWeather, greeting, type Weather } from "@/lib/weather";
import Sidebar from "@/components/Sidebar";
import Focusable from "@/components/tv/Focusable";
import Splash from "@/components/Splash";

const TYPE_LABEL = { live: "Chaîne", movie: "Film", series: "Série" } as const;

function recentHref(r: RecentItem): string {
  const n = encodeURIComponent(r.name);
  if (r.type === "live") return `/watch?id=${r.id}&name=${n}&arch=${r.arch ?? 0}`;
  return `/play?kind=${r.type}&id=${encodeURIComponent(r.id)}&ext=${encodeURIComponent(r.ext ?? "mp4")}&name=${n}`;
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
  if (w.type === "live") return `/watch?id=${w.id}&name=${n}&arch=${w.arch ?? 0}`;
  if (w.type === "movie")
    return `/play?kind=movie&id=${w.id}&ext=${encodeURIComponent(w.ext ?? "mp4")}&name=${n}`;
  return `/series/detail?id=${w.id}&name=${n}`;
}

type Card = { key: string; label: string; name: string; href: string };

function Row({
  title,
  cards,
  router,
  focusFirst,
}: {
  title: string;
  cards: Card[];
  router: ReturnType<typeof useRouter>;
  focusFirst?: boolean;
}) {
  if (cards.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl text-neutral-200">{title}</h2>
      <div className="tv-scroll flex gap-4 overflow-x-auto pb-1">
        {cards.map((c, i) => (
          <Focusable
            key={c.key}
            autoFocusOnMount={focusFirst && i === 0}
            onClick={() => router.push(c.href)}
            className="flex aspect-video w-60 shrink-0 flex-col justify-end rounded-xl bg-neutral-900 p-4 text-left"
          >
            <span className="text-sm text-primary-500">{c.label}</span>
            <span className="truncate text-lg text-neutral-50">{c.name}</span>
          </Focusable>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [later, setLater] = useState<WatchItem[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [now, setNow] = useState("");

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    setNow(dayLabel());
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
      .then((info) => setStatus(info.user_info.status || "Active"))
      .catch(() => setStatus("hors-ligne"));
    getWeather().then(setWeather);
    return () => {
      window.removeEventListener(RECENT_EVENT, refresh);
      window.removeEventListener(FAV_EVENT, refresh);
      window.removeEventListener(WATCHLATER_EVENT, refresh);
    };
  }, [router]);

  if (!ready) return <Splash />;

  const recentCards: Card[] = recent.map((r) => ({
    key: `r:${r.type}:${r.id}`,
    label: TYPE_LABEL[r.type],
    name: r.name,
    href: recentHref(r),
  }));
  const favCards: Card[] = favs.map((f) => ({
    key: `f:${f.type}:${f.id}`,
    label: TYPE_LABEL[f.type],
    name: f.name,
    href: favHref(f),
  }));
  const laterCards: Card[] = later.map((w) => ({
    key: `w:${w.type}:${w.id}`,
    label: TYPE_LABEL[w.type],
    name: w.name,
    href: watchHref(w),
  }));
  const hasContent =
    recentCards.length + favCards.length + laterCards.length > 0;
  const build = process.env.NEXT_PUBLIC_BUILD ?? "dev";

  return (
    <main className="flex flex-1 overflow-hidden">
      <Sidebar focusFirst={!hasContent} />

      <section className="tv-scroll flex flex-1 flex-col gap-8 overflow-y-auto p-10">
        <header className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-semibold text-neutral-50">
              {greeting()} <span aria-hidden>👋</span>
            </h1>
            {weather && (
              <p className="text-lg text-neutral-400">
                <span className="text-primary-500">{weather.city}</span> ·{" "}
                {weather.temp}°C
              </p>
            )}
          </div>
          <div className="text-right text-neutral-400">
            <p className="text-lg capitalize">{now}</p>
            <p className="text-sm">
              v{build}
              {status ? ` · ${status}` : ""}
            </p>
          </div>
        </header>

        {hasContent ? (
          <>
            <Row title="Reprendre" cards={recentCards} router={router} focusFirst />
            <Row title="Favoris" cards={favCards} router={router} />
            <Row title="À regarder plus tard" cards={laterCards} router={router} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="text-6xl" aria-hidden>
              📺
            </span>
            <p className="text-2xl text-neutral-100">
              Aucune chaîne pour l’instant
            </p>
            <p className="max-w-md text-neutral-400">
              Active cet appareil dans ton panel, puis pousse-lui une source.
              Les chaînes apparaîtront ici automatiquement.
            </p>
            <Focusable
              onClick={() => router.push("/live")}
              className="mt-2 rounded-full bg-primary-500 px-8 py-3 text-lg font-semibold text-neutral-950 hover:bg-primary-400"
            >
              Ouvrir Direct
            </Focusable>
          </div>
        )}
      </section>
    </main>
  );
}
