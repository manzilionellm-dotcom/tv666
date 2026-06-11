// The Few — Suivi des « dernières vues » (historique de lecture local).

export type RecentType = "live" | "movie" | "series";

export interface RecentItem {
  type: RecentType;
  id: string;
  name: string;
  ext?: string; // films / épisodes
  arch?: number; // live : tv_archive
  at: number; // horodatage (tri)
}

const KEY = "thefew.recent";
const MAX = 20;
export const RECENT_EVENT = "thefew:recent";

function read(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function write(list: RecentItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(RECENT_EVENT));
}

const keyOf = (type: RecentType, id: string) => `${type}:${id}`;

/** Enregistre/replace l'élément en tête de l'historique (max 20). */
export function addRecent(item: Omit<RecentItem, "at">): void {
  const k = keyOf(item.type, item.id);
  const next = read().filter((r) => keyOf(r.type, r.id) !== k);
  next.unshift({ ...item, at: Date.now() });
  write(next.slice(0, MAX));
}

export function listRecent(): RecentItem[] {
  return read();
}
