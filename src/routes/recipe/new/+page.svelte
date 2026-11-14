<script lang="ts">
  import { goto } from "$app/navigation";
  import RecipeForm from "$lib/RecipeForm.svelte";
  import { getDb } from "$lib/db";
  import { saveIngredients, type IngredientLine } from "$lib/ingredients";
  import { createRecipe, type RecipeInput } from "$lib/recipes";

  let { data } = $props();

  async function save(input: RecipeInput, ingredients: IngredientLine[]) {
    const db = await getDb();
    const id = await createRecipe(db, input);
    await saveIngredients(db, id, ingredients);
    await goto(`/recipe/${id}`, { replaceState: true });
  }
</script>

<main>
  <h1>Nuova ricetta</h1>
  <RecipeForm ingredientNames={data.ingredientNames} onsave={save} cancelHref="/" />
</main>
