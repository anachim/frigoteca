<script lang="ts">
  import { goto } from "$app/navigation";
  import RecipeForm from "$lib/RecipeForm.svelte";
  import { getDb } from "$lib/db";
  import { createRecipe, type RecipeInput } from "$lib/recipes";

  async function save(input: RecipeInput) {
    const id = await createRecipe(await getDb(), input);
    await goto(`/recipe/${id}`, { replaceState: true });
  }
</script>

<main>
  <h1>Nuova ricetta</h1>
  <RecipeForm onsave={save} cancelHref="/" />
</main>
