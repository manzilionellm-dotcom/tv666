// Black Seven TV — Contrôle parental. PIN local + détection des catégories adultes.
// Le PIN n'est qu'un garde-fou d'affichage local (pas une sécurité forte).

const PIN_KEY = "black7tv.parental.pin";
const UNLOCK_KEY = "black7tv.parental.unlocked"; // sessionStorage : déverrouillé pour la session

const ADULT_PATTERNS = [
  "xxx",
  "adult",
  "adulte",
  "porn",
  "+18",
  "18+",
  "for adults",
  "erotic",
];

/** Catégorie « adulte » d'après son libellé. */
export function isAdultCategory(name: string): boolean {
  const n = name.toLowerCase();
  return ADULT_PATTERNS.some((p) => n.includes(p));
}

export function getPin(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PIN_KEY);
}

export function isParentalEnabled(): boolean {
  return getPin() !== null;
}

export function setPin(pin: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PIN_KEY, pin);
}

export function clearPin(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PIN_KEY);
  window.sessionStorage.removeItem(UNLOCK_KEY);
}

export function verifyPin(pin: string): boolean {
  return getPin() === pin;
}

/** Déverrouillé pour la session courante (après saisie correcte du PIN). */
export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
}

export function unlockSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(UNLOCK_KEY, "1");
}

/** True si la catégorie doit être verrouillée maintenant (adulte + PIN + non déverrouillé). */
export function categoryLocked(name: string): boolean {
  return isAdultCategory(name) && isParentalEnabled() && !isUnlocked();
}
