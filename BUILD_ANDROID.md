# Black Seven TV — Construire l'APK Android TV (et le charger via Downloader)

## Architecture

Black Seven TV est une **app web Next.js** (login Xtream Codes → TV en direct →
lecteur HLS) emballée dans un **APK Android TV** via Capacitor.

L'APK est une coquille TV (`leanback launcher`) qui **charge l'URL de l'app
déployée**. Ce mode `server.url` conserve les proxys serveur
(`/api/xtream`, `/api/stream`) qui contournent le CORS des panels IPTV — ce que
ne permettrait pas un export statique.

```
TV ──(Downloader installe l'APK)──> Black Seven TV (WebView leanback)
                                         │ charge
                                         ▼
                          https://ton-app  (Next.js déployé)
                                         │ proxys
                                         ▼
                              Serveur Xtream Codes (IPTV)
```

> ⚠️ Le SDK Android n'est pas présent dans l'environnement cloud : la compilation
> et la **signature** de l'APK se font **chez toi** (Android Studio) ou en CI.

---

## Étape 1 — Déployer l'app web

```bash
npm install
npm run build      # vérifie que tout compile
```

Déploie le dossier du projet sur un hébergeur Node (Vercel recommandé) :

```bash
npx vercel --prod      # nécessite ton compte Vercel
```

Note l'URL obtenue, ex : `https://black7tv.vercel.app`.

---

## Étape 2 — Générer et compiler l'APK

```bash
# 1) Pointer le wrapper vers l'URL déployée
export BLACK7_APP_URL="https://black7tv.vercel.app"

# 2) Synchroniser la config dans le projet Android
npm run android:sync

# 3a) Ouvrir dans Android Studio puis Build > Build APK(s)
npm run android:open

# 3b) …ou en ligne de commande (APK de debug)
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

### APK de release signé (pour distribution)

```bash
# Créer un keystore une seule fois
keytool -genkey -v -keystore black7tv.keystore \
  -alias black7tv -keyalg RSA -keysize 2048 -validity 10000

# Configurer la signature dans android/app/build.gradle (signingConfigs),
# puis :
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

---

## Étape 3 — Héberger l'APK

Mets `app-release.apk` à une **URL publique** (GitHub Releases, un bucket S3, un
hébergement statique…). Exemple : `https://black7tv.vercel.app/black7tv.apk`
(place le fichier dans `public/`).

---

## Étape 4 — Charger via Downloader sur la TV

1. Installe **Downloader** (AFTVnews) sur la TV / box Android.
2. Saisis l'**URL** de l'APK, ou crée un **code court** gratuit sur
   <https://downloader.aftvnews.com> qui pointe vers cette URL.
3. Downloader télécharge et installe l'APK. Black Seven TV apparaît sur l'écran
   d'accueil Android TV.

> Je ne peux pas générer le code Downloader (service tiers AFTVnews) : tu le crées
> à partir de l'URL de ton APK.

---

## Notes techniques

- **Cleartext / contenu mixte** activés (`capacitor.config.ts`) : les serveurs et
  flux IPTV en `http://` fonctionnent.
- **Manifeste TV** déjà configuré : `LEANBACK_LAUNCHER`, écran tactile non requis.
- **Bannière TV** (`android:banner`) optionnelle pour le sideload — à ajouter si
  tu publies sur le Play Store.
- **Mise à jour du contenu** : comme l'APK charge l'URL déployée, tout changement
  redéployé sur le web est visible **sans réinstaller** l'APK.
