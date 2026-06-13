// The Few — Code d'activation de l'appareil (format type MAC).
// Généré une seule fois, persistant (identique après réinstallation tant que
// les données de l'app ne sont pas effacées). À donner au revendeur.

const KEY = "thefew.device";
// Alphabet sans caractères ambigus (pas de I/O/1/0 prêtant à confusion visuelle).
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function deviceCode(): string {
  if (typeof window === "undefined") return "";
  let code = window.localStorage.getItem(KEY);
  if (!code) {
    const arr = new Uint8Array(10);
    crypto.getRandomValues(arr);
    const chars = Array.from(arr, (b) => ALPHABET[b % ALPHABET.length]);
    const groups: string[] = ["MK"]; // préfixe identique au panel 7themotion
    for (let i = 0; i < 10; i += 2) groups.push(chars[i] + chars[i + 1]);
    code = groups.join(":");
    window.localStorage.setItem(KEY, code);
  }
  return code;
}
