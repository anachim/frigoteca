<script lang="ts">
  import { goto } from "$app/navigation";
  import { getDb } from "$lib/db";
  import { formatLine } from "$lib/ingredients";
  import { deleteRecipe, setFavorite } from "$lib/recipes";
  import TagChip from "$lib/TagChip.svelte";

  let { data } = $props();
  let confirming = $state(false);
  // svelte-ignore state_referenced_locally
  let favorite = $state(data.recipe.favorite);

  async function toggleFavorite() {
    favorite = !favorite;
    await setFavorite(await getDb(), data.recipe.id, favorite);
  }

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

  {#if meta}<p class="meta">{meta}</p>{/if}

  {#if data.tags.length}
    <div class="tags">
      {#each data.tags as tag (tag.id)}<TagChip {tag} />{/each}
    </div>
  {/if}

  {#if data.ingredients.length}
    <h2>Ingredienti</h2>
    <ul class="ingredients">
      {#each data.ingredients as line, i (i)}
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
    <button class="danger" onclick={remove} onblur={() => (confirming = false)}>
      {confirming ? "Conferma eliminazione" : "Elimina"}
    </button>
    <a class="button primary" href="/recipe/{data.recipe.id}/edit">Modifica</a>
  </div>
</main>

<style>
  .meta,
  .muted {
    color: var(--muted);
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
