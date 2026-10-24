import { escapeCsvCell, toCsv } from '../src/lib/csv';

describe('export CSV', () => {
  it.each(['=HYPERLINK("http://evil","clic")', '+1+1', '-2+3', '@SUM(A1)', '\tx', '\r=1'])(
    'neutralise la formule %p',
    (payload) => {
      const cell = escapeCsvCell(payload);
      const unquoted = cell.startsWith('"') ? cell.slice(1) : cell;
      expect(unquoted.startsWith("'")).toBe(true);
    },
  );

  it('échappe guillemets, virgules et retours à la ligne', () => {
    expect(escapeCsvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(escapeCsvCell('ligne1\nligne2')).toBe('"ligne1\nligne2"');
  });

  it('laisse les nombres intacts, même négatifs', () => {
    expect(escapeCsvCell(-5)).toBe('-5');
    expect(escapeCsvCell(12.5)).toBe('12.5');
  });

  it('construit un fichier complet', () => {
    expect(toCsv(['a', 'b'], [['=1', 2]])).toBe("a,b\r\n'=1,2");
  });
});
