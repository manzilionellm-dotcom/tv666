"use client";

// The Few — Écran d'activation premium : code appareil (type MAC), accès à vie,
// vérification. Le code est persistant ; à donner au revendeur.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { authenticate } from "@/lib/xtream";
import { deviceCode } from "@/lib/device";
import Focusable from "@/components/tv/Focusable";

export default function ActivationPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(deviceCode());
  }, []);

  function copy() {
    try {
      navigator.clipboard?.writeText(code);
      setMsg("Code copié.");
    } catch {
      setMsg(null);
    }
  }

  async function verify() {
    const creds = loadCredentials();
    if (!creds) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await authenticate(creds);
      router.replace("/home");
    } catch {
      setMsg("Pas encore activé. Demande au revendeur, puis réessaie.");
      setBusy(false);
    }
  }

  return (
    <main className="tv-safe flex flex-1 flex-col items-center justify-center gap-7 bg-neutral-950 text-center">
      <div className="flex flex-col items-center leading-none">
        <span className="font-serif text-5xl italic tracking-wide text-primary-500">
          The Few
        </span>
        <span className="mt-3 text-sm tracking-[0.5em] text-neutral-300">
          NOT FOR EVERYONE
        </span>
      </div>

      <p className="text-xl text-neutral-200">
        Accès complet, à vie. Un seul paiement.
      </p>
      <div className="rounded-full border border-primary-500/40 px-8 py-3 text-2xl text-neutral-50">
        <span className="mr-3 text-sm tracking-[0.3em] text-primary-500">
          À VIE
        </span>
        9,99&nbsp;$
      </div>

      <div className="w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-900 p-8">
        <p className="text-sm tracking-[0.35em] text-neutral-400">
          TON CODE D’ACTIVATION
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="font-mono text-3xl tracking-widest text-primary-500">
            {code || "…"}
          </span>
          <Focusable
            onClick={copy}
            aria-label="Copier le code"
            className="rounded-lg border border-neutral-700 px-4 py-2 text-lg text-neutral-200 hover:bg-neutral-800"
          >
            ⧉
          </Focusable>
        </div>
        <p className="mt-4 text-neutral-400">
          Donne ce code à ton revendeur pour activer. Il reste identique, même
          après une réinstallation.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Focusable
          autoFocusOnMount
          disabled={busy}
          onClick={verify}
          className="rounded-full bg-primary-500 px-10 py-4 text-xl font-semibold text-neutral-950 hover:bg-primary-400 disabled:opacity-50"
        >
          {busy ? "Vérification…" : "J’ai payé — Vérifier"}
        </Focusable>
        <Focusable
          onClick={() => router.push("/home")}
          className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
        >
          ← Accueil
        </Focusable>
      </div>
      {msg && <p className="text-lg text-neutral-200">{msg}</p>}
    </main>
  );
}
