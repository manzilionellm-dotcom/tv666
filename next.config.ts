import type { NextConfig } from "next";

// Black Seven TV — Export statique pour l'APK autonome (Capacitor).
// L'app est entièrement cliente et bundlée dans l'APK ; elle parle directement
// au serveur Xtream via HTTP natif (CapacitorHttp), sans serveur web.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
