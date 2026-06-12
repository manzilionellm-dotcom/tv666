// The Few — Liste « À regarder plus tard » (marque-pages, stockage local).
// NB : ce n'est pas un enregistrement DVR (impossible côté client) ; pour
// revoir un live passé, utiliser le catch-up des chaînes à archive.

export type WatchType = "live" | "movie" | "series";

export interface WatchItem {
  type: WatchType;
  id: string;
  name: string;
  ext?: string;
  arch?: number;
}

const KEY = "thefew.watchlater";
export const WATCHLATER_EVENT = "thefew:watchlater";

function read(): WatchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WatchItem[]) : [];
  } catch {
    return [];
  }
}

function write(list: WatchItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(WATCHLATER_EVENT));
}

const keyOf = (type: WatchType, id: string) => `${type}:${id}`;

export function listWatchLater(): WatchItem[] {
  return read();
}

export function isWatchLater(type: WatchType, id: string): boolean {
  return read().some((w) => keyOf(w.type, w.id) === keyOf(type, id));
}

/** Ajoute/retire ; renvoie le nouvel état (true = dans la liste). */
export function toggleWatchLater(item: WatchItem): boolean {
  const k = keyOf(item.type, item.id);
  const list = read();
  const next = list.filter((w) => keyOf(w.type, w.id) !== k);
  if (next.length === list.length) {
    next.unshift(item);
    write(next);
    return true;
  }
  write(next);
  return false;
}

export function removeWatchLater(type: WatchType, id: string): void {
  write(read().filter((w) => keyOf(w.type, w.id) !== keyOf(type, id)));
}
