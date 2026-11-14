import { getDb } from "$lib/db";
import { listRecipes } from "$lib/recipes";

export async function load() {
  return { recipes: await listRecipes(await getDb()) };
}
