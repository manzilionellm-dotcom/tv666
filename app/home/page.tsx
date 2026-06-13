"use client";

// The Few — Accueil « DEFEW TV » : sidebar + salut/météo + état vide ou rangées.

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
import { getWeather, greeting, type Weather } from "@/lib/weather";
import Sidebar from "@/components/Sidebar";
import Splash from "@/components/Splash";
import Focusable from "@/components/tv/Focusable";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { IconTvBig } from "@/components/ui/icons";

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
      <h2 className="text-lg text-muted">{title}</h2>
      <div className="tv-scroll flex gap-4 overflow-x-auto pb-1">
        {cards.map((c, i) => (
          <Focusable
            key={c.key}
            autoFocusOnMount={focusFirst && i === 0}
            onClick={() => router.push(c.href)}
            className="flex aspect-video w-60 shrink-0 flex-col justify-end rounded-[18px] border border-line-soft bg-card p-4 text-left"
          >
            <span className="text-sm text-gold">{c.label}</span>
            <span className="truncate text-lg text-text">{c.name}</span>
          </Focusable>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [later, setLater] = useState<WatchItem[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weekday, setWeekday] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    const d = new Date();
    setWeekday(d.toLocaleDateString("fr-FR", { weekday: "long" }));
    setTime(d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    const refresh = () => {
      setRecent(listRecent());
      setFavs(listFavorites());
      setLater(listWatchLater());
    };
    refresh();
    window.addEventListener(RECENT_EVENT, refresh);
    window.addEventListener(FAV_EVENT, refresh);
    window.addEventListener(WATCHLATER_EVENT, refresh);
    authenticate(creds).catch(() => {});
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

  return (
    <main className="flex flex-1 overflow-hidden">
      <Sidebar active="/live" focusFirst={!hasContent} />

      <section className="tv-scroll flex flex-1 flex-col gap-8 overflow-y-auto p-10">
        <header className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold text-text">
              {greeting()} <span aria-hidden>👋</span>
            </h1>
            {weather && (
              <p className="text-lg text-muted">
                <span className="text-gold">{weather.city}</span> ·{" "}
                {weather.temp}°C
              </p>
            )}
          </div>
          <p className="text-lg">
            <span className="capitalize text-text">{weekday}</span>
            <span className="text-muted"> · {time}</span>
          </p>
        </header>

        {hasContent ? (
          <>
            <Row title="Reprendre" cards={recentCards} router={router} focusFirst />
            <Row title="Favoris" cards={favCards} router={router} />
            <Row title="À regarder plus tard" cards={laterCards} router={router} />
          </>
        ) : (
          <EmptyState
            icon={<IconTvBig />}
            title="Aucune chaîne pour l’instant"
            text="Active cet appareil dans ton panel, puis pousse-lui une source. Les chaînes apparaîtront ici automatiquement."
            action={
              <Button onClick={() => router.push("/live")} className="mt-2">
                Ouvrir Direct
              </Button>
            }
          />
        )}
      </section>
    </main>
  );
}
