"use client";

// The Few — Écran d'activation (license). Logo hero, prix pill, code machine
// (mono uniquement ici), CTA or. Code persistant à donner au revendeur.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import { authenticate } from "@/lib/xtream";
import { deviceCode } from "@/lib/device";
import Logo from "@/components/ui/Logo";
import Card from "@/components/ui/Card";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import Focusable from "@/components/tv/Focusable";

export default function ActivationPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(deviceCode());
  }, []);

  function copy() {
    try {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
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
      setMsg("Pas encore activé. Donne ton code au revendeur, puis réessaie.");
      setBusy(false);
    }
  }

  return (
    <main className="tv-safe flex flex-1 flex-col items-center justify-center gap-7 text-center">
      <Logo size="md" />

      <p className="text-xl text-muted">Accès complet, à vie. Un seul paiement.</p>
      <Pill label="À vie" value="9,99 $" />

      <Card className="w-full max-w-2xl p-8">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-muted-dim">
          Ton code d’activation
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="font-mono text-3xl tracking-widest text-gold-bright">
            {code || "…"}
          </span>
          <Focusable
            onClick={copy}
            aria-label="Copier le code"
            className={`flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border ${
              copied
                ? "border-success-500 text-success-500"
                : "border-line text-muted hover:text-gold"
            }`}
          >
            {copied ? "✓" : "⧉"}
          </Focusable>
        </div>
        <p className="mt-4 text-muted">
          Donne ce code à ton revendeur pour activer. Il reste identique, même
          après une réinstallation.
        </p>
      </Card>

      <Button autoFocusOnMount onClick={verify} disabled={busy} className="w-full max-w-2xl">
        {busy ? "Vérification…" : "J’ai payé — Vérifier"}
      </Button>
      {msg && <p className="text-muted">{msg}</p>}

      <p className="text-sm text-muted-dim">
        Paiement vérifié · Activation instantanée
      </p>
      <Focusable
        onClick={() => router.push("/home")}
        className="text-muted hover:text-gold"
      >
        ← Accueil
      </Focusable>
    </main>
  );
}
