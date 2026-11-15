<script lang="ts">
  import TagChip from "$lib/TagChip.svelte";

  let { data } = $props();
</script>

<main>
  <header>
    <h1>Frigoteca</h1>
    <nav>
      <a class="button" href="/tags">Tag</a>
      <a class="button primary" href="/recipe/new">Nuova ricetta</a>
    </nav>
  </header>

  {#if data.recipes.length === 0}
    <p class="empty">Nessuna ricetta ancora. <a href="/recipe/new">Crea la tua prima ricetta</a></p>
  {:else}
    <ul>
      {#each data.recipes as recipe (recipe.id)}
        <li>
          <a href="/recipe/{recipe.id}">
            {recipe.name}
            {#if data.tags.get(recipe.id)}
              <span class="tags">
                {#each data.tags.get(recipe.id) ?? [] as tag (tag.id)}<TagChip {tag} />{/each}
              </span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  nav {
    display: flex;
    gap: 0.5rem;
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
</style>
