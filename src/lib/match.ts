import { add, compare, divide, fraction, multiply, subtract, type Fraction } from "./fraction";
import type { Db } from "./recipes";

/**
 * ok: enough at home (or the recipe gives no amount). short: some, but not enough.
 * missing: not at home. check: at home but amounts can't be compared (no amount in the fridge, or
 * different kinds of unit such as g vs ml).
 */
export type Status = "ok" | "short" | "missing" | "check";

export interface Need {
  ingredientId: number;
  name: string;
  status: Status;
  /** What is lacking, in base units: the whole amount when missing, the difference when short. */
  lacking: Fraction | null;
  unit: string | null;
}

export interface RecipeRow {
  recipe_id: string;
  glass_ml: number | null;
  ingredient_id: number | null;
  name: string | null;
  qty_num: number | null;
  qty_den: number | null;
  unit: string | null;
  optional: number | null;
  pantry: number | null;
}

export interface FridgeRow {
  ingredient_id: number;
  qty_num: number | null;
  qty_den: number | null;
  unit: string | null;
}

const qty = (r: { qty_num: number | null; qty_den: number | null }) =>
  r.qty_num !== null && r.qty_den !== null ? fraction(r.qty_num, r.qty_den) : null;

/** Compares one recipe's ingredient rows with the fridge. Optional and pantry ingredients are left out. */
export function matchRecipe(rows: RecipeRow[], fridge: Map<number, FridgeRow>): Need[] {
  const counted = rows.filter((r) => r.ingredient_id !== null && !r.optional && !r.pantry);

  // Cocktail parts become ml only when the glass size is known: 1 part of 4 in 200 ml is 50 ml.
  const glass = rows[0]?.glass_ml ?? null;
  const parts = counted.filter((r) => r.unit === "parte" && qty(r));
  const totalParts = parts.reduce((sum, r) => add(sum, qty(r)!), fraction(0));

  return counted.map((r) => {
    let need = qty(r);
    let unit = r.unit;
    if (unit === "parte") {
      if (glass && need && totalParts.num > 0) {
        need = multiply(divide(need, totalParts), glass);
        unit = "ml";
      } else {
        need = null;
      }
    }
    if (unit === "qb") need = null;

    const base = { ingredientId: r.ingredient_id!, name: r.name ?? "", unit };
    const have = fridge.get(r.ingredient_id!);
    if (!have) return { ...base, status: "missing", lacking: need };
    if (!need) return { ...base, status: "ok", lacking: null };
    const haveQty = qty(have);
    if (!haveQty || have.unit !== unit) return { ...base, status: "check", lacking: null };
    if (compare(haveQty, need) >= 0) return { ...base, status: "ok", lacking: null };
    return { ...base, status: "short", lacking: subtract(need, haveQty) };
  });
}

/** Every recipe's needs against the current fridge; recipes without ingredients map to []. */
export async function matchAll(db: Db): Promise<Map<string, Need[]>> {
  const rows = await db.select<RecipeRow[]>(
    `SELECT r.id AS recipe_id, r.glass_ml, ri.ingredient_id, i.name, ri.qty_num, ri.qty_den, ri.unit, ri.optional, i.pantry
     FROM recipe r
     LEFT JOIN recipe_ingredient ri ON ri.recipe_id = r.id
     LEFT JOIN ingredient i ON i.id = ri.ingredient_id
     ORDER BY r.id, ri.position`,
  );
  const fridgeRows = await db.select<FridgeRow[]>("SELECT ingredient_id, qty_num, qty_den, unit FROM fridge_item");
  const fridge = new Map(fridgeRows.map((f) => [f.ingredient_id, f]));

  const byRecipe = new Map<string, RecipeRow[]>();
  for (const row of rows) byRecipe.set(row.recipe_id, [...(byRecipe.get(row.recipe_id) ?? []), row]);
  return new Map([...byRecipe].map(([id, rs]) => [id, matchRecipe(rs, fridge)]));
}

/** Marks an ingredient as always at home (salt, oil, water): it is never counted as missing. */
export async function setPantry(db: Db, ingredientId: number, pantry: boolean): Promise<void> {
  await db.execute("UPDATE ingredient SET pantry = ? WHERE id = ?", [pantry ? 1 : 0, ingredientId]);
}
