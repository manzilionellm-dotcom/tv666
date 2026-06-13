"use client";

// The Few — Guide TV (EPG) : catégorie -> chaînes avec "en cours / à suivre".

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import {
  decodeEpg,
  getLiveCategories,
  getLiveStreams,
  getShortEpg,
} from "@/lib/xtream";
import { categoryLocked } from "@/lib/parental";
import type { XtreamCategory, XtreamCredentials, XtreamLiveStream } from "@/lib/types";
import TopBar from "@/components/TopBar";
import Focusable from "@/components/tv/Focusable";
import PinPrompt from "@/components/PinPrompt";
import Splash from "@/components/Splash";

const MAX_ROWS = 60; // borne le nombre de requêtes EPG par catégorie

function fmtTime(unix: string): string {
  const d = new Date(Number(unix) * 1000);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function GuideRow({
  creds,
  channel,
  onPlay,
}: {
  creds: XtreamCredentials;
  channel: XtreamLiveStream;
  onPlay: () => void;
}) {
  const [nowTitle, setNowTitle] = useState("");
  const [nextTitle, setNextTitle] = useState("");
  const [span, setSpan] = useState("");

  useEffect(() => {
    let alive = true;
    getShortEpg(creds, channel.stream_id, 2)
      .then((res) => {
        if (!alive) return;
        const [a, b] = res.epg_listings ?? [];
        if (a) {
          setNowTitle(decodeEpg(a.title));
          setSpan(`${fmtTime(a.start_timestamp)} – ${fmtTime(a.stop_timestamp)}`);
        }
        if (b) setNextTitle(decodeEpg(b.title));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [creds, channel.stream_id]);

  return (
    <Focusable
      onClick={onPlay}
      className="flex w-full items-center gap-4 rounded-xl bg-neutral-900 p-4 text-left"
    >
      <span className="w-48 shrink-0 truncate text-lg text-neutral-50">
        {channel.name}
      </span>
      <span className="flex-1">
        <span className="block truncate text-base text-neutral-200">
          {nowTitle ? (
            <>
              <span className="text-neutral-400">{span} </span>
              {nowTitle}
            </>
          ) : (
            <span className="text-neutral-500">Pas d’EPG</span>
          )}
        </span>
        {nextTitle && (
          <span className="block truncate text-sm text-neutral-500">
            Puis : {nextTitle}
          </span>
        )}
      </span>
      {channel.tv_archive ? (
        <span className="shrink-0 rounded bg-primary-500/10 px-2 py-1 text-xs text-primary-500">
          Replay
        </span>
      ) : null}
    </Focusable>
  );
}

export default function GuidePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [channels, setChannels] = useState<XtreamLiveStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<XtreamCategory | null>(null);

  const creds = typeof window !== "undefined" ? loadCredentials() : null;

  const load = useCallback(
    (categoryId: string) => {
      if (!creds) return;
      setActiveCat(categoryId);
      setLoading(true);
      setError(null);
      getLiveStreams(creds, categoryId)
        .then((list) => setChannels(list.slice(0, MAX_ROWS)))
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
    load(cat.category_id);
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
        if (first) load(first.category_id);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erreur de chargement."),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Splash />;

  return (
    <main className="tv-safe flex flex-1 flex-col gap-6 overflow-hidden">
      {pinFor && (
        <PinPrompt
          onSuccess={() => {
            const cat = pinFor;
            setPinFor(null);
            load(cat.category_id);
          }}
          onCancel={() => setPinFor(null)}
        />
      )}
      <TopBar title="Guide TV" />

      <div className="flex flex-1 gap-6 overflow-hidden">
        <aside className="tv-scroll w-1/4 max-w-xs overflow-y-auto rounded-xl bg-neutral-900 py-4">
          <ul>
            {categories.map((cat) => (
              <li key={cat.category_id}>
                <Focusable
                  onClick={() => onCategory(cat)}
                  className={`block w-full truncate px-5 py-3 text-left text-base ${
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

        <section className="tv-scroll flex-1 overflow-y-auto">
          {error && (
            <p role="alert" className="flex items-center gap-2 text-xl text-error-300">
              <span aria-hidden>⚠️</span>
              {error}
            </p>
          )}
          {!error && loading && (
            <p className="text-xl text-neutral-400">Chargement…</p>
          )}
          {creds && !loading && (
            <ul className="flex flex-col gap-3">
              {channels.map((ch) => (
                <li key={ch.stream_id}>
                  <GuideRow
                    creds={creds}
                    channel={ch}
                    onPlay={() =>
                      router.push(
                        `/watch?id=${ch.stream_id}&name=${encodeURIComponent(
                          ch.name,
                        )}&arch=${ch.tv_archive ? 1 : 0}`,
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
