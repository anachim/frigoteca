<script lang="ts">
  import { goto } from "$app/navigation";
  import RecipeForm from "$lib/RecipeForm.svelte";
  import { getDb } from "$lib/db";
  import { updateRecipe, type RecipeInput } from "$lib/recipes";

  let { data } = $props();

  async function save(input: RecipeInput) {
    await updateRecipe(await getDb(), data.recipe.id, input);
    await goto(`/recipe/${data.recipe.id}`, { replaceState: true });
  }
</script>

<main>
  <h1>Modifica ricetta</h1>
  <RecipeForm initial={data.recipe} onsave={save} cancelHref="/recipe/{data.recipe.id}" />
</main>
