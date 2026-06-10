// Black Seven TV — Proxy serveur de l'API Xtream Codes (player_api.php).
// Contourne le CORS : le navigateur appelle cette route, le serveur appelle le panel.

import { normalizeServer } from "@/lib/xtream";

export const dynamic = "force-dynamic";

interface ProxyBody {
  server: string;
  username: string;
  password: string;
  action?: string;
  params?: Record<string, string | number>;
}

export async function POST(request: Request) {
  let body: ProxyBody;
  try {
    body = (await request.json()) as ProxyBody;
  } catch {
    return Response.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { server, username, password, action, params } = body;
  if (!server || !username || !password) {
    return Response.json(
      { error: "Serveur, utilisateur et mot de passe requis." },
      { status: 400 },
    );
  }

  let url: URL;
  try {
    url = new URL(`${normalizeServer(server)}/player_api.php`);
  } catch {
    return Response.json({ error: "Adresse de serveur invalide." }, { status: 400 });
  }
  url.searchParams.set("username", username);
  url.searchParams.set("password", password);
  if (action) url.searchParams.set("action", action);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "BlackSevenTV/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return Response.json(
      { error: "Serveur injoignable (timeout ou DNS). Vérifie l'adresse." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return Response.json(
      { error: `Le serveur a répondu ${upstream.status}.` },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Réponse non-JSON du serveur (identifiants ou URL incorrects ?)." },
      { status: 502 },
    );
  }

  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
