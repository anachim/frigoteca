<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { getDb } from "$lib/db";
  import { fraction } from "$lib/fraction";
  import { formatLine, scaleLine } from "$lib/ingredients";
  import { pendingDelete } from "$lib/pending-delete.svelte";
  import { deleteRecipe, setFavorite } from "$lib/recipes";
  import TagChip from "$lib/TagChip.svelte";

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  let favorite = $state(data.recipe.favorite);

  async function toggleFavorite() {
    favorite = !favorite;
    await setFavorite(await getDb(), data.recipe.id, favorite);
  }

  async function remove() {
    const { id, name } = data.recipe;
    await pendingDelete.schedule(id, name, async () => {
      await deleteRecipe(await getDb(), id);
      await invalidateAll();
    });
    await goto("/", { replaceState: true });
  }

  // svelte-ignore state_referenced_locally
  let servings = $state(data.recipe.servings);
  const lines = $derived(
    servings && data.recipe.servings
      ? data.ingredients.map((l) => scaleLine(l, fraction(servings!, data.recipe.servings!)))
      : data.ingredients,
  );
</script>

<main>
  <a href="/">← Ricette</a>
  <div class="title">
    <h1>{data.recipe.name}</h1>
    <button
      class="star"
      onclick={toggleFavorite}
      aria-pressed={favorite}
      aria-label={favorite ? "Togli dalle preferite" : "Aggiungi alle preferite"}
    >
      {favorite ? "⭐" : "☆"}
    </button>
  </div>

  {#if servings || data.recipe.glassMl}
    <div class="meta">
      {#if servings}
        <span class="stepper" role="group" aria-label="Porzioni">
          <button onclick={() => (servings = Math.max(1, servings! - 1))} disabled={servings <= 1} aria-label="Meno porzioni">−</button>
          <span aria-live="polite">{servings} {servings === 1 ? "porzione" : "porzioni"}</span>
          <button onclick={() => (servings = servings! + 1)} aria-label="Più porzioni">+</button>
        </span>
      {/if}
      {#if data.recipe.glassMl}<span>bicchiere da {data.recipe.glassMl} ml</span>{/if}
    </div>
  {/if}

  {#if data.tags.length}
    <div class="tags">
      {#each data.tags as tag (tag.id)}<TagChip {tag} />{/each}
    </div>
  {/if}

  {#if data.ingredients.length}
    <h2>Ingredienti</h2>
    <ul class="ingredients">
      {#each lines as line, i (i)}
        <li>
          {formatLine(line)}
          {#if line.note}<span class="muted">({line.note})</span>{/if}
          {#if line.optional}<span class="muted">· facoltativo</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if data.recipe.instructions}
    <h2>Procedimento</h2>
    <p class="instructions">{data.recipe.instructions}</p>
  {/if}

  <div class="actions">
    <button class="danger" onclick={remove}>
      Elimina
    </button>
    <a class="button primary" href="/recipe/{data.recipe.id}/edit">Modifica</a>
  </div>
</main>

<style>
  .meta,
  .muted {
    color: var(--muted);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    margin: 0.5rem 0 1rem;
  }
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text);
  }
  .stepper button {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    font-size: 1.2rem;
    border-radius: 999px;
  }
  h2 {
    font-size: 1.1rem;
  }
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .star {
    font-size: 1.5rem;
    line-height: 1;
    padding: 0.4rem 0.6rem;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .ingredients {
    padding-left: 1.2rem;
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
