"use client";

// Black Seven TV — Multiview : mosaïque de jusqu'à 4 chaînes favorites en simultané.
// Toutes muettes sauf la cellule sélectionnée (OK = plein écran).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { liveStreamUrl } from "@/lib/xtream";
import { listFavorites } from "@/lib/favorites";
import TopBar from "@/components/TopBar";
import Player from "@/components/Player";
import Focusable from "@/components/tv/Focusable";

type Cell = { id: string; name: string; src: string };

export default function MultiviewPage() {
  const router = useRouter();
  const [cells, setCells] = useState<Cell[]>([]);
  const [active, setActive] = useState(0); // cellule sonore
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) {
      router.replace("/login");
      return;
    }
    const liveFavs = listFavorites()
      .filter((f) => f.type === "live")
      .slice(0, 4);
    setCells(
      liveFavs.map((f) => ({
        id: f.id,
        name: f.name,
        src: liveStreamUrl(creds, Number(f.id)),
      })),
    );
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;

  return (
    <main className="tv-safe flex flex-1 flex-col gap-6 overflow-hidden">
      <TopBar title="Multiview" focusBack={cells.length === 0} />

      {cells.length === 0 ? (
        <p className="text-xl text-neutral-400">
          Ajoute au moins une chaîne à tes favoris (étoile ★) pour la voir ici.
          Le multiview affiche jusqu’à 4 chaînes favorites en simultané.
        </p>
      ) : (
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-3 overflow-hidden">
          {cells.map((c, i) => (
            <Focusable
              key={c.id}
              autoFocusOnMount={i === 0}
              onClick={() => router.push(`/watch?id=${c.id}&name=${encodeURIComponent(c.name)}&arch=0`)}
              onFocus={() => setActive(i)}
              className="relative block overflow-hidden rounded-xl bg-neutral-900 p-0 text-left"
            >
              <div className="aspect-video w-full">
                <Player key={c.src} src={c.src} muted={i !== active} />
              </div>
              <span className="absolute bottom-0 left-0 w-full truncate bg-gradient-to-t from-neutral-950/80 to-transparent p-3 text-lg text-neutral-50">
                {c.name}
                {i === active && (
                  <span className="ml-2 text-sm text-primary-500">🔊</span>
                )}
              </span>
            </Focusable>
          ))}
        </div>
      )}
    </main>
  );
}
