<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { filterFromUrl, filterRecipes, filterToUrl, type RecipeFilter } from "$lib/filter";
  import { pendingDelete } from "$lib/pending-delete.svelte";
  import TagChip from "$lib/TagChip.svelte";

  let { data } = $props();

  const filter = $derived(filterFromUrl(page.url.searchParams));
  const recipes = $derived(data.recipes.filter((r) => r.id !== pendingDelete.current?.id));
  const shown = $derived(filterRecipes(recipes, data.tags, filter));
  const filtering = $derived(filter.favoritesOnly || filter.tagIds.length > 0);

  function setFilter(next: RecipeFilter) {
    goto(filterToUrl(next) || "/", { replaceState: true, keepFocus: true, noScroll: true });
  }

  function toggleTag(id: number) {
    const tagIds = filter.tagIds.includes(id) ? filter.tagIds.filter((t) => t !== id) : [...filter.tagIds, id];
    setFilter({ ...filter, tagIds });
  }
</script>

<main>
  <h1>Frigoteca</h1>

  {#if recipes.length === 0}
    <p class="empty">Nessuna ricetta ancora. <a href="/recipe/new">Crea la tua prima ricetta</a></p>
  {:else}
    <div class="filters" role="group" aria-label="Filtri">
      <TagChip
        tag={{ name: "Preferite", icon: "⭐", color: null }}
        selected={filter.favoritesOnly}
        onclick={() => setFilter({ ...filter, favoritesOnly: !filter.favoritesOnly })}
      />
      {#each data.allTags as tag (tag.id)}
        <TagChip {tag} selected={filter.tagIds.includes(tag.id)} onclick={() => toggleTag(tag.id)} />
      {/each}
    </div>

    {#if shown.length === 0}
      <p class="empty">
        Nessuna ricetta con questi filtri.
        <button onclick={() => setFilter({ tagIds: [], favoritesOnly: false })}>Mostra tutte</button>
      </p>
    {:else}
      <ul>
        {#each shown as recipe (recipe.id)}
          <li>
            <a href="/recipe/{recipe.id}">
              <span>{#if recipe.favorite}<span aria-label="preferita">⭐</span>{/if} {recipe.name}</span>
              {#if data.tags.get(recipe.id)}
                <span class="tags">
                  {#each data.tags.get(recipe.id) ?? [] as tag (tag.id)}<TagChip {tag} />{/each}
                </span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
      {#if filtering}<p class="count">{shown.length} di {recipes.length} ricette</p>{/if}
    {/if}
  {/if}
</main>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li a {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
    margin-bottom: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    color: inherit;
    text-decoration: none;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 3rem 0;
  }
  .count {
    color: var(--muted);
    text-align: center;
  }
</style>
