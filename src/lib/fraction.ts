export interface Fraction {
  num: number;
  den: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export function fraction(num: number, den = 1): Fraction {
  const d = gcd(num, den) || 1;
  return { num: num / d, den: den / d };
}

export const multiply = (f: Fraction, n: number, d = 1): Fraction => fraction(f.num * n, f.den * d);

/** Parses "2", "1/4", "1 1/2", "1,5" or "0.25" into a positive fraction; returns null when blank or invalid. */
export function parseQuantity(text: string): Fraction | null {
  const s = text.trim().replace(",", ".");
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return positive(fraction(+m[1] * +m[3] + +m[2], +m[3]));
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return positive(fraction(+m[1], +m[2]));
  m = s.match(/^(\d+)(?:\.(\d+))?$/);
  if (m) {
    const decimals = m[2] ?? "";
    return positive(fraction(+(m[1] + decimals), 10 ** decimals.length));
  }
  return null;
}

const positive = (f: Fraction) => (f.den > 0 && f.num > 0 ? f : null);

/** "2", "1/4", "1 1/2". */
export function formatFraction({ num, den }: Fraction): string {
  if (den === 1) return String(num);
  const whole = Math.floor(num / den);
  const rest = `${num % den}/${den}`;
  return whole > 0 ? `${whole} ${rest}` : rest;
}

export const add = (a: Fraction, b: Fraction): Fraction => fraction(a.num * b.den + b.num * a.den, a.den * b.den);
export const subtract = (a: Fraction, b: Fraction): Fraction => fraction(a.num * b.den - b.num * a.den, a.den * b.den);
export const divide = (a: Fraction, b: Fraction): Fraction => fraction(a.num * b.den, a.den * b.num);
/** Negative when a < b, zero when equal, positive when a > b. */
export const compare = (a: Fraction, b: Fraction): number => a.num * b.den - b.num * a.den;
