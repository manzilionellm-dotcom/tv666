"use client";

// The Few — Barre latérale « DEFEW TV ». Item actif = fond --sel + barre or à
// gauche + texte or (jamais de bloc blanc plein).

import { useRouter } from "next/navigation";
import Focusable from "@/components/tv/Focusable";
import Logo from "@/components/ui/Logo";
import {
  IconDirect,
  IconFilms,
  IconGuide,
  IconSearch,
  IconSeries,
  IconSettings,
} from "@/components/ui/icons";

const NAV = [
  { label: "Direct", route: "/live", Icon: IconDirect },
  { label: "Films", route: "/vod", Icon: IconFilms },
  { label: "Séries", route: "/series", Icon: IconSeries },
  { label: "Guide", route: "/guide", Icon: IconGuide },
  { label: "Recherche", route: "/search", Icon: IconSearch },
  { label: "Réglages", route: "/settings", Icon: IconSettings },
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
    <aside className="tv-scroll flex w-[15rem] shrink-0 flex-col gap-1 overflow-y-auto border-r border-line-soft bg-panel px-5 py-7">
      <div className="mb-7 px-2">
        <Logo size="sm" productLabel />
      </div>
      {NAV.map((n, i) => {
        const on = active === n.route;
        const { Icon } = n;
        return (
          <Focusable
            key={n.route}
            autoFocusOnMount={focusFirst && i === 0}
            onClick={() => router.push(n.route)}
            className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[1.18rem] ${
              on
                ? "bg-sel font-semibold text-gold-bright"
                : "text-muted hover:bg-sel hover:text-gold"
            }`}
          >
            {on && (
              <span className="absolute inset-y-[14px] left-0 w-[3px] rounded-full bg-gold" />
            )}
            <Icon className={on ? "text-gold" : ""} />
            {n.label}
          </Focusable>
        );
      })}
    </aside>
  );
}
