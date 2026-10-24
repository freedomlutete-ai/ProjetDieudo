/**
 * Validation et nettoyage de toutes les entrées : saisie utilisateur,
 * paramètres d'URL (liens profonds) et réponses réseau.
 * Rien ne doit atteindre la base, l'interface ou une URL sans passer ici.
 */

export const LIMITS = {
  nameMaxLength: 80,
  gramsMin: 1,
  gramsMax: 5000,
  // Une graisse pure contient environ 900 kcal/100 g : au-delà, la donnée est fausse.
  kcalPer100gMax: 900,
  quantityMax: 999,
  shoppingItemsMax: 500,
  entriesPerDayMax: 200,
  foodsMax: 1000,
} as const;

// Caractères de contrôle, séparateurs Unicode invisibles et marques bidirectionnelles
// (utilisées pour maquiller un texte affiché).
const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g;

/** Nettoie un libellé libre ; retourne null s'il est vide après nettoyage. */
export function sanitizeName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.normalize('NFC').replace(UNSAFE_CHARS, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return null;
  return Array.from(cleaned).slice(0, LIMITS.nameMaxLength).join('');
}

/**
 * Lit un nombre saisi (accepte la virgule décimale française).
 * Refuse NaN, Infinity, notation exponentielle et valeurs hors bornes.
 */
export function parseBoundedNumber(input: unknown, min: number, max: number): number | null {
  let value: number;
  if (typeof input === 'number') {
    value = input;
  } else if (typeof input === 'string') {
    const normalized = input.trim().replace(',', '.');
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) return null;
    value = Number(normalized);
  } else {
    return null;
  }
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

/** Vérifie la clé de contrôle GS1 d'un code EAN-8, UPC-A (12), EAN-13 ou GTIN-14. */
export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Normalise un code-barres venant de la caméra, d'une saisie ou d'un lien profond.
 * Ne retourne que des chiffres validés : impossible d'injecter un chemin ou une requête dans l'URL d'API.
 */
export function normalizeBarcode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!/^\d{8,14}$/.test(trimmed)) return null;
  return isValidGtin(trimmed) ? trimmed : null;
}

/** Date locale au format AAAA-MM-JJ, clé des journaux. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidDayKey(input: unknown): input is string {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const [y, m, d] = input.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Calories d'une portion, arrondies à l'unité. */
export function kcalForPortion(kcalPer100g: number, grams: number): number {
  return Math.round((kcalPer100g * grams) / 100);
}
