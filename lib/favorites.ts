// Black Seven TV — Favoris persistés en local (client uniquement).

export type FavType = "live" | "movie" | "series";

export interface FavItem {
  type: FavType;
  id: string; // stream_id / series_id
  name: string;
  icon?: string;
  ext?: string; // films : container_extension
}

const KEY = "black7tv.favorites";
export const FAV_EVENT = "black7tv:favorites";

function read(): FavItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavItem[]) : [];
  } catch {
    return [];
  }
}

function write(list: FavItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(FAV_EVENT));
}

const keyOf = (type: FavType, id: string) => `${type}:${id}`;

export function listFavorites(): FavItem[] {
  return read();
}

export function isFavorite(type: FavType, id: string): boolean {
  return read().some((f) => keyOf(f.type, f.id) === keyOf(type, id));
}

/** Ajoute ou retire ; renvoie le nouvel état (true = désormais favori). */
export function toggleFavorite(item: FavItem): boolean {
  const list = read();
  const k = keyOf(item.type, item.id);
  const next = list.filter((f) => keyOf(f.type, f.id) !== k);
  if (next.length === list.length) {
    next.unshift(item);
    write(next);
    return true;
  }
  write(next);
  return false;
}

export function removeFavorite(type: FavType, id: string): void {
  write(read().filter((f) => keyOf(f.type, f.id) !== keyOf(type, id)));
}
