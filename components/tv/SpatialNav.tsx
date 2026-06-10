"use client";

// Black Seven TV — Navigation spatiale à la télécommande (D-pad).
// Déplace le focus vers l'élément focusable le plus proche dans la direction
// de la flèche. Les éléments natifs (button/a/input) gèrent Entrée/OK eux-mêmes.

import { useEffect } from "react";

type Dir = "up" | "down" | "left" | "right";

const KEY_TO_DIR: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function candidates(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-focusable]"),
  ).filter(
    (el) =>
      el.offsetParent !== null &&
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-disabled") !== "true",
  );
}

function center(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Meilleur candidat dans la direction : axe principal dominant, écart latéral pénalisé. */
function pick(current: HTMLElement, dir: Dir): HTMLElement | null {
  const from = center(current);
  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of candidates()) {
    if (el === current) continue;
    const to = center(el);
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    let primary: number, cross: number;
    if (dir === "right") {
      if (dx <= 1) continue;
      primary = dx;
      cross = Math.abs(dy);
    } else if (dir === "left") {
      if (dx >= -1) continue;
      primary = -dx;
      cross = Math.abs(dy);
    } else if (dir === "down") {
      if (dy <= 1) continue;
      primary = dy;
      cross = Math.abs(dx);
    } else {
      if (dy >= -1) continue;
      primary = -dy;
      cross = Math.abs(dx);
    }

    const score = primary + cross * 2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

export default function SpatialNav({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const dir = KEY_TO_DIR[e.key];
      if (!dir) return;

      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      // Dans un champ texte, gauche/droite déplacent le curseur : on n'intercepte pas.
      if (typing && (dir === "left" || dir === "right")) return;

      const all = candidates();
      if (all.length === 0) return;

      if (!active || !active.hasAttribute("data-focusable")) {
        e.preventDefault();
        all[0].focus();
        return;
      }

      const next = pick(active, dir);
      if (next) {
        e.preventDefault();
        next.focus();
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <>{children}</>;
}
