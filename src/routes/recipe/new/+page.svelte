<script lang="ts">
  import { goto } from "$app/navigation";
  import RecipeForm from "$lib/RecipeForm.svelte";
  import { getDb } from "$lib/db";
  import { saveIngredients, type IngredientLine } from "$lib/ingredients";
  import { createRecipe, type RecipeInput } from "$lib/recipes";
  import { setRecipeTags } from "$lib/tags";

  let { data } = $props();

  async function save(input: RecipeInput, ingredients: IngredientLine[], tags: string[]) {
    const db = await getDb();
    const id = await createRecipe(db, input);
    await saveIngredients(db, id, ingredients);
    await setRecipeTags(db, id, tags);
    await goto(`/recipe/${id}`, { replaceState: true });
  }
</script>

<main>
  <h1>Nuova ricetta</h1>
  <RecipeForm ingredientNames={data.ingredientNames} allTags={data.allTags} onsave={save} cancelHref="/" />
</main>
