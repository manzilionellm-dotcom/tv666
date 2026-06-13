"use client";

// The Few — Bouton étoile : ajoute/retire l'élément courant des favoris.

import { useEffect, useState } from "react";
import Focusable from "./tv/Focusable";
import { isFavorite, toggleFavorite, type FavItem } from "@/lib/favorites";

export default function FavButton({
  item,
  className = "",
}: {
  item: FavItem;
  className?: string;
}) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    // État initial lu côté client (localStorage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFav(isFavorite(item.type, item.id));
  }, [item.type, item.id]);

  return (
    <Focusable
      onClick={() => setFav(toggleFavorite(item))}
      aria-pressed={fav}
      className={`flex items-center gap-2 rounded-full border px-6 py-3 text-lg ${
        fav
          ? "border-primary-500 bg-primary-500/10 text-primary-500"
          : "border-neutral-700 text-neutral-50 hover:bg-neutral-800"
      } ${className}`}
    >
      <span aria-hidden>{fav ? "★" : "☆"}</span>
      {fav ? "Dans les favoris" : "Ajouter aux favoris"}
    </Focusable>
  );
}
