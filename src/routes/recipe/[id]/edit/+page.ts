import { error } from "@sveltejs/kit";
import { getDb } from "$lib/db";
import { getRecipe } from "$lib/recipes";

export async function load({ params }) {
  const recipe = await getRecipe(await getDb(), params.id);
  if (!recipe) error(404, "Ricetta non trovata");
  return { recipe };
}
