"use client";

// The Few — Barre latérale « DEFEW TV » : signature + navigation principale.

import { useRouter } from "next/navigation";
import Focusable from "@/components/tv/Focusable";

const NAV = [
  { label: "Direct", route: "/live", icon: "▷" },
  { label: "Films", route: "/vod", icon: "🎬" },
  { label: "Séries", route: "/series", icon: "📺" },
  { label: "Guide", route: "/guide", icon: "🗓" },
  { label: "Recherche", route: "/search", icon: "🔍" },
  { label: "Multiview", route: "/multiview", icon: "▦" },
  { label: "Réglages", route: "/settings", icon: "⚙" },
];

export default function Sidebar({
  active,
  focusFirst,
}: {
  active?: string;
  focusFirst?: boolean;
}) {
  const router = useRouter();
  return (
    <aside className="tv-scroll flex w-60 shrink-0 flex-col gap-1 overflow-y-auto bg-neutral-900 p-6">
      <div className="mb-6 flex flex-col leading-none">
        <span className="font-serif text-3xl italic tracking-wide text-primary-500">
          The Few
        </span>
        <span className="mt-1 text-[0.55rem] tracking-[0.4em] text-neutral-400">
          NOT FOR EVERYONE
        </span>
        <span className="mt-3 text-xs tracking-[0.35em] text-neutral-500">
          DEFEW TV
        </span>
      </div>
      {NAV.map((n, i) => {
        const on = active === n.route;
        return (
          <Focusable
            key={n.route}
            autoFocusOnMount={focusFirst && i === 0}
            onClick={() => router.push(n.route)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-lg ${
              on
                ? "bg-neutral-800 text-primary-500"
                : "text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <span aria-hidden className="w-5 text-center">
              {n.icon}
            </span>
            {n.label}
          </Focusable>
        );
      })}
    </aside>
  );
}
