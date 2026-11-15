import { getDb } from "$lib/db";
import { searchRecipeIds } from "$lib/filter";
import { listRecipes } from "$lib/recipes";
import { listTags, tagsByRecipe } from "$lib/tags";

export async function load({ url }) {
  const db = await getDb();
  return {
    recipes: await listRecipes(db),
    tags: await tagsByRecipe(db),
    allTags: await listTags(db),
    matches: await searchRecipeIds(db, url.searchParams.get("q") ?? ""),
  };
}
