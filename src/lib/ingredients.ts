import { add, divide, fraction, multiply, type Fraction } from "./fraction";
import type { Db } from "./recipes";
import { formatQuantity, isUnit, readableUnit, toReadable, UNITS, unitLabel, type Unit } from "./units";

/** One ingredient line as the user sees it: quantity in the unit they chose. */
export interface IngredientLine {
  name: string;
  qty: Fraction | null;
  unit: Unit | null;
  note: string;
  optional: boolean;
}

interface Row {
  name: string;
  qty_num: number | null;
  qty_den: number | null;
  unit: string | null;
  display_unit: string | null;
  note: string | null;
  optional: number;
}

/** Converts a line to what is stored: quantity in base unit, unit remembered in display_unit when it has to be. */
export function toStored(line: IngredientLine) {
  const unit: Unit | null = line.unit ?? (line.qty ? "pz" : null);
  if (!unit || unit === "qb" || !line.qty) {
    return { qty: null, unit: unit === "qb" ? "qb" : unit && UNITS[unit].base, displayUnit: null };
  }
  const info = UNITS[unit];
  return {
    qty: multiply(line.qty, info.factor),
    unit: info.base,
    displayUnit: "remember" in info ? unit : null,
  };
}

function fromRow(row: Row): IngredientLine {
  const base = isUnit(row.unit) ? row.unit : null;
  const stored = row.qty_num !== null && row.qty_den !== null ? fraction(row.qty_num, row.qty_den) : null;
  const unit = isUnit(row.display_unit) ? row.display_unit : base && stored ? readableUnit(stored, base) : base;
  const qty = stored && unit ? multiply(stored, 1, UNITS[unit].factor) : null;
  return { name: row.name, qty, unit, note: row.note ?? "", optional: row.optional === 1 };
}

export async function getIngredients(db: Db, recipeId: string): Promise<IngredientLine[]> {
  const rows = await db.select<Row[]>(
    `SELECT i.name, ri.qty_num, ri.qty_den, ri.unit, ri.display_unit, ri.note, ri.optional
     FROM recipe_ingredient ri JOIN ingredient i ON i.id = ri.ingredient_id
     WHERE ri.recipe_id = ? ORDER BY ri.position`,
    [recipeId],
  );
  return rows.map(fromRow);
}

export async function listIngredientNames(db: Db): Promise<string[]> {
  const rows = await db.select<{ name: string }[]>("SELECT name FROM ingredient ORDER BY name COLLATE NOCASE");
  return rows.map((r) => r.name);
}

/** Id of the ingredient with this name (case-insensitive), created if missing. */
export async function ensureIngredient(db: Db, name: string): Promise<number> {
  await db.execute("INSERT INTO ingredient (name) VALUES (?) ON CONFLICT (name) DO NOTHING", [name]);
  const [row] = await db.select<{ id: number }[]>("SELECT id FROM ingredient WHERE name = ?", [name]);
  return row.id;
}

/** Replaces all ingredient lines of a recipe; blank names are skipped. */
export async function saveIngredients(db: Db, recipeId: string, lines: IngredientLine[]): Promise<void> {
  const kept = lines.map((l) => ({ ...l, name: l.name.trim(), note: l.note.trim() })).filter((l) => l.name);

  const ids = new Map<string, number>();
  for (const name of new Set(kept.map((l) => l.name))) ids.set(name, await ensureIngredient(db, name));

  // The SQL plugin pools connections, so BEGIN/COMMIT across calls is unreliable. Instead the new
  // lines go in with one multi-row INSERT, then only rows older than that are deleted: an
  // interruption in between leaves duplicates, never a recipe without ingredients.
  const [{ maxRowid }] = await db.select<{ maxRowid: number | null }[]>(
    "SELECT MAX(rowid) AS maxRowid FROM recipe_ingredient WHERE recipe_id = ?",
    [recipeId],
  );
  if (kept.length > 0) {
    const values = kept.flatMap((l, position) => {
      const s = toStored(l);
      return [recipeId, ids.get(l.name), s.qty?.num ?? null, s.qty?.den ?? null, s.unit, s.displayUnit, l.note || null, l.optional ? 1 : 0, position];
    });
    await db.execute(
      `INSERT INTO recipe_ingredient (recipe_id, ingredient_id, qty_num, qty_den, unit, display_unit, note, optional, position)
       VALUES ${kept.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}`,
      values,
    );
  }
  if (maxRowid !== null) {
    await db.execute("DELETE FROM recipe_ingredient WHERE recipe_id = ? AND rowid <= ?", [recipeId, maxRowid]);
  }
}

/** "30 g zucchero", "2 cucchiai olio", "2 uova", "sale q.b." */
export function formatLine(line: IngredientLine): string {
  if (line.unit === "qb") return `${line.name} q.b.`;
  if (!line.qty) return line.name;
  const plural = line.qty.num > line.qty.den;
  const unit = line.unit ? unitLabel(line.unit, plural) : "";
  return [formatQuantity(line.qty, line.unit), unit, line.name].filter(Boolean).join(" ");
}

/** Multiplies a line's quantity (e.g. for more servings), re-picking the readable unit: 800 g × 2 reads 1,6 kg. */
export function scaleLine(line: IngredientLine, factor: Fraction): IngredientLine {
  if (!line.qty || !line.unit) return line.qty ? { ...line, qty: multiply(line.qty, factor.num, factor.den) } : line;
  const info = UNITS[line.unit];
  const scaled = multiply(line.qty, factor.num, factor.den);
  if ("remember" in info || info.base === "parte" || info.base === "pz") return { ...line, qty: scaled };
  return { ...line, ...toReadable(multiply(scaled, info.factor), info.base) };
}

/**
 * For cocktails: the ml of each line given in parts, for a glass of glassMl. 1/4 + 3/4 parts in a
 * 200 ml glass give 50 ml and 150 ml; parts as counts (1 + 3) give the same. Other lines get null.
 */
export function partsToMl(lines: IngredientLine[], glassMl: Fraction): (Fraction | null)[] {
  const total = lines.reduce((sum, l) => (l.unit === "parte" && l.qty ? add(sum, l.qty) : sum), fraction(0));
  return lines.map((l) =>
    l.unit === "parte" && l.qty && total.num > 0 ? multiply(divide(l.qty, total), glassMl.num, glassMl.den) : null,
  );
}
