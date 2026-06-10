import type { CapacitorConfig } from "@capacitor/cli";

// Black Seven TV — Wrapper Android TV (Capacitor).
// L'APK charge l'app web Black Seven TV déployée (mode server.url), ce qui
// conserve les proxys anti-CORS (/api/xtream, /api/stream) côté serveur.
//
// Définis l'URL déployée au moment du build, ex :
//   BLACK7_APP_URL="https://ton-app.vercel.app" npx cap sync android
const appUrl = process.env.BLACK7_APP_URL;

const config: CapacitorConfig = {
  appId: "com.blackseven.tv",
  appName: "Black Seven TV",
  webDir: "capacitor-fallback",
  server: {
    // cleartext : autorise les serveurs/flux IPTV en http (très courant).
    cleartext: true,
    ...(appUrl ? { url: appUrl } : {}),
  },
  android: {
    // Autorise le contenu mixte (segments http dans une page https).
    allowMixedContent: true,
  },
};

export default config;
