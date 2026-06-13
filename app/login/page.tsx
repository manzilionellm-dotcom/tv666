"use client";

// The Few — Démarrage : Activation par MAC (+ QR) automatique, ou Xtream Codes.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/lib/xtream";
import { loadCredentials, saveCredentials } from "@/lib/auth";
import { deviceCode } from "@/lib/device";
import Focusable from "@/components/tv/Focusable";
import Qr from "@/components/Qr";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"mac" | "xtream">("mac");
  const [code, setCode] = useState("");

  // Xtream
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [macMsg, setMacMsg] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(deviceCode());
  }, []);

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

  // Vérifie l'activation côté revendeur. Branche le backend MAC quand dispo ;
  // pour l'instant : si une ligne est déjà enregistrée, on entre.
  async function verifyMac() {
    setMacMsg(null);
    const creds = loadCredentials();
    if (!creds) {
      setMacMsg("En attente d'activation par le revendeur. Réessaie dans un instant.");
      return;
    }
    setBusy(true);
    try {
      await authenticate(creds);
      router.replace("/home");
    } catch {
      setMacMsg("Pas encore activé. Donne ton code au revendeur, puis réessaie.");
      setBusy(false);
    }
  }

  const inputClass =
    "tv-focusable w-full rounded-xl bg-neutral-800 px-6 py-4 text-2xl text-neutral-50 placeholder:text-neutral-400 border border-neutral-700";
  const build = process.env.NEXT_PUBLIC_BUILD ?? "dev";

  return (
    <main className="tv-safe flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl bg-neutral-900 p-12">
        <div className="mb-2 flex flex-col leading-none">
          <span className="font-serif text-5xl italic tracking-wide text-primary-500">
            The Few
          </span>
          <span className="mt-2 text-sm tracking-[0.5em] text-neutral-300">
            NOT FOR EVERYONE
          </span>
        </div>

        {/* Choix du mode */}
        <div className="my-6 flex gap-3">
          <Focusable
            autoFocusOnMount
            aria-pressed={mode === "mac"}
            onClick={() => setMode("mac")}
            className={`flex-1 rounded-full px-6 py-3 text-lg ${
              mode === "mac"
                ? "bg-primary-500 font-semibold text-neutral-950"
                : "border border-neutral-700 text-neutral-50"
            }`}
          >
            Activation (MAC + QR)
          </Focusable>
          <Focusable
            aria-pressed={mode === "xtream"}
            onClick={() => setMode("xtream")}
            className={`flex-1 rounded-full px-6 py-3 text-lg ${
              mode === "xtream"
                ? "bg-primary-500 font-semibold text-neutral-950"
                : "border border-neutral-700 text-neutral-50"
            }`}
          >
            Xtream Codes
          </Focusable>
        </div>

        {mode === "mac" ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="text-lg text-neutral-300">
              Donne ce code (ou scanne le QR) à ton revendeur. Dès qu’il
              l’active, l’app se connecte automatiquement.
            </p>
            <Qr value={code} />
            <p className="font-mono text-3xl tracking-widest text-primary-500">
              {code || "…"}
            </p>
            <Focusable
              disabled={busy}
              onClick={verifyMac}
              className="rounded-full bg-primary-500 px-10 py-4 text-xl font-semibold text-neutral-950 hover:bg-primary-400 disabled:opacity-50"
            >
              {busy ? "Vérification…" : "J’ai été activé — Vérifier"}
            </Focusable>
            {macMsg && <p className="text-lg text-neutral-200">{macMsg}</p>}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <input
              data-focusable=""
              className={inputClass}
              type="text"
              inputMode="url"
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
              <p role="alert" className="flex items-center gap-2 text-lg text-error-300">
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
        )}

        <p className="mt-6 text-center text-sm text-neutral-400">
          The Few · build {build}
        </p>
      </div>
    </main>
  );
}
