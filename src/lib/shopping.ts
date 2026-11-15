import { add, fraction, type Fraction } from "./fraction";
import { ensureIngredient, toStored, type IngredientLine } from "./ingredients";
import type { Need } from "./match";
import type { Db } from "./recipes";
import { isUnit, toReadable } from "./units";

export interface ShoppingItem {
  id: number;
  ingredientId: number | null;
  /** Quantity as the user reads it (1,5 kg); null qty when no amount is known. */
  line: IngredientLine;
  done: boolean;
}

interface Row {
  id: number;
  ingredient_id: number | null;
  text: string;
  qty_num: number | null;
  qty_den: number | null;
  unit: string | null;
  done: number;
}

const MEASURABLE = new Set(["g", "ml", "pz"]);
const qtyOf = (r: { qty_num: number | null; qty_den: number | null }) =>
  r.qty_num !== null && r.qty_den !== null ? fraction(r.qty_num, r.qty_den) : null;

function toItem(row: Row): ShoppingItem {
  const stored = qtyOf(row);
  const readable = stored && isUnit(row.unit) ? toReadable(stored, row.unit) : null;
  return {
    id: row.id,
    ingredientId: row.ingredient_id,
    line: { name: row.text, qty: readable?.qty ?? null, unit: readable?.unit ?? null, note: "", optional: false },
    done: row.done === 1,
  };
}

export async function listShopping(db: Db): Promise<ShoppingItem[]> {
  const rows = await db.select<Row[]>("SELECT * FROM shopping_item ORDER BY done, text COLLATE NOCASE");
  return rows.map(toItem);
}

/**
 * Adds an amount in base units (g, ml, pz) or just a name. Known ingredients are linked so bought items
 * can go to the fridge; other text ("carta da forno") stays free text. Adding something already on the
 * list sums the amounts when they are comparable.
 */
export async function addToShopping(db: Db, name: string, qty: Fraction | null, unit: string | null): Promise<void> {
  const text = name.trim();
  if (!text) return;
  const amount = qty && unit && MEASURABLE.has(unit) ? { qty, unit } : null;
  const [ing] = await db.select<{ id: number; name: string }[]>("SELECT id, name FROM ingredient WHERE name = ?", [text]);
  const [existing] = await db.select<Row[]>(
    ing
      ? "SELECT * FROM shopping_item WHERE ingredient_id = ? AND done = 0"
      : "SELECT * FROM shopping_item WHERE ingredient_id IS NULL AND text = ? COLLATE NOCASE AND done = 0",
    [ing ? ing.id : text],
  );

  if (!existing) {
    await db.execute(
      "INSERT INTO shopping_item (ingredient_id, text, qty_num, qty_den, unit) VALUES (?, ?, ?, ?, ?)",
      [ing?.id ?? null, ing?.name ?? text, amount?.qty.num ?? null, amount?.qty.den ?? null, amount?.unit ?? null],
    );
    return;
  }
  const had = qtyOf(existing);
  const merged = amount && had && existing.unit === amount.unit ? { qty: add(had, amount.qty), unit: amount.unit } : amount;
  if (!merged) return;
  await db.execute("UPDATE shopping_item SET qty_num = ?, qty_den = ?, unit = ? WHERE id = ?", [
    merged.qty.num,
    merged.qty.den,
    merged.unit,
    existing.id,
  ]);
}

/** A typed line such as "2 kg patate" or "carta da forno". */
export async function addLine(db: Db, line: IngredientLine): Promise<void> {
  const s = toStored(line);
  await addToShopping(db, line.name, s.qty, s.unit);
}

/** What a fridge result is lacking: the missing amount when known, otherwise just the name. */
export async function addLacking(db: Db, needs: Need[]): Promise<void> {
  for (const n of needs) await addToShopping(db, n.name, n.lacking, n.unit);
}

export const setDone = (db: Db, id: number, done: boolean) =>
  db.execute("UPDATE shopping_item SET done = ? WHERE id = ?", [done ? 1 : 0, id]);

export const removeItem = (db: Db, id: number) => db.execute("DELETE FROM shopping_item WHERE id = ?", [id]);

export const clearDone = (db: Db) => db.execute("DELETE FROM shopping_item WHERE done = 1");

/**
 * Bought items go to the fridge, adding to what is there when amounts are comparable, then leave the
 * list. Free-text items become ingredients too: the user picked this button, so they count as food.
 */
export async function moveDoneToFridge(db: Db): Promise<void> {
  const bought = await db.select<Row[]>("SELECT * FROM shopping_item WHERE done = 1");
  for (const item of bought) {
    const ingredientId = item.ingredient_id ?? (await ensureIngredient(db, item.text));
    const [have] = await db.select<{ qty_num: number | null; qty_den: number | null; unit: string | null }[]>(
      "SELECT qty_num, qty_den, unit FROM fridge_item WHERE ingredient_id = ?",
      [ingredientId],
    );
    const got = qtyOf(item);
    const had = have && qtyOf(have);
    const qty = got && had && have.unit === item.unit ? add(had, got) : got;
    await db.execute(
      `INSERT INTO fridge_item (ingredient_id, qty_num, qty_den, unit) VALUES (?, ?, ?, ?)
       ON CONFLICT (ingredient_id) DO UPDATE SET qty_num = excluded.qty_num, qty_den = excluded.qty_den, unit = excluded.unit`,
      [ingredientId, qty?.num ?? null, qty?.den ?? null, qty ? item.unit : null],
    );
  }
  await clearDone(db);
}
