// The Few — État vide soigné : pictogramme or encadré + titre Oswald + sous-texte.

import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-[78px] w-[78px] items-center justify-center rounded-2xl border border-line bg-gradient-to-b from-gold/[0.05] to-transparent text-gold">
        {icon}
      </div>
      <h2 className="font-display text-4xl text-text">{title}</h2>
      <p className="max-w-[440px] text-base text-muted-dim">{text}</p>
      {action}
    </div>
  );
}
