"use client";

// The Few — Démarrage : Activation par MAC (+ QR) ou Xtream Codes. Sans <form>.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/lib/xtream";
import { loadCredentials, saveCredentials } from "@/lib/auth";
import { deviceCode } from "@/lib/device";
import Logo from "@/components/ui/Logo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Focusable from "@/components/tv/Focusable";
import Qr from "@/components/Qr";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"mac" | "xtream">("mac");
  const [code, setCode] = useState("");

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

  async function connectXtream() {
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

  async function verifyMac() {
    setMacMsg(null);
    const creds = loadCredentials();
    if (!creds) {
      setMacMsg("En attente d’activation par le revendeur. Réessaie dans un instant.");
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
    "tv-focusable w-full rounded-[12px] border border-line bg-sel px-6 py-4 text-2xl text-text placeholder:text-muted-dim";
  const build = process.env.NEXT_PUBLIC_BUILD ?? "dev";
  const canConnect = !busy && server && username && password;

  return (
    <main className="tv-safe flex flex-1 flex-col items-center justify-center">
      <Card className="w-full max-w-2xl p-12">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <div className="my-7 flex gap-3">
          <Focusable
            autoFocusOnMount
            aria-pressed={mode === "mac"}
            onClick={() => setMode("mac")}
            className={`flex-1 rounded-[12px] px-6 py-3 text-lg ${
              mode === "mac"
                ? "bg-gradient-to-b from-gold-bright to-gold font-semibold text-cta-ink"
                : "border border-line text-muted hover:text-gold"
            }`}
          >
            Activation (MAC + QR)
          </Focusable>
          <Focusable
            aria-pressed={mode === "xtream"}
            onClick={() => setMode("xtream")}
            className={`flex-1 rounded-[12px] px-6 py-3 text-lg ${
              mode === "xtream"
                ? "bg-gradient-to-b from-gold-bright to-gold font-semibold text-cta-ink"
                : "border border-line text-muted hover:text-gold"
            }`}
          >
            Xtream Codes
          </Focusable>
        </div>

        {mode === "mac" ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="text-lg text-muted">
              Donne ce code (ou scanne le QR) à ton revendeur. Dès qu’il
              l’active, l’app se connecte automatiquement.
            </p>
            <Qr value={code} />
            <span className="font-mono text-3xl tracking-widest text-gold-bright">
              {code || "…"}
            </span>
            <Button onClick={verifyMac} disabled={busy} className="w-full">
              {busy ? "Vérification…" : "J’ai été activé — Vérifier"}
            </Button>
            {macMsg && <p className="text-muted">{macMsg}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConnect) connectXtream();
              }}
            />
            {error && (
              <p role="alert" className="flex items-center gap-2 text-lg text-error-300">
                <span aria-hidden>⚠️</span>
                {error}
              </p>
            )}
            <Button
              onClick={connectXtream}
              disabled={!canConnect}
              className="mt-2 w-full"
            >
              {busy ? "Connexion…" : "Se connecter"}
            </Button>
          </div>
        )}

        <p className="mt-7 text-center text-sm text-muted-dim">
          The Few · build {build}
        </p>
      </Card>
    </main>
  );
}
