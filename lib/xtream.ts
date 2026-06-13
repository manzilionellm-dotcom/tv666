// The Few — Client Xtream Codes (côté appareil).
// L'app étant un APK autonome (Capacitor), elle appelle DIRECTEMENT le serveur
// Xtream. Le CORS et le cleartext http sont gérés nativement par CapacitorHttp
// (qui patche fetch/XHR sur l'appareil). En navigateur, ces appels peuvent
// échouer au CORS : le produit cible est l'APK.

import type {
  XtreamAuthResponse,
  XtreamCategory,
  XtreamCredentials,
  XtreamLiveStream,
  XtreamSeries,
  XtreamSeriesInfo,
  XtreamShortEpgEntry,
  XtreamVodInfo,
  XtreamVodStream,
} from "./types";

/** Normalise la base serveur : ajoute http:// si absent, retire le / final. */
export function normalizeServer(server: string): string {
  let s = server.trim();
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, "");
}

// Cache de session des listes (catégories/chaînes/films/séries) : la
// navigation devient instantanée après le premier chargement. TTL 10 min.
const CACHEABLE = new Set([
  "get_live_categories",
  "get_live_streams",
  "get_vod_categories",
  "get_vod_streams",
  "get_series_categories",
  "get_series",
  "get_series_info",
  "get_vod_info",
]);
const CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(
  creds: XtreamCredentials,
  action: string,
  params?: Record<string, string | number>,
): string {
  return `thefew.cache:${creds.server}:${creds.username}:${action}:${JSON.stringify(params ?? {})}`;
}

function cacheRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw) as { t: number; d: T };
    if (Date.now() - t > CACHE_TTL_MS) return null;
    return d;
  } catch {
    return null;
  }
}

function cacheWrite(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({ t: Date.now(), d: data }),
    );
  } catch {
    // quota plein (gros catalogues) : on vit sans cache pour cette entrée
  }
}

async function call<T>(
  creds: XtreamCredentials,
  action?: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const key =
    action && CACHEABLE.has(action) ? cacheKey(creds, action, params) : null;
  if (key) {
    const cached = cacheRead<T>(key);
    if (cached !== null) return cached;
  }

  const base = normalizeServer(creds.server);
  const sp = new URLSearchParams({
    username: creds.username,
    password: creds.password,
  });
  if (action) sp.set("action", action);
  if (params) {
    for (const [k, v] of Object.entries(params)) sp.set(k, String(v));
  }
  const res = await fetch(`${base}/player_api.php?${sp.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = (await res.json()) as T;
  if (key) cacheWrite(key, data);
  return data;
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

// Tri par `num` : respecte l'alignement/numérotation imposé par le fournisseur
// (Xtream Codes / M3U), comme le font les autres lecteurs IPTV.
function byNum<T extends { num?: number }>(a: T, b: T): number {
  return (a.num ?? 0) - (b.num ?? 0);
}

export function getLiveStreams(
  creds: XtreamCredentials,
  categoryId?: string,
): Promise<XtreamLiveStream[]> {
  return call<XtreamLiveStream[]>(
    creds,
    "get_live_streams",
    categoryId ? { category_id: categoryId } : undefined,
  ).then((list) => [...list].sort(byNum));
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
  ).then((list) => [...list].sort(byNum));
}

/** Fiche détaillée d'un film (synopsis, affiche large, durée, note…). */
export function getVodInfo(
  creds: XtreamCredentials,
  vodId: number,
): Promise<XtreamVodInfo> {
  return call<XtreamVodInfo>(creds, "get_vod_info", { vod_id: vodId });
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
  ).then((list) => [...list].sort(byNum));
}

export function getSeriesInfo(
  creds: XtreamCredentials,
  seriesId: number,
): Promise<XtreamSeriesInfo> {
  return call<XtreamSeriesInfo>(creds, "get_series_info", {
    series_id: seriesId,
  });
}

// --- URLs de flux (directes vers le serveur Xtream) ---

function streamBase(creds: XtreamCredentials, kind: string): string {
  return `${normalizeServer(creds.server)}/${kind}/${encodeURIComponent(
    creds.username,
  )}/${encodeURIComponent(creds.password)}`;
}

/** Flux live (.m3u8) chargé par hls.js (XHR natif via CapacitorHttp). */
export function liveStreamUrl(
  creds: XtreamCredentials,
  streamId: number,
): string {
  return `${streamBase(creds, "live")}/${streamId}.m3u8`;
}

/** Flux d'un film VOD (fichier direct mp4/mkv…). */
export function vodStreamUrl(
  creds: XtreamCredentials,
  streamId: number,
  ext: string,
): string {
  return `${streamBase(creds, "movie")}/${streamId}.${ext || "mp4"}`;
}

/** Flux d'un épisode de série (fichier direct). */
export function seriesStreamUrl(
  creds: XtreamCredentials,
  episodeId: string,
  ext: string,
): string {
  return `${streamBase(creds, "series")}/${episodeId}.${ext || "mp4"}`;
}

/**
 * Catch-up / replay (timeshift). Pour les chaînes avec tv_archive=1.
 * @param startISO Date de début au format "YYYY-MM-DD:HH-MM".
 * @param durationMin Durée en minutes.
 */
export function timeshiftUrl(
  creds: XtreamCredentials,
  streamId: number,
  startISO: string,
  durationMin: number,
): string {
  return `${streamBase(creds, "timeshift")}/${durationMin}/${startISO}/${streamId}.m3u8`;
}

/** Formate un timestamp unix (secondes) en "YYYY-MM-DD:HH-MM" pour le timeshift. */
export function toTimeshiftStart(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}:${p(
    d.getHours(),
  )}-${p(d.getMinutes())}`;
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
