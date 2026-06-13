// The Few — Stockage local des identifiants Xtream (sur l'appareil).
// Les identifiants ne servent qu'aux appels directs vers le serveur Xtream.

import type { XtreamCredentials } from "./types";

const KEY = "black7tv.creds";

export function saveCredentials(creds: XtreamCredentials): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(creds));
}

export function loadCredentials(): XtreamCredentials | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as XtreamCredentials;
    if (parsed.server && parsed.username && parsed.password) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
