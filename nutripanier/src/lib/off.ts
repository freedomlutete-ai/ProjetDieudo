/**
 * Client Open Food Facts (API v3, lecture seule, sans compte).
 * Doc : https://openfoodfacts.github.io/openfoodfacts-server/api/
 * - User-Agent personnalisé demandé (AppName/Version (contact)).
 * - Limite : 15 lectures de produit par minute et par utilisateur.
 * - Données fournies sans garantie d'exactitude : l'interface le signale.
 */

import { LIMITS, normalizeBarcode, sanitizeName } from './validation';

export const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v3/product/';
export const OFF_FIELDS = 'product_name,brands,nutriments';
export const OFF_TIMEOUT_MS = 8000;
export const OFF_MAX_REQUESTS_PER_MINUTE = 15;
// Une réponse produit filtrée fait quelques Ko : au-delà, on refuse de la lire.
export const OFF_MAX_RESPONSE_BYTES = 200_000;

export interface OffProduct {
  barcode: string;
  name: string;
  brand: string | null;
  kcalPer100g: number;
}

export type OffResult =
  | { kind: 'found'; product: OffProduct }
  | { kind: 'not_found' }
  | { kind: 'no_calories' }
  | { kind: 'invalid_barcode' }
  | { kind: 'rate_limited' }
  | { kind: 'network_error' };

export function buildProductUrl(barcode: string): string | null {
  const safe = normalizeBarcode(barcode);
  if (!safe) return null;
  return `${OFF_BASE_URL}${safe}?fields=${OFF_FIELDS}`;
}

/** Extrait un produit d'une réponse JSON non fiable. Ne fait confiance à aucun champ. */
export function parseOffResponse(barcode: string, json: unknown): OffResult {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return { kind: 'network_error' };
  }
  const body = json as Record<string, unknown>;
  const product = body.product;
  if (typeof product !== 'object' || product === null) return { kind: 'not_found' };
  const p = product as Record<string, unknown>;

  const nutriments = (typeof p.nutriments === 'object' && p.nutriments) || {};
  const rawKcal = (nutriments as Record<string, unknown>)['energy-kcal_100g'];
  const kcal = typeof rawKcal === 'number' ? rawKcal : Number.NaN;
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > LIMITS.kcalPer100gMax) {
    return { kind: 'no_calories' };
  }

  const name = sanitizeName(p.product_name) ?? barcode;
  const brand = sanitizeName(p.brands);
  return {
    kind: 'found',
    product: { barcode, name, brand, kcalPer100g: Math.round(kcal * 10) / 10 },
  };
}

/** Limiteur glissant sur 60 s, pour rester sous la limite d'Open Food Facts. */
export class RateLimiter {
  private stamps: number[] = [];
  constructor(
    private readonly max: number,
    private readonly windowMs = 60_000,
  ) {}

  tryAcquire(now = Date.now()): boolean {
    this.stamps = this.stamps.filter((t) => now - t < this.windowMs);
    if (this.stamps.length >= this.max) return false;
    this.stamps.push(now);
    return true;
  }
}

const limiter = new RateLimiter(OFF_MAX_REQUESTS_PER_MINUTE);

export interface FetchDeps {
  fetchImpl?: typeof fetch;
  limiter?: RateLimiter;
  userAgent: string;
}

export async function fetchProduct(barcode: string, deps: FetchDeps): Promise<OffResult> {
  const url = buildProductUrl(barcode);
  if (!url) return { kind: 'invalid_barcode' };
  if (!(deps.limiter ?? limiter).tryAcquire()) return { kind: 'rate_limited' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OFF_TIMEOUT_MS);
  try {
    const response = await (deps.fetchImpl ?? fetch)(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': deps.userAgent },
      signal: controller.signal,
      credentials: 'omit',
      redirect: 'error',
    });
    if (response.status === 404) return { kind: 'not_found' };
    if (response.status === 429 || response.status === 503) return { kind: 'rate_limited' };
    if (!response.ok) return { kind: 'network_error' };

    const text = await response.text();
    if (text.length > OFF_MAX_RESPONSE_BYTES) return { kind: 'network_error' };
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { kind: 'network_error' };
    }
    return parseOffResponse(normalizeBarcode(barcode)!, json);
  } catch {
    return { kind: 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}
