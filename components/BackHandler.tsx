"use client";

// The Few — Gestion du bouton Retour matériel (Android).
// - Écran racine (accueil/login) : propose « Quitter ? » au lieu de fermer
//   brutalement l'application.
// - Ailleurs : recule d'un écran (fil d'Ariane).

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import Focusable from "@/components/tv/Focusable";

const ROOTS = new Set(["/home", "/login", "/"]);

export default function BackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const [askExit, setAskExit] = useState(false);

  const pathRef = useRef(pathname);
  const askRef = useRef(false);

  // Sync hors render (la mise à jour d'une ref pendant le render est interdite).
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  function setAsk(v: boolean) {
    askRef.current = v;
    setAskExit(v);
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => void } | null = null;
    App.addListener("backButton", () => {
      if (askRef.current) {
        setAsk(false); // un 2e Retour annule la fenêtre
        return;
      }
      if (ROOTS.has(pathRef.current)) {
        setAsk(true);
      } else {
        router.back();
      }
    }).then((h) => {
      handle = h;
    });
    return () => {
      if (handle) handle.remove();
    };
  }, [router]);

  if (!askExit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-neutral-900 p-8">
        <h2 className="text-2xl font-semibold text-neutral-50">
          Quitter The Few ?
        </h2>
        <div className="flex gap-3">
          <Focusable
            autoFocusOnMount
            onClick={() => setAsk(false)}
            className="flex-1 rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
          >
            Annuler
          </Focusable>
          <Focusable
            onClick={() => {
              setAsk(false);
              App.exitApp();
            }}
            className="flex-1 rounded-full bg-primary-500 px-6 py-3 text-lg font-semibold text-neutral-950 hover:bg-primary-400"
          >
            Quitter
          </Focusable>
        </div>
      </div>
    </div>
  );
}
