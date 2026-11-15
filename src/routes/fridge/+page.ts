import { getDb } from "$lib/db";
import { filterFromUrl, filterRecipes } from "$lib/filter";
import { ingredientsByUse, listFridge } from "$lib/fridge";
import { matchAll } from "$lib/match";
import { listRecipes } from "$lib/recipes";
import { groupResults } from "$lib/results";
import { listTags, tagsByRecipe } from "$lib/tags";

export async function load({ url }) {
  const db = await getDb();
  const recipes = filterRecipes(await listRecipes(db), await tagsByRecipe(db), filterFromUrl(url.searchParams));
  return {
    items: await listFridge(db),
    ingredients: await ingredientsByUse(db),
    allTags: await listTags(db),
    results: groupResults(recipes, await matchAll(db)),
  };
}
