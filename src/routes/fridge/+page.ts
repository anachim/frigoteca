import { getDb } from "$lib/db";
import { ingredientsByUse, listFridge } from "$lib/fridge";
import { matchAll } from "$lib/match";
import { listRecipes } from "$lib/recipes";
import { groupResults } from "$lib/results";

export async function load() {
  const db = await getDb();
  return {
    items: await listFridge(db),
    ingredients: await ingredientsByUse(db),
    results: groupResults(await listRecipes(db), await matchAll(db)),
  };
}
