export type BaseUnit = "g" | "ml" | "pz" | "parte" | "qb";

interface UnitInfo {
  base: BaseUnit;
  factor: number;
  /** Kitchen units are remembered in display_unit so the recipe keeps saying "2 cucchiai". */
  kitchen?: boolean;
  singular: string;
  plural: string;
}

export const UNITS = {
  g: { base: "g", factor: 1, singular: "g", plural: "g" },
  kg: { base: "g", factor: 1000, singular: "kg", plural: "kg" },
  ml: { base: "ml", factor: 1, singular: "ml", plural: "ml" },
  l: { base: "ml", factor: 1000, singular: "l", plural: "l" },
  cucchiaio: { base: "ml", factor: 15, kitchen: true, singular: "cucchiaio", plural: "cucchiai" },
  cucchiaino: { base: "ml", factor: 5, kitchen: true, singular: "cucchiaino", plural: "cucchiaini" },
  tazza: { base: "ml", factor: 240, kitchen: true, singular: "tazza", plural: "tazze" },
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
