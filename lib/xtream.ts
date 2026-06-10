// Black Seven TV — Client Xtream Codes (côté navigateur).
// Tous les appels passent par le proxy serveur /api/xtream pour contourner le CORS
// des panels Xtream. Les flux vidéo passent par /api/stream (proxy HLS).

import type {
  XtreamAuthResponse,
  XtreamCategory,
  XtreamCredentials,
  XtreamLiveStream,
  XtreamShortEpgEntry,
} from "./types";

/** Normalise la base serveur : ajoute http:// si absent, retire le / final. */
export function normalizeServer(server: string): string {
  let s = server.trim();
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, "");
}

async function call<T>(
  creds: XtreamCredentials,
  action?: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const res = await fetch("/api/xtream", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...creds, action, params }),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || `Erreur ${res.status}`);
  }
  return data as T;
}

/** Authentifie et renvoie les infos compte/serveur. Lève une erreur si refusé. */
export async function authenticate(
  creds: XtreamCredentials,
): Promise<XtreamAuthResponse> {
  const data = await call<XtreamAuthResponse>(creds);
  if (!data?.user_info || Number(data.user_info.auth) !== 1) {
    throw new Error("Identifiants refusés par le serveur.");
  }
  if (data.user_info.status && data.user_info.status !== "Active") {
    throw new Error(`Compte ${data.user_info.status}.`);
  }
  return data;
}

export function getLiveCategories(
  creds: XtreamCredentials,
): Promise<XtreamCategory[]> {
  return call<XtreamCategory[]>(creds, "get_live_categories");
}

export function getLiveStreams(
  creds: XtreamCredentials,
  categoryId?: string,
): Promise<XtreamLiveStream[]> {
  return call<XtreamLiveStream[]>(
    creds,
    "get_live_streams",
    categoryId ? { category_id: categoryId } : undefined,
  );
}

export function getShortEpg(
  creds: XtreamCredentials,
  streamId: number,
  limit = 2,
): Promise<{ epg_listings: XtreamShortEpgEntry[] }> {
  return call<{ epg_listings: XtreamShortEpgEntry[] }>(creds, "get_short_epg", {
    stream_id: streamId,
    limit,
  });
}

/** URL du flux live (.m3u8) servie via le proxy HLS pour éviter le CORS. */
export function liveStreamUrl(
  creds: XtreamCredentials,
  streamId: number,
): string {
  const base = normalizeServer(creds.server);
  const direct = `${base}/live/${encodeURIComponent(creds.username)}/${encodeURIComponent(
    creds.password,
  )}/${streamId}.m3u8`;
  return `/api/stream?kind=playlist&url=${encodeURIComponent(direct)}`;
}

/** Décode un champ base64 EPG (titre/description), tolérant aux valeurs vides. */
export function decodeEpg(value: string | undefined | null): string {
  if (!value) return "";
  try {
    if (typeof window !== "undefined") {
      return decodeURIComponent(escape(window.atob(value)));
    }
    return Buffer.from(value, "base64").toString("utf-8");
  } catch {
    return value;
  }
}
