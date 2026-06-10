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

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      cache: "no-store",
      headers: UPSTREAM_HEADERS,
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

  // Segment / binaire : on relaie le flux tel quel.
  return new Response(upstream.body, {
    headers: {
      "content-type": contentType || "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
