"use client";

// The Few — Recherche globale (chaînes, films, séries).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { getLiveStreams, getSeries, getVodStreams } from "@/lib/xtream";
import type {
  XtreamLiveStream,
  XtreamSeries,
  XtreamVodStream,
} from "@/lib/types";
import TopBar from "@/components/TopBar";
import Focusable from "@/components/tv/Focusable";

type Result =
  | { kind: "live"; id: number; name: string }
  | { kind: "movie"; id: number; name: string; ext: string }
  | { kind: "series"; id: number; name: string };

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [live, setLive] = useState<XtreamLiveStream[]>([]);
  const [movies, setMovies] = useState<XtreamVodStream[]>([]);
  const [series, setSeries] = useState<XtreamSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) {
      router.replace("/login");
      return;
    }
    Promise.all([
      getLiveStreams(creds).catch(() => []),
      getVodStreams(creds).catch(() => []),
      getSeries(creds).catch(() => []),
    ])
      .then(([l, m, s]) => {
        setLive(l);
        setMovies(m);
        setSeries(s);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erreur de chargement."),
      )
      .finally(() => setLoading(false));
  }, [router]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const match = (n: string) => n.toLowerCase().includes(q);
    const out: Result[] = [];
    for (const c of live)
      if (match(c.name)) out.push({ kind: "live", id: c.stream_id, name: c.name });
    for (const m of movies)
      if (match(m.name))
        out.push({
          kind: "movie",
          id: m.stream_id,
          name: m.name,
          ext: m.container_extension,
        });
    for (const s of series)
      if (match(s.name))
        out.push({ kind: "series", id: s.series_id, name: s.name });
    return out.slice(0, 120);
  }, [query, live, movies, series]);

  function open(r: Result) {
    if (r.kind === "live")
      router.push(`/watch?id=${r.id}&name=${encodeURIComponent(r.name)}&arch=0`);
    else if (r.kind === "movie")
      router.push(
        `/vod/detail?id=${r.id}&ext=${encodeURIComponent(
          r.ext,
        )}&name=${encodeURIComponent(r.name)}`,
      );
    else
      router.push(
        `/series/detail?id=${r.id}&name=${encodeURIComponent(r.name)}`,
      );
  }

  const label: Record<Result["kind"], string> = {
    live: "Chaîne",
    movie: "Film",
    series: "Série",
  };

  return (
    <main className="tv-safe tv-scroll flex flex-1 flex-col gap-6 overflow-y-auto">
      <TopBar title="Recherche" />

      <input
        data-focusable=""
        className="tv-focusable w-full rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-4 text-2xl text-neutral-50 placeholder:text-neutral-400"
        type="search"
        autoFocus
        placeholder={
          loading ? "Chargement du catalogue…" : "Rechercher une chaîne, un film, une série…"
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && (
        <p role="alert" className="flex items-center gap-2 text-xl text-error-300">
          <span aria-hidden>⚠️</span>
          {error}
        </p>
      )}
      {!error && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xl text-neutral-400">Aucun résultat.</p>
      )}

      <ul className="flex flex-col gap-3">
        {results.map((r) => (
          <li key={`${r.kind}:${r.id}`}>
            <Focusable
              onClick={() => open(r)}
              className="flex w-full items-center gap-4 rounded-xl bg-neutral-900 p-4 text-left"
            >
              <span className="rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                {label[r.kind]}
              </span>
              <span className="truncate text-lg text-neutral-50">{r.name}</span>
            </Focusable>
          </li>
        ))}
      </ul>
    </main>
  );
}
