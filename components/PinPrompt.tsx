"use client";

// The Few — Saisie du code PIN (contrôle parental) en surimpression.

import { useState } from "react";
import Focusable from "./tv/Focusable";
import { unlockSession, verifyPin } from "@/lib/parental";

export default function PinPrompt({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    if (verifyPin(pin)) {
      unlockSession();
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-neutral-900 p-8">
        <h2 className="text-2xl font-semibold text-neutral-50">
          Contrôle parental
        </h2>
        <p className="text-neutral-300">
          Saisis le code PIN pour accéder à cette catégorie.
        </p>
        <input
          data-focusable=""
          className="tv-focusable w-full rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-4 text-center text-3xl tracking-[0.5em] text-neutral-50"
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {error && (
          <p role="alert" className="flex items-center gap-2 text-error-300">
            <span aria-hidden>⚠️</span>
            Code incorrect.
          </p>
        )}
        <div className="flex gap-3">
          <Focusable
            onClick={submit}
            className="flex-1 rounded-full bg-primary-500 px-6 py-3 text-lg font-semibold text-neutral-950 hover:bg-primary-400"
          >
            Valider
          </Focusable>
          <Focusable
            onClick={onCancel}
            className="flex-1 rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
          >
            Annuler
          </Focusable>
        </div>
      </div>
    </div>
  );
}
