import { getDb } from "$lib/db";
import { ingredientsByUse, listFridge } from "$lib/fridge";

export async function load() {
  const db = await getDb();
  return { items: await listFridge(db), ingredients: await ingredientsByUse(db) };
}
