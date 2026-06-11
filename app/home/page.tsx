"use client";

// Black Seven TV — Accueil. Aiguillage vers les sections + statut du compte.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { authenticate } from "@/lib/xtream";
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

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) {
      router.replace("/login");
      return;
    }
    // Garde de montage client-only (identifiants en localStorage), SSR-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    authenticate(creds)
      .then((info) => {
        setStatus(info.user_info.status || "Active");
        setExpiry(formatExpiry(info.user_info.exp_date));
      })
      .catch(() => setStatus("hors-ligne"));
  }, [router]);

  if (!ready) return <Splash />;

  return (
    <main className="tv-safe flex flex-1 flex-col gap-10">
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

      <section className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {SECTIONS.map((card, i) => (
          <Focusable
            key={card.route}
            autoFocusOnMount={i === 0}
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
