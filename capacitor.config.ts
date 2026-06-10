import type { CapacitorConfig } from "@capacitor/cli";

// Black Seven TV — APK Android TV autonome (Capacitor).
// L'app web (export statique Next dans `out/`) est bundlée dans l'APK. Elle
// appelle directement le serveur Xtream ; CapacitorHttp fournit le HTTP natif
// qui contourne le CORS et autorise le cleartext http (panels/flux IPTV en http).
const config: CapacitorConfig = {
  appId: "com.blackseven.tv",
  appName: "Black Seven TV",
  webDir: "out",
  server: {
    // Autorise les serveurs/flux IPTV en http (très courant).
    cleartext: true,
    androidScheme: "http",
  },
  android: {
    // Autorise le contenu mixte (segments http dans une page locale).
    allowMixedContent: true,
  },
  plugins: {
    // Patche fetch/XHR vers le HTTP natif -> pas de CORS pour l'API et hls.js.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
