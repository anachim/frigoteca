import { getDb } from "$lib/db";
import { listIngredientNames } from "$lib/ingredients";
import { listTags } from "$lib/tags";

export async function load() {
  const db = await getDb();
  return { ingredientNames: await listIngredientNames(db), allTags: await listTags(db) };
}
