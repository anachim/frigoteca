<script lang="ts">
  let { data } = $props();
</script>

<main>
  <header>
    <h1>Frigoteca</h1>
    <a class="button primary" href="/recipe/new">Nuova ricetta</a>
  </header>

  {#if data.recipes.length === 0}
    <p class="empty">Nessuna ricetta ancora. <a href="/recipe/new">Crea la tua prima ricetta</a></p>
  {:else}
    <ul>
      {#each data.recipes as recipe (recipe.id)}
        <li><a href="/recipe/{recipe.id}">{recipe.name}</a></li>
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
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li a {
    display: block;
    padding: 0.8rem 1rem;
    margin-bottom: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    color: inherit;
    text-decoration: none;
  }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 3rem 0;
  }
</style>
