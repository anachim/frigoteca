import { getDb } from "$lib/db";
import { listRecipes } from "$lib/recipes";
import { listTags, tagsByRecipe } from "$lib/tags";

export async function load() {
  const db = await getDb();
  return { recipes: await listRecipes(db), tags: await tagsByRecipe(db), allTags: await listTags(db) };
}
