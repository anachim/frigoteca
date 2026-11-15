<script lang="ts">
  import { goto } from "$app/navigation";
  import RecipeForm from "$lib/RecipeForm.svelte";
  import { getDb } from "$lib/db";
  import { saveIngredients, type IngredientLine } from "$lib/ingredients";
  import { updateRecipe, type RecipeInput } from "$lib/recipes";
  import { setRecipeTags } from "$lib/tags";

  let { data } = $props();

  async function save(input: RecipeInput, ingredients: IngredientLine[], tags: string[]) {
    const db = await getDb();
    await updateRecipe(db, data.recipe.id, input);
    await saveIngredients(db, data.recipe.id, ingredients);
    await setRecipeTags(db, data.recipe.id, tags);
    await goto(`/recipe/${data.recipe.id}`, { replaceState: true });
  }
</script>

<main>
  <h1>Modifica ricetta</h1>
  <RecipeForm
    initial={data.recipe}
    initialIngredients={data.ingredients}
    ingredientNames={data.ingredientNames}
    initialTags={data.tags}
    allTags={data.allTags}
    onsave={save}
    cancelHref="/recipe/{data.recipe.id}"
  />
</main>
