import { getDb } from "$lib/db";
import { listIngredientNames } from "$lib/ingredients";

export async function load() {
  return { ingredientNames: await listIngredientNames(await getDb()) };
}
