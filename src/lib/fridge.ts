import { fraction, multiply } from "./fraction";
import { ensureIngredient, toStored, type IngredientLine } from "./ingredients";
import type { Db } from "./recipes";
import { isUnit, readableUnit, UNITS, type Unit } from "./units";

export interface FridgeItem {
  ingredientId: number;
  /** Quantity and unit as the user reads them (500 g, 1,5 kg); null qty means "I have some". */
  line: IngredientLine;
}

export interface IngredientUse {
  id: number;
  name: string;
  uses: number;
}

interface Row {
  ingredient_id: number;
  name: string;
  qty_num: number | null;
  qty_den: number | null;
  unit: string | null;
}

function toItem(row: Row): FridgeItem {
  const base = isUnit(row.unit) ? row.unit : null;
  const stored = row.qty_num !== null && row.qty_den !== null ? fraction(row.qty_num, row.qty_den) : null;
  const unit: Unit | null = base && stored ? readableUnit(stored, base) : null;
  const qty = stored && unit ? multiply(stored, 1, UNITS[unit].factor) : null;
  return { ingredientId: row.ingredient_id, line: { name: row.name, qty, unit, note: "", optional: false } };
}

export async function listFridge(db: Db): Promise<FridgeItem[]> {
  const rows = await db.select<Row[]>(
    `SELECT f.ingredient_id, i.name, f.qty_num, f.qty_den, f.unit
     FROM fridge_item f JOIN ingredient i ON i.id = f.ingredient_id ORDER BY i.name COLLATE NOCASE`,
  );
  return rows.map(toItem);
}

/** All known ingredients, the ones used by more recipes first. */
export const ingredientsByUse = (db: Db) =>
  db.select<IngredientUse[]>(
    `SELECT i.id, i.name, COUNT(DISTINCT ri.recipe_id) AS uses
     FROM ingredient i LEFT JOIN recipe_ingredient ri ON ri.ingredient_id = i.id
     GROUP BY i.id ORDER BY uses DESC, i.name COLLATE NOCASE`,
  );

/**
 * Puts an ingredient in the fridge, replacing what was there. Quantities are stored in base units;
 * proportions (parte) and q.b. carry no amount, so they just mean "I have some".
 */
export async function putInFridge(db: Db, line: IngredientLine): Promise<void> {
  const name = line.name.trim();
  if (!name) return;
  const id = await ensureIngredient(db, name);
  const s = toStored(line);
  const measurable = s.qty && (s.unit === "g" || s.unit === "ml" || s.unit === "pz");
  await db.execute(
    `INSERT INTO fridge_item (ingredient_id, qty_num, qty_den, unit) VALUES (?, ?, ?, ?)
     ON CONFLICT (ingredient_id) DO UPDATE SET qty_num = excluded.qty_num, qty_den = excluded.qty_den, unit = excluded.unit`,
    measurable ? [id, s.qty!.num, s.qty!.den, s.unit] : [id, null, null, null],
  );
}

export const removeFromFridge = (db: Db, ingredientId: number) =>
  db.execute("DELETE FROM fridge_item WHERE ingredient_id = ?", [ingredientId]);
