// Black Seven TV — Couche télécommande universelle.
// Normalise n'importe quelle télécommande (Android TV, Fire TV, Tizen/Samsung,
// webOS/LG, HbbTV, Vidaa…) en actions sémantiques. Les codes touches varient
// fortement selon la marque : on mappe DONC à la fois `e.key` ET `e.keyCode`.
//
// Règle d'or : aucune fonctionnalité ne doit dépendre d'une touche « bonus »
// (Ch+/−, couleurs, média, chiffres). Le socle reste D-pad + OK + Back, que
// possède n'importe quelle télécommande.

export type RemoteAction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "ok"
  | "back"
  | "channelUp"
  | "channelDown"
  | "playPause"
  | "stop"
  | "fastForward"
  | "rewind"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "digit";

// Correspondance par nom de touche (KeyboardEvent.key).
const KEY_MAP: Record<string, RemoteAction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "ok",
  Select: "ok",
  Back: "back",
  BrowserBack: "back",
  GoBack: "back",
  XF86Back: "back",
  Escape: "back",
  Backspace: "back",
  ChannelUp: "channelUp",
  PageUp: "channelUp",
  ChannelDown: "channelDown",
  PageDown: "channelDown",
  MediaPlayPause: "playPause",
  MediaPlay: "playPause",
  MediaPause: "playPause",
  Play: "playPause",
  Pause: "playPause",
  MediaStop: "stop",
  MediaFastForward: "fastForward",
  MediaRewind: "rewind",
  ColorF0Red: "red",
  ColorF1Green: "green",
  ColorF2Yellow: "yellow",
  ColorF3Blue: "blue",
};

// Correspondance par code numérique (KeyboardEvent.keyCode), multi-plateforme.
const CODE_MAP: Record<number, RemoteAction> = {
  38: "up",
  40: "down",
  37: "left",
  39: "right",
  13: "ok", // DPAD_CENTER se traduit en 13 dans la WebView
  8: "back", // Backspace
  27: "back", // Escape
  461: "back", // webOS / HbbTV
  10009: "back", // Tizen
  88: "back", // Samsung Orsay
  166: "back", // BrowserBack (certains Android)
  4: "back", // KEYCODE_BACK natif si remonté
  427: "channelUp", // Tizen
  33: "channelUp", // PageUp / webOS
  428: "channelDown", // Tizen
  34: "channelDown", // PageDown / webOS
  415: "playPause",
  19: "playPause",
  10252: "playPause", // Tizen PlayPause
  463: "playPause",
  179: "playPause", // Android MediaPlayPause
  413: "stop",
  178: "stop",
  417: "fastForward",
  228: "fastForward",
  412: "rewind",
  227: "rewind",
  403: "red",
  404: "green",
  405: "yellow",
  406: "blue",
};

/** Action sémantique pour un événement clavier de télécommande, ou null. */
export function remoteAction(e: KeyboardEvent): RemoteAction | null {
  const byKey = KEY_MAP[e.key];
  if (byKey) return byKey;
  const byCode = CODE_MAP[e.keyCode];
  if (byCode) return byCode;
  if (/^[0-9]$/.test(e.key)) return "digit";
  if (
    (e.keyCode >= 48 && e.keyCode <= 57) ||
    (e.keyCode >= 96 && e.keyCode <= 105)
  ) {
    return "digit";
  }
  return null;
}

/** Chiffre 0-9 pressé, ou null (utile pour la saisie directe d'un numéro). */
export function remoteDigit(e: KeyboardEvent): number | null {
  if (/^[0-9]$/.test(e.key)) return Number(e.key);
  if (e.keyCode >= 48 && e.keyCode <= 57) return e.keyCode - 48;
  if (e.keyCode >= 96 && e.keyCode <= 105) return e.keyCode - 96;
  return null;
}

/** True si la cible de l'événement est un champ de saisie (ne pas détourner). */
export function isTextEntry(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}
