"use client";

// Black Seven TV — Réglages : compte, déconnexion, contrôle parental (PIN).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCredentials, loadCredentials } from "@/lib/auth";
import { authenticate } from "@/lib/xtream";
import { clearPin, isParentalEnabled, setPin } from "@/lib/parental";
import { deviceCode } from "@/lib/device";
import TopBar from "@/components/TopBar";
import Focusable from "@/components/tv/Focusable";
import PinPrompt from "@/components/PinPrompt";

function formatExpiry(exp: string | null): string {
  if (!exp) return "Illimité";
  const d = new Date(Number(exp) * 1000);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

export default function SettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [expiry, setExpiry] = useState("");
  const [conns, setConns] = useState("");
  const [code, setCode] = useState("");
  const [parental, setParental] = useState(false);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false); // PinPrompt pour désactiver

  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParental(isParentalEnabled());
    setCode(deviceCode());
    authenticate(creds)
      .then((info) => {
        setStatus(info.user_info.status || "Active");
        setExpiry(formatExpiry(info.user_info.exp_date));
        if (info.user_info.max_connections) {
          setConns(
            `${info.user_info.active_cons ?? "0"} / ${info.user_info.max_connections}`,
          );
        }
      })
      .catch(() => setStatus("hors-ligne"));
  }, [router]);

  function logout() {
    clearCredentials();
    router.replace("/login");
  }

  function activate() {
    if (pin1.length < 4) {
      setMsg("Le PIN doit comporter au moins 4 chiffres.");
      return;
    }
    if (pin1 !== pin2) {
      setMsg("Les deux codes ne correspondent pas.");
      return;
    }
    setPin(pin1);
    setParental(true);
    setPin1("");
    setPin2("");
    setMsg("Contrôle parental activé.");
  }

  const inputClass =
    "tv-focusable w-full rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-4 text-2xl text-neutral-50";

  return (
    <main className="tv-safe tv-scroll flex flex-1 flex-col gap-8 overflow-y-auto">
      {verifying && (
        <PinPrompt
          onSuccess={() => {
            clearPin();
            setParental(false);
            setVerifying(false);
            setMsg("Contrôle parental désactivé.");
          }}
          onCancel={() => setVerifying(false)}
        />
      )}
      <TopBar title="Réglages" />

      <section className="flex flex-col gap-3 rounded-2xl bg-neutral-900 p-8">
        <h2 className="text-2xl font-semibold text-neutral-50">Compte</h2>
        <p className="text-lg text-neutral-200">
          Statut : <span className="text-neutral-50">{status || "…"}</span>
          {expiry && (
            <span className="text-neutral-400"> · expire le {expiry}</span>
          )}
          {conns && (
            <span className="text-neutral-400"> · connexions : {conns}</span>
          )}
        </p>
        <Focusable
          onClick={logout}
          className="mt-2 self-start rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
        >
          Déconnexion
        </Focusable>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-neutral-900 p-8">
        <h2 className="text-2xl font-semibold text-neutral-50">Activation</h2>
        <p className="text-lg text-neutral-300">
          Code de cet appareil (à donner au revendeur) :
        </p>
        <p className="font-mono text-2xl tracking-widest text-primary-500">
          {code}
        </p>
        <Focusable
          onClick={() => router.push("/activation")}
          className="mt-1 self-start rounded-full border border-primary-500 px-6 py-3 text-lg text-primary-500 hover:bg-primary-500/10"
        >
          Écran d’activation
        </Focusable>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-neutral-900 p-8">
        <h2 className="text-2xl font-semibold text-neutral-50">
          Contrôle parental
        </h2>
        <p className="text-lg text-neutral-300">
          Verrouille les catégories adultes (XXX/Adult) par un code PIN.
        </p>

        {parental ? (
          <div className="flex flex-wrap gap-3">
            <span className="self-center text-lg text-primary-500">
              ✓ Activé
            </span>
            <Focusable
              onClick={() => setVerifying(true)}
              className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
            >
              Désactiver
            </Focusable>
          </div>
        ) : (
          <div className="flex max-w-md flex-col gap-3">
            <input
              data-focusable=""
              className={inputClass}
              type="password"
              inputMode="numeric"
              placeholder="Nouveau code PIN"
              value={pin1}
              onChange={(e) => setPin1(e.target.value)}
            />
            <input
              data-focusable=""
              className={inputClass}
              type="password"
              inputMode="numeric"
              placeholder="Confirmer le PIN"
              value={pin2}
              onChange={(e) => setPin2(e.target.value)}
            />
            <Focusable
              onClick={activate}
              className="self-start rounded-full bg-primary-500 px-6 py-3 text-lg font-semibold text-neutral-950 hover:bg-primary-400"
            >
              Activer
            </Focusable>
          </div>
        )}
        {msg && <p className="text-lg text-neutral-200">{msg}</p>}
      </section>
    </main>
  );
}
