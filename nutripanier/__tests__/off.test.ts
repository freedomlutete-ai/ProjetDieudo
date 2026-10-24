import fixture from './fixtures/off-nutella-v3.json';
import {
  OFF_BASE_URL,
  OFF_MAX_RESPONSE_BYTES,
  RateLimiter,
  buildProductUrl,
  fetchProduct,
  parseOffResponse,
} from '../src/lib/off';

const NUTELLA = '3017624010701';
const UA = 'NutriPanier/1.0.0 (test@example.com)';

function fakeFetch(status: number, body: string) {
  return jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  })) as unknown as typeof fetch;
}

const freshLimiter = () => new RateLimiter(100);

describe('buildProductUrl', () => {
  it('construit une URL fixe vers l’API v3', () => {
    expect(buildProductUrl(NUTELLA)).toBe(`${OFF_BASE_URL}${NUTELLA}?fields=product_name,brands,nutriments`);
  });

  it('refuse toute tentative de modifier l’URL', () => {
    expect(buildProductUrl('../../cgi/search.pl')).toBeNull();
    expect(buildProductUrl(`${NUTELLA}&fields=*`)).toBeNull();
    expect(buildProductUrl('https://evil.example')).toBeNull();
  });
});

describe('parseOffResponse', () => {
  it('lit une vraie réponse de l’API v3', () => {
    expect(parseOffResponse(NUTELLA, fixture)).toEqual({
      kind: 'found',
      product: { barcode: NUTELLA, name: 'Nutella', brand: 'Ferrero', kcalPer100g: 539 },
    });
  });

  it.each([
    ['null', null],
    ['texte', 'oops'],
    ['tableau', []],
  ])('réponse non-objet (%s) = erreur réseau', (_label, body) => {
    expect(parseOffResponse(NUTELLA, body).kind).toBe('network_error');
  });

  it('produit absent = introuvable', () => {
    expect(parseOffResponse(NUTELLA, { status: 'failure', product: null }).kind).toBe('not_found');
  });

  it.each([
    ['kcal négatives', -10],
    ['kcal impossibles', 5000],
    ['kcal en texte', '539'],
    ['kcal infinies', Number.POSITIVE_INFINITY],
    ['kcal absentes', undefined],
  ])('rejette des calories piégées (%s)', (_label, value) => {
    const body = { product: { product_name: 'X', nutriments: { 'energy-kcal_100g': value } } };
    expect(parseOffResponse(NUTELLA, body).kind).toBe('no_calories');
  });

  it('nettoie un nom hostile et retombe sur le code-barres si vide', () => {
    const hostile = {
      product: {
        product_name: `<img src=x onerror=alert(1)>${String.fromCharCode(0x202e)}${'A'.repeat(500)}`,
        brands: { $gt: '' },
        nutriments: { 'energy-kcal_100g': 100 },
      },
    };
    const result = parseOffResponse(NUTELLA, hostile);
    expect(result.kind).toBe('found');
    if (result.kind !== 'found') return;
    expect(result.product.name.length).toBeLessThanOrEqual(80);
    expect(result.product.name).not.toContain(String.fromCharCode(0x202e));
    expect(result.product.brand).toBeNull();

    const nameless = parseOffResponse(NUTELLA, { product: { nutriments: { 'energy-kcal_100g': 1 } } });
    expect(nameless.kind === 'found' && nameless.product.name).toBe(NUTELLA);
  });

  it('ignore la pollution de prototype', () => {
    const body = JSON.parse(
      '{"product":{"__proto__":{"polluted":true},"product_name":"P","nutriments":{"energy-kcal_100g":10}}}',
    );
    parseOffResponse(NUTELLA, body);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('fetchProduct', () => {
  it('envoie un User-Agent, sans cookies ni redirection', async () => {
    const f = fakeFetch(200, JSON.stringify(fixture));
    const result = await fetchProduct(NUTELLA, { fetchImpl: f, limiter: freshLimiter(), userAgent: UA });
    expect(result.kind).toBe('found');
    const [url, init] = (f as jest.Mock).mock.calls[0];
    expect(url).toBe(buildProductUrl(NUTELLA));
    expect(init.headers['User-Agent']).toBe(UA);
    expect(init.credentials).toBe('omit');
    expect(init.redirect).toBe('error');
    expect(init.signal).toBeDefined();
  });

  it('n’appelle pas le réseau pour un code invalide', async () => {
    const f = fakeFetch(200, '{}');
    const result = await fetchProduct('abc', { fetchImpl: f, limiter: freshLimiter(), userAgent: UA });
    expect(result.kind).toBe('invalid_barcode');
    expect(f).not.toHaveBeenCalled();
  });

  it.each([
    [404, 'not_found'],
    [429, 'rate_limited'],
    [503, 'rate_limited'],
    [500, 'network_error'],
  ])('HTTP %i = %s', async (status, kind) => {
    const result = await fetchProduct(NUTELLA, {
      fetchImpl: fakeFetch(status, ''),
      limiter: freshLimiter(),
      userAgent: UA,
    });
    expect(result.kind).toBe(kind);
  });

  it('refuse un JSON invalide ou une réponse géante', async () => {
    const bad = await fetchProduct(NUTELLA, { fetchImpl: fakeFetch(200, '{nope'), limiter: freshLimiter(), userAgent: UA });
    expect(bad.kind).toBe('network_error');
    const huge = await fetchProduct(NUTELLA, {
      fetchImpl: fakeFetch(200, `{"x":"${'a'.repeat(OFF_MAX_RESPONSE_BYTES)}"}`),
      limiter: freshLimiter(),
      userAgent: UA,
    });
    expect(huge.kind).toBe('network_error');
  });

  it('transforme une exception réseau en erreur propre', async () => {
    const throwing = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const result = await fetchProduct(NUTELLA, { fetchImpl: throwing, limiter: freshLimiter(), userAgent: UA });
    expect(result.kind).toBe('network_error');
  });

  it('respecte la limite de 15 requêtes par minute', async () => {
    const limiter = new RateLimiter(15);
    const f = fakeFetch(200, JSON.stringify(fixture));
    const kinds = [];
    for (let i = 0; i < 16; i++) {
      kinds.push((await fetchProduct(NUTELLA, { fetchImpl: f, limiter, userAgent: UA })).kind);
    }
    expect(kinds.filter((k) => k === 'found')).toHaveLength(15);
    expect(kinds[15]).toBe('rate_limited');
    expect(f).toHaveBeenCalledTimes(15);
  });

  it('libère la limite après 60 s', () => {
    const limiter = new RateLimiter(1);
    expect(limiter.tryAcquire(0)).toBe(true);
    expect(limiter.tryAcquire(59_999)).toBe(false);
    expect(limiter.tryAcquire(60_000)).toBe(true);
  });
});
