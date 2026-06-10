"use client";

// Black Seven TV — Lecteur plein écran d'une chaîne live + "en cours" (EPG).

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { decodeEpg, getShortEpg, liveStreamUrl } from "@/lib/xtream";
import Player from "@/components/Player";
import Splash from "@/components/Splash";

function Watch() {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const name = params.get("name") ?? "";
  const [src, setSrc] = useState<string | null>(null);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const creds = loadCredentials();
    const streamId = idParam ? Number(idParam) : NaN;
    if (!creds || Number.isNaN(streamId)) {
      router.replace("/live");
      return;
    }
    // Source dérivée d'identifiants client-only (localStorage) : montage SSR-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(liveStreamUrl(creds, streamId));

    getShortEpg(creds, streamId, 1)
      .then((res) => {
        const first = res.epg_listings?.[0];
        if (first) setNow(decodeEpg(first.title));
      })
      .catch(() => {});
  }, [idParam, router]);

  // Retour : Échap / Retour télécommande -> revient aux chaînes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") {
        e.preventDefault();
        router.push("/live");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!src) return <Splash />;

  return (
    <main className="relative flex flex-1 bg-neutral-950">
      <Player key={src} src={src} />
      <div className="pointer-events-none absolute left-0 top-0 w-full bg-gradient-to-b from-neutral-950/80 to-transparent p-8">
        <h1 className="text-3xl font-semibold text-neutral-50">{name}</h1>
        {now && <p className="mt-1 text-xl text-neutral-200">En cours : {now}</p>}
      </div>
    </main>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Watch />
    </Suspense>
  );
}
