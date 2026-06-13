"use client";

// The Few — Bouton focusable de base. Élément natif <button> (Entrée/OK
// gérés nativement) marqué data-focusable pour la navigation spatiale.

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  autoFocusOnMount?: boolean;
};

export default function Focusable({
  className = "",
  autoFocusOnMount,
  ...rest
}: Props) {
  return (
    <button
      data-focusable=""
      autoFocus={autoFocusOnMount}
      className={`tv-focusable ${className}`}
      {...rest}
    />
  );
}
