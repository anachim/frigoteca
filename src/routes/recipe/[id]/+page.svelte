<script lang="ts">
  import { goto } from "$app/navigation";
  import { getDb } from "$lib/db";
  import { deleteRecipe } from "$lib/recipes";

  let { data } = $props();
  let confirming = $state(false);

  // ponytail: two-tap delete; replaced by the undo toast planned in Phase 1.
  async function remove() {
    if (!confirming) {
      confirming = true;
      return;
    }
    await deleteRecipe(await getDb(), data.recipe.id);
    await goto("/", { replaceState: true });
  }

  const meta = $derived(
    [
      data.recipe.servings && `${data.recipe.servings} porzioni`,
      data.recipe.glassMl && `bicchiere da ${data.recipe.glassMl} ml`,
    ]
      .filter(Boolean)
      .join(" · "),
  );
</script>

<main>
  <a href="/">← Ricette</a>
  <h1>{data.recipe.name}</h1>

  {#if meta}<p class="meta">{meta}</p>{/if}

  {#if data.recipe.instructions}
    <p class="instructions">{data.recipe.instructions}</p>
  {/if}

  <div class="actions">
    <button class="danger" onclick={remove} onblur={() => (confirming = false)}>
      {confirming ? "Conferma eliminazione" : "Elimina"}
    </button>
    <a class="button primary" href="/recipe/{data.recipe.id}/edit">Modifica</a>
  </div>
</main>

<style>
  .meta {
    color: var(--muted);
  }
  .instructions {
    white-space: pre-wrap;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 2rem;
  }
</style>
