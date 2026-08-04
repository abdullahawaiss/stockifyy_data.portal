const FORMULA_CHARS = /^[=+\-@\t\r]/;

export function sanitizeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (FORMULA_CHARS.test(str)) {
    return `'${str}`;
  }
  return str;
}
