import {
  LIMITS,
  isValidDayKey,
  isValidGtin,
  kcalForPortion,
  normalizeBarcode,
  parseBoundedNumber,
  sanitizeName,
  toDayKey,
} from '../src/lib/validation';

// Caractères construits par code : aucun caractère invisible littéral dans ce fichier.
const ch = (code: number) => String.fromCharCode(code);

describe('sanitizeName', () => {
  it('garde un nom normal et réduit les espaces', () => {
    expect(sanitizeName('  Pomme   Golden ')).toBe('Pomme Golden');
  });

  it('refuse les valeurs vides ou non textuelles', () => {
    for (const v of ['', '   ', null, undefined, 42, {}, [], ch(0x200b)]) {
      expect(sanitizeName(v)).toBeNull();
    }
  });

  it('retire caractères de contrôle, zéro-largeur et marques bidirectionnelles', () => {
    const hostile = `Pain${ch(0)}${ch(7)}${ch(0x200b)}${ch(0x202e)}${ch(0x2066)}${ch(0xfeff)} complet`;
    expect(sanitizeName(hostile)).toBe('Pain complet');
  });

  it('tronque à la longueur maximale sans couper un emoji', () => {
    const long = '🍎'.repeat(200);
    const out = sanitizeName(long)!;
    expect(Array.from(out)).toHaveLength(LIMITS.nameMaxLength);
    expect(out.endsWith('🍎')).toBe(true);
  });

  it('laisse le HTML/SQL comme simple texte (affiché sans interprétation, requêtes paramétrées)', () => {
    expect(sanitizeName("<script>alert(1)</script>'; DROP TABLE entries;--")).toBe(
      "<script>alert(1)</script>'; DROP TABLE entries;--",
    );
  });
});

describe('parseBoundedNumber', () => {
  it('accepte la virgule française et les bornes incluses', () => {
    expect(parseBoundedNumber('12,5', 0, 900)).toBe(12.5);
    expect(parseBoundedNumber('0', 0, 900)).toBe(0);
    expect(parseBoundedNumber('900', 0, 900)).toBe(900);
  });

  it.each(['', ' ', 'abc', '1e3', '-5', '+5', 'NaN', 'Infinity', '0x10', '1.234', '12..5', '1 000', '9999999'])(
    'refuse %p',
    (input) => {
      expect(parseBoundedNumber(input, 0, 1_000_000)).toBeNull();
    },
  );

  it('refuse hors bornes et nombres non finis', () => {
    expect(parseBoundedNumber('901', 0, 900)).toBeNull();
    expect(parseBoundedNumber(Number.NaN, 0, 900)).toBeNull();
    expect(parseBoundedNumber(Number.POSITIVE_INFINITY, 0, 900)).toBeNull();
    expect(parseBoundedNumber({}, 0, 900)).toBeNull();
  });
});

describe('codes-barres', () => {
  it('valide des codes réels', () => {
    expect(isValidGtin('3017624010701')).toBe(true); // EAN-13
    expect(isValidGtin('96385074')).toBe(true); // EAN-8
    expect(isValidGtin('036000291452')).toBe(true); // UPC-A
  });

  it('refuse une mauvaise clé de contrôle', () => {
    expect(isValidGtin('3017624010702')).toBe(false);
  });

  it.each([
    '../../admin',
    '3017624010701?fields=*',
    '3017624010701/../..',
    '3017624010701%2F..',
    '3017624010701#x',
    ' 3017624010701x',
    '１２３４５６７８',
    '12345',
    '1'.repeat(15),
    '',
  ])('normalizeBarcode refuse %p (injection de chemin ou de requête)', (input) => {
    expect(normalizeBarcode(input)).toBeNull();
  });

  it('accepte les espaces autour et refuse les types non textuels', () => {
    expect(normalizeBarcode(' 3017624010701 ')).toBe('3017624010701');
    expect(normalizeBarcode(3017624010701)).toBeNull();
    expect(normalizeBarcode(['3017624010701'])).toBeNull();
  });
});

describe('dates et portions', () => {
  it('produit une clé de jour locale', () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('refuse les dates impossibles ou mal formées', () => {
    expect(isValidDayKey('2026-02-30')).toBe(false);
    expect(isValidDayKey("2026-01-01' OR 1=1")).toBe(false);
    expect(isValidDayKey('2026-1-1')).toBe(false);
    expect(isValidDayKey('2028-02-29')).toBe(true);
  });

  it('calcule les kcal d’une portion', () => {
    expect(kcalForPortion(539, 15)).toBe(81); // 80,85 arrondi
    expect(kcalForPortion(52, 150)).toBe(78);
  });
});
