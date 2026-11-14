import { error } from "@sveltejs/kit";
import { getDb } from "$lib/db";
import { getIngredients } from "$lib/ingredients";
import { getRecipe } from "$lib/recipes";

export async function load({ params }) {
  const db = await getDb();
  const recipe = await getRecipe(db, params.id);
  if (!recipe) error(404, "Ricetta non trovata");
  return { recipe, ingredients: await getIngredients(db, params.id) };
}
