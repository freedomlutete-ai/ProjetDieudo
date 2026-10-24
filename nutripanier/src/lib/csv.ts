/**
 * Export CSV du journal.
 * Protège contre l'injection de formules (CSV injection) : un libellé comme
 * `=HYPERLINK(...)` serait exécuté par un tableur à l'ouverture du fichier.
 */

const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && FORMULA_TRIGGERS.test(text)) {
    text = `'${text}`;
  }
  if (/[",;\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}
