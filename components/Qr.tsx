"use client";

// The Few — Affiche une chaîne sous forme de QR code (pour activation revendeur).

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function Qr({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0e0e0e", light: "#f5f1e8" },
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);

  if (!src) {
    return (
      <div
        className="rounded-xl bg-neutral-800"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR code d'activation" width={size} height={size} className="rounded-xl" />;
}
