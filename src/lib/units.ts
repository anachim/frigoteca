import { formatFraction, fraction, type Fraction } from "./fraction";

export type BaseUnit = "g" | "ml" | "pz" | "parte" | "qb";

interface UnitInfo {
  base: BaseUnit;
  factor: number;
  /** Units remembered in display_unit so the recipe keeps saying "2 cucchiai" or "4 cl". */
  remember?: boolean;
  singular: string;
  plural: string;
}

export const UNITS = {
  g: { base: "g", factor: 1, singular: "g", plural: "g" },
  kg: { base: "g", factor: 1000, singular: "kg", plural: "kg" },
  ml: { base: "ml", factor: 1, singular: "ml", plural: "ml" },
  cl: { base: "ml", factor: 10, remember: true, singular: "cl", plural: "cl" },
  l: { base: "ml", factor: 1000, singular: "l", plural: "l" },
  cucchiaio: { base: "ml", factor: 15, remember: true, singular: "cucchiaio", plural: "cucchiai" },
  cucchiaino: { base: "ml", factor: 5, remember: true, singular: "cucchiaino", plural: "cucchiaini" },
  tazza: { base: "ml", factor: 240, remember: true, singular: "tazza", plural: "tazze" },
  pz: { base: "pz", factor: 1, singular: "", plural: "" },
  parte: { base: "parte", factor: 1, singular: "parte", plural: "parti" },
  qb: { base: "qb", factor: 1, singular: "q.b.", plural: "q.b." },
} satisfies Record<string, UnitInfo>;

export type Unit = keyof typeof UNITS;

export const isUnit = (u: string | null): u is Unit => u !== null && u in UNITS;

export function unitLabel(unit: Unit, plural: boolean): string {
  const info: UnitInfo = UNITS[unit];
  return plural ? info.plural : info.singular;
}

/** Picks the unit that reads best for a quantity stored in a base unit: 1500 g reads as kg. */
export function readableUnit(qty: Fraction, base: Unit): Unit {
  const big = qty.num >= 1000 * qty.den;
  if (base === "g" && big) return "kg";
  if (base === "ml" && big) return "l";
  return base;
}

const METRIC_DIGITS: Partial<Record<Unit, number>> = { g: 1, ml: 1, kg: 2, cl: 2, l: 2 };
const COMMON_DENOMINATORS = [1, 2, 3, 4, 8];

/** Metric units read as decimals ("1,5 kg"), others as common fractions ("1/2 cucchiaio"), the rest rounded. */
export function formatQuantity(qty: Fraction, unit: Unit | null): string {
  const digits = unit ? METRIC_DIGITS[unit] : undefined;
  if (digits === undefined && COMMON_DENOMINATORS.includes(qty.den)) return formatFraction(qty);
  return (qty.num / qty.den).toLocaleString("it-IT", { maximumFractionDigits: digits ?? 2, useGrouping: false });
}

/** A quantity stored in a base unit, converted to the unit that reads best. */
export function toReadable(qty: Fraction, base: Unit): { qty: Fraction; unit: Unit } {
  const unit = readableUnit(qty, base);
  const f = UNITS[unit].factor;
  return { qty: fraction(qty.num, qty.den * f), unit };
}
