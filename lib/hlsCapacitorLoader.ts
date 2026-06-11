// The Few — Loader hls.js sur-mesure pour la WebView Capacitor.
//
// Problème : le patch global de CapacitorHttp corrompt le corps des requêtes
// XHR de hls.js (playlist .m3u8 renvoyée comme binaire/base64) -> levelParsingError.
// Solution : on court-circuite ce patch en appelant CapacitorHttp.request
// EXPLICITEMENT avec le bon responseType (« text » pour les playlists, binaire
// décodé pour les segments). Utilisé uniquement sur appareil natif.

import { CapacitorHttp } from "@capacitor/core";
import { LoadStats } from "hls.js";
import type {
  Loader,
  LoaderCallbacks,
  LoaderConfiguration,
  LoaderContext,
  LoaderResponse,
  LoaderStats,
} from "hls.js";

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
}

export class CapacitorHlsLoader implements Loader<LoaderContext> {
  context: LoaderContext | null = null;
  stats: LoaderStats = new LoadStats();
  private aborted = false;

  load(
    context: LoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<LoaderContext>,
  ): void {
    this.context = context;
    const stats = this.stats;
    const wantBuffer = context.responseType === "arraybuffer";
    const headers: Record<string, string> = { ...(context.headers ?? {}) };
    if (context.rangeEnd) {
      headers["Range"] =
        `bytes=${context.rangeStart ?? 0}-${context.rangeEnd - 1}`;
    }
    stats.loading.start = performance.now();

    CapacitorHttp.request({
      url: context.url,
      method: "GET",
      headers,
      responseType: wantBuffer ? "arraybuffer" : "text",
      connectTimeout: config.timeout,
      readTimeout: config.timeout,
    })
      .then((res) => {
        if (this.aborted) return;
        const now = performance.now();
        stats.loading.first = now;
        stats.loading.end = now;

        if (res.status < 200 || res.status >= 300) {
          callbacks.onError(
            { code: res.status, text: `HTTP ${res.status}` },
            context,
            res,
            stats,
          );
          return;
        }

        let data: string | ArrayBuffer;
        if (wantBuffer) {
          const b64 = typeof res.data === "string" ? res.data : "";
          const buf = base64ToArrayBuffer(b64);
          data = buf;
          stats.loaded = buf.byteLength;
          stats.total = buf.byteLength;
        } else {
          const text =
            typeof res.data === "string" ? res.data : JSON.stringify(res.data);
          data = text;
          stats.loaded = text.length;
          stats.total = text.length;
        }

        const response: LoaderResponse = { url: context.url, data };
        callbacks.onSuccess(response, stats, context, res);
      })
      .catch((err: unknown) => {
        if (this.aborted) return;
        const text = err instanceof Error ? err.message : String(err);
        callbacks.onError({ code: 0, text }, context, null, stats);
      });
  }

  abort(): void {
    this.aborted = true;
    this.stats.aborted = true;
  }

  destroy(): void {
    this.aborted = true;
    this.context = null;
  }
}
