// The Few — Météo « best-effort » pour le salut d'accueil (sans clé API).
// Géoloc par IP (ipapi.co) puis température (open-meteo). Non bloquant.

export interface Weather {
  city: string;
  temp: number;
}

export async function getWeather(): Promise<Weather | null> {
  try {
    const geo = await fetch("https://ipapi.co/json/").then((r) => r.json());
    const lat = geo?.latitude;
    const lon = geo?.longitude;
    const city: string = geo?.city ?? "";
    if (typeof lat !== "number" || typeof lon !== "number") return null;
    const w = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`,
    ).then((r) => r.json());
    const temp = w?.current?.temperature_2m;
    if (typeof temp !== "number") return null;
    return { city, temp: Math.round(temp) };
  } catch {
    return null;
  }
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 18) return "Bonjour";
  return "Bonsoir";
}

export function dayLabel(d = new Date()): string {
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
