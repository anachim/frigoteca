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
