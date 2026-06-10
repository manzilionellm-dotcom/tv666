# Black Seven TV — APK Android TV (autonome)

## Architecture

Black Seven TV est une **app web Next.js entièrement cliente** (login Xtream →
Live / VOD / Séries / Guide / Multiview…) **exportée en statique** et **bundlée
dans un APK Android TV** via Capacitor.

L'app **parle directement au serveur Xtream Codes** depuis l'appareil. Le plugin
**CapacitorHttp** fournit le HTTP natif qui contourne le CORS et autorise le
`http://` (cleartext) très courant chez les fournisseurs IPTV. **Aucun serveur
web à héberger.**

```
TV ──(Downloader installe l'APK)──> Black Seven TV (WebView leanback)
                                         │ appels directs (HTTP natif)
                                         ▼
                              Serveur Xtream Codes (IPTV)
```

> ⚠️ Le SDK Android n'est pas présent dans l'environnement cloud : la
> compilation se fait **en CI (GitHub Actions)** ou **chez toi** (Android Studio).

---

## Option A — Télécharger l'APK déjà compilée (recommandé)

Le workflow GitHub Actions **« Build Android TV APK »** compile l'APK à chaque
push et la publie en Release :

- **Lien permanent :**
  `https://github.com/manzilionellm-dotcom/tv666/releases/download/apk-latest/black-seven-tv.apk`

Tu peux aussi relancer le build à la main : onglet **Actions → Build Android TV
APK → Run workflow**, puis récupérer l'`artifact` ou la Release.

---

## Option B — Compiler en local

```bash
npm install
npm run build            # export statique -> out/
npx cap sync android     # copie out/ dans le projet Android

# Android Studio :
npx cap open android     # puis Build > Build APK(s)

# …ou en ligne de commande (nécessite le SDK Android) :
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

### APK de release signé (distribution)

```bash
keytool -genkey -v -keystore black7tv.keystore \
  -alias black7tv -keyalg RSA -keysize 2048 -validity 10000
# Configurer signingConfigs dans android/app/build.gradle puis :
cd android && ./gradlew assembleRelease
```

---

## Charger sur la TV via Downloader

1. Installe **Downloader** (AFTVnews) sur la TV / box Android.
2. Saisis l'**URL** de l'APK (le lien de Release ci-dessus), ou crée un **code
   court** gratuit sur <https://downloader.aftvnews.com> pointant vers cette URL.
3. Downloader télécharge et installe l'APK. Black Seven TV apparaît sur l'écran
   d'accueil Android TV.

---

## Notes techniques

- **Autonome** : aucun hébergement. L'app embarque tout et appelle Xtream en
  direct (CapacitorHttp `enabled: true`, voir `capacitor.config.ts`).
- **Cleartext / contenu mixte** activés : les serveurs/flux IPTV en `http://`
  fonctionnent.
- **Live** : `hls.js` lit les `.m3u8` ; ses requêtes XHR passent par le HTTP
  natif (CapacitorHttp). C'est le point à valider sur ta TV si une chaîne ne
  démarre pas.
- **VOD / Séries** : fichiers `mp4/mkv` lus directement par la balise `<video>`
  (seek natif).
- **Manifeste TV** : `LEANBACK_LAUNCHER`, écran tactile non requis.
- **Mise à jour** : l'app étant bundlée, une nouvelle version = un nouveau build
  APK (relancer le workflow).
