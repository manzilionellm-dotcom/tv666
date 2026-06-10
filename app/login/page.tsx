"use client";

// Black Seven TV — Connexion Xtream Codes (serveur + utilisateur + mot de passe).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/lib/xtream";
import { saveCredentials } from "@/lib/auth";
import Focusable from "@/components/tv/Focusable";

export default function LoginPage() {
  const router = useRouter();
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const creds = { server, username, password };
    try {
      await authenticate(creds);
      saveCredentials(creds);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
      setBusy(false);
    }
  }

  const inputClass =
    "tv-focusable w-full rounded-xl bg-neutral-800 px-6 py-4 text-2xl text-neutral-50 placeholder:text-neutral-400 border border-neutral-700";

  return (
    <main className="tv-safe flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl bg-neutral-900 p-12">
        <div className="mb-2 flex items-baseline gap-2 text-4xl font-bold tracking-tight">
          <span className="text-neutral-50">BLACK</span>
          <span className="text-primary-500">7</span>
          <span className="text-neutral-50">TV</span>
        </div>
        <p className="mb-8 text-lg text-neutral-200">Connexion Xtream Codes</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <input
            data-focusable=""
            className={inputClass}
            type="text"
            inputMode="url"
            autoFocus
            placeholder="Serveur (ex: http://exemple.com:8080)"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
          <input
            data-focusable=""
            className={inputClass}
            type="text"
            placeholder="Utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            data-focusable=""
            className={inputClass}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p
              role="alert"
              className="flex items-center gap-2 text-lg text-error-300"
            >
              <span aria-hidden>⚠️</span>
              {error}
            </p>
          )}

          <Focusable
            type="submit"
            disabled={busy || !server || !username || !password}
            className="mt-2 rounded-full bg-primary-500 px-8 py-4 text-2xl font-semibold text-neutral-950 hover:bg-primary-400 active:bg-primary-600 disabled:opacity-50"
          >
            {busy ? "Connexion…" : "Se connecter"}
          </Focusable>
        </form>
      </div>
    </main>
  );
}
