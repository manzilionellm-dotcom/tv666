// Black Seven TV — Client Xtream Codes (côté navigateur).
// Tous les appels passent par le proxy serveur /api/xtream pour contourner le CORS
// des panels Xtream. Les flux vidéo passent par /api/stream (proxy HLS).

import type {
  XtreamAuthResponse,
  XtreamCategory,
  XtreamCredentials,
  XtreamLiveStream,
  XtreamSeries,
  XtreamSeriesInfo,
  XtreamShortEpgEntry,
  XtreamVodStream,
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

// --- VOD (Films) ---

export function getVodCategories(
  creds: XtreamCredentials,
): Promise<XtreamCategory[]> {
  return call<XtreamCategory[]>(creds, "get_vod_categories");
}

export function getVodStreams(
  creds: XtreamCredentials,
  categoryId?: string,
): Promise<XtreamVodStream[]> {
  return call<XtreamVodStream[]>(
    creds,
    "get_vod_streams",
    categoryId ? { category_id: categoryId } : undefined,
  );
}

// --- Séries ---

export function getSeriesCategories(
  creds: XtreamCredentials,
): Promise<XtreamCategory[]> {
  return call<XtreamCategory[]>(creds, "get_series_categories");
}

export function getSeries(
  creds: XtreamCredentials,
  categoryId?: string,
): Promise<XtreamSeries[]> {
  return call<XtreamSeries[]>(
    creds,
    "get_series",
    categoryId ? { category_id: categoryId } : undefined,
  );
}

export function getSeriesInfo(
  creds: XtreamCredentials,
  seriesId: number,
): Promise<XtreamSeriesInfo> {
  return call<XtreamSeriesInfo>(creds, "get_series_info", {
    series_id: seriesId,
  });
}

// --- URLs de flux (via proxy /api/stream) ---

function proxied(direct: string, kind: "playlist" | "auto"): string {
  return `/api/stream?kind=${kind}&url=${encodeURIComponent(direct)}`;
}

function streamBase(creds: XtreamCredentials): string {
  return `${normalizeServer(creds.server)}/{kind}/${encodeURIComponent(
    creds.username,
  )}/${encodeURIComponent(creds.password)}`;
}

/** Flux live (.m3u8) servi via le proxy HLS pour éviter le CORS. */
export function liveStreamUrl(
  creds: XtreamCredentials,
  streamId: number,
): string {
  const direct = `${streamBase(creds).replace("{kind}", "live")}/${streamId}.m3u8`;
  return proxied(direct, "playlist");
}

/** Flux d'un film VOD (fichier direct mp4/mkv…). */
export function vodStreamUrl(
  creds: XtreamCredentials,
  streamId: number,
  ext: string,
): string {
  const direct = `${streamBase(creds).replace("{kind}", "movie")}/${streamId}.${ext || "mp4"}`;
  return proxied(direct, "auto");
}

/** Flux d'un épisode de série (fichier direct). */
export function seriesStreamUrl(
  creds: XtreamCredentials,
  episodeId: string,
  ext: string,
): string {
  const direct = `${streamBase(creds).replace("{kind}", "series")}/${episodeId}.${ext || "mp4"}`;
  return proxied(direct, "auto");
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
