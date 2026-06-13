"use client";

// The Few — Bouton. Primaire = or dominant (dégradé + ombre). Secondaire =
// contour discret. Toujours focusable (D-pad).

import type { ReactNode } from "react";
import Focusable from "@/components/tv/Focusable";

export default function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  fullWidth = false,
  autoFocusOnMount,
  className = "",
  type = "button",
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  autoFocusOnMount?: boolean;
  className?: string;
  type?: "button" | "submit";
  ariaPressed?: boolean;
}) {
  const base =
    "rounded-[14px] px-8 py-4 text-lg font-semibold disabled:opacity-50";
  const look =
    variant === "primary"
      ? "bg-gradient-to-b from-gold-bright to-gold text-cta-ink shadow-[0_8px_30px_-10px_rgba(204,176,137,0.55)] hover:brightness-105"
      : "border border-line text-text hover:bg-sel";
  return (
    <Focusable
      type={type}
      onClick={onClick}
      disabled={disabled}
      autoFocusOnMount={autoFocusOnMount}
      aria-pressed={ariaPressed}
      className={`${base} ${look} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </Focusable>
  );
}
