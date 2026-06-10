"use client";

// Black Seven TV — Accueil. Aiguillage vers les sections + statut du compte.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials, clearCredentials } from "@/lib/auth";
import { authenticate } from "@/lib/xtream";
import Focusable from "@/components/tv/Focusable";
import Splash from "@/components/Splash";

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

  function logout() {
    clearCredentials();
    router.replace("/login");
  }

  if (!ready) return <Splash />;

  return (
    <main className="tv-safe flex flex-1 flex-col gap-10">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-2 text-4xl font-bold tracking-tight">
          <span className="text-neutral-50">BLACK</span>
          <span className="text-primary-500">7</span>
          <span className="text-neutral-50">TV</span>
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
            onClick={logout}
            className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
          >
            Déconnexion
          </Focusable>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-8 md:grid-cols-3">
        <Focusable
          autoFocusOnMount
          onClick={() => router.push("/live")}
          className="flex aspect-video flex-col justify-end rounded-2xl bg-neutral-900 p-8 text-left"
        >
          <span className="text-3xl font-semibold text-neutral-50">
            TV en direct
          </span>
          <span className="text-lg text-neutral-200">Chaînes live & EPG</span>
        </Focusable>

        {[
          { title: "Films (VOD)", note: "Bientôt" },
          { title: "Séries", note: "Bientôt" },
          { title: "Recherche", note: "Bientôt" },
          { title: "Favoris", note: "Bientôt" },
        ].map((card) => (
          <Focusable
            key={card.title}
            disabled
            aria-disabled="true"
            className="flex aspect-video cursor-not-allowed flex-col justify-end rounded-2xl bg-neutral-900 p-8 text-left opacity-50"
          >
            <span className="text-3xl font-semibold text-neutral-50">
              {card.title}
            </span>
            <span className="text-lg text-neutral-400">{card.note}</span>
          </Focusable>
        ))}
      </section>
    </main>
  );
}
