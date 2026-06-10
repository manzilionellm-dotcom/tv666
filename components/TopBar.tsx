"use client";

// Black Seven TV — Barre supérieure : retour Accueil + titre de section.

import { useRouter } from "next/navigation";
import Focusable from "./tv/Focusable";

export default function TopBar({
  title,
  focusBack,
}: {
  title: string;
  focusBack?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="flex items-center gap-6">
      <Focusable
        autoFocusOnMount={focusBack}
        onClick={() => router.push("/home")}
        className="rounded-full border border-neutral-700 px-6 py-3 text-lg text-neutral-50 hover:bg-neutral-800"
      >
        ← Accueil
      </Focusable>
      <h1 className="text-3xl font-semibold text-neutral-50">{title}</h1>
    </header>
  );
}
