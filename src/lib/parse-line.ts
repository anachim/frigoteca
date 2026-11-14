import { parseQuantity } from "./fraction";
import type { IngredientLine } from "./ingredients";
import type { Unit } from "./units";

const ALIASES: Record<string, Unit> = {
  g: "g", gr: "g", grammo: "g", grammi: "g",
  kg: "kg", chilo: "kg", chili: "kg",
  ml: "ml", millilitro: "ml", millilitri: "ml",
  cl: "cl", centilitro: "cl", centilitri: "cl",
  l: "l", litro: "l", litri: "l",
  cucchiaio: "cucchiaio", cucchiai: "cucchiaio",
  cucchiaino: "cucchiaino", cucchiaini: "cucchiaino",
  tazza: "tazza", tazze: "tazza",
  pz: "pz", pezzo: "pz", pezzi: "pz",
  parte: "parte", parti: "parte",
};

const QB = /(^|\s)q\.?\s?b\.?$/i;
const QTY = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*/;

/**
 * Reads one typed line: "30 g zucchero", "1/4 parte malibu", "1 limone", "sale qb",
 * "100ml di latte", "pomodori, a fette". Returns null when no ingredient name is left,
 * or for section headings such as "Per la crema:".
 */
export function parseLine(text: string): IngredientLine | null {
  let rest = text.trim().replace(/^[-•*]\s*/, "");
  if (rest.endsWith(":")) return null;
  let note = "";

  const comma = rest.search(/(?<!\d),|,(?!\d)/);
  if (comma >= 0) {
    note = rest.slice(comma + 1).trim();
    rest = rest.slice(0, comma).trim();
  }
  const paren = rest.match(/\s*\(([^)]*)\)$/);
  if (paren) {
    note = [paren[1].trim(), note].filter(Boolean).join(", ");
    rest = rest.slice(0, paren.index).trim();
  }

  if (QB.test(rest)) {
    const name = rest.replace(QB, "").trim();
    return name ? { name, qty: null, unit: "qb", note, optional: false } : null;
  }

  let qty = null;
  let unit: Unit | null = null;
  const q = rest.match(QTY);
  if (q) {
    qty = parseQuantity(q[1]);
    rest = rest.slice(q[0].length);
    const word = rest.match(/^(\p{L}+)\.?(\s+|$)/u);
    const alias = word && ALIASES[word[1].toLowerCase()];
    if (alias) {
      unit = alias;
      rest = rest.slice(word[0].length);
    }
  }

  const name = rest.replace(/^(di|d')\s*/i, "").trim();
  return name ? { name, qty, unit, note, optional: false } : null;
}

/** One ingredient per non-empty line, e.g. a list pasted from a website or a chat. */
export const parseLines = (text: string): IngredientLine[] =>
  text.split(/\r?\n/).flatMap((l) => parseLine(l) ?? []);
