// Black Seven TV — Proxy HLS. Récupère manifestes m3u8 et segments côté serveur
// (pas de CORS), et réécrit les URI internes des manifestes pour qu'ils repassent
// par ce même proxy. Permet à hls.js de lire des flux cross-origin.

export const dynamic = "force-dynamic";

const UPSTREAM_HEADERS = {
  "User-Agent": "BlackSevenTV/1.0",
  Accept: "*/*",
};

function proxify(absoluteUrl: string): string {
  return `/api/stream?kind=auto&url=${encodeURIComponent(absoluteUrl)}`;
}

/** Réécrit les URI (segments, sous-playlists, clés) en absolu puis via le proxy. */
function rewriteManifest(text: string, baseUrl: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === "") return line;
      if (trimmed.startsWith("#")) {
        // Réécrit les attributs URI="..." (ex: #EXT-X-KEY, #EXT-X-MEDIA).
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          try {
            return `URI="${proxify(new URL(uri, baseUrl).toString())}"`;
          } catch {
            return _m;
          }
        });
      }
      // Ligne d'URI (segment .ts ou variante .m3u8).
      try {
        return proxify(new URL(trimmed, baseUrl).toString());
      } catch {
        return line;
      }
    })
    .join("\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  const kind = searchParams.get("kind") ?? "auto";
  if (!target) {
    return new Response("Paramètre url manquant.", { status: 400 });
  }

  // Transfère l'en-tête Range (seek VOD : avance/recul dans un film).
  const range = request.headers.get("range");
  const fwdHeaders: Record<string, string> = { ...UPSTREAM_HEADERS };
  if (range) fwdHeaders["Range"] = range;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      cache: "no-store",
      headers: fwdHeaders,
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return new Response("Flux injoignable.", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(`Flux indisponible (${upstream.status}).`, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const path = target.split("?")[0].toLowerCase();
  const isPlaylist =
    kind === "playlist" ||
    /mpegurl|vnd\.apple/i.test(contentType) ||
    path.endsWith(".m3u8");

  if (isPlaylist) {
    const text = await upstream.text();
    // L'URL effective (après redirections) sert de base de résolution.
    const base = upstream.url || target;
    return new Response(rewriteManifest(text, base), {
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
      },
    });
  }

  // Segment / fichier (VOD) : on relaie le flux et les en-têtes de Range.
  const passthrough = new Headers({
    "content-type": contentType || "application/octet-stream",
    "Cache-Control": "no-store",
    "Accept-Ranges": upstream.headers.get("accept-ranges") ?? "bytes",
  });
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) passthrough.set("Content-Range", contentRange);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) passthrough.set("Content-Length", contentLength);

  return new Response(upstream.body, {
    status: upstream.status, // 206 Partial Content conservé
    headers: passthrough,
  });
}
