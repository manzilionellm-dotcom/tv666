"use client";

// Black Seven TV — Lecture d'un fichier VOD / épisode de série (mode fichier).

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { seriesStreamUrl, vodStreamUrl } from "@/lib/xtream";
import { addRecent } from "@/lib/recent";
import Player from "@/components/Player";
import FavButton from "@/components/FavButton";
import Splash from "@/components/Splash";

function Play() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const ext = params.get("ext") ?? "mp4";
  const name = params.get("name") ?? "";
  const kind = params.get("kind") ?? "movie"; // "movie" | "series"
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds || !id) {
      router.replace("/home");
      return;
    }
    const url =
      kind === "series"
        ? seriesStreamUrl(creds, id, ext)
        : vodStreamUrl(creds, Number(id), ext);
    // Source dérivée d'identifiants client-only (localStorage), montage SSR-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(url);
    addRecent({
      type: kind === "series" ? "series" : "movie",
      id,
      name,
      ext,
    });
  }, [id, ext, kind, name, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") {
        e.preventDefault();
        router.back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!src) return <Splash />;

  return (
    <main className="relative flex flex-1 bg-neutral-950">
      <Player key={src} src={src} mode="file" controls />
      <div className="pointer-events-none absolute left-0 top-0 w-full bg-gradient-to-b from-neutral-950/80 to-transparent p-8">
        <h1 className="text-3xl font-semibold text-neutral-50">{name}</h1>
      </div>
      {kind === "movie" && id && (
        <div className="absolute bottom-0 left-0 flex w-full items-center gap-3 bg-gradient-to-t from-neutral-950/80 to-transparent p-8">
          <FavButton item={{ type: "movie", id, name, ext }} />
        </div>
      )}
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Play />
    </Suspense>
  );
}
