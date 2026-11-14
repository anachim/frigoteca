<script lang="ts">
  import { getDb } from "$lib/db";

  const recipeCount = getDb()
    .then((db) => db.select<{ n: number }[]>("SELECT COUNT(*) AS n FROM recipe"))
    .then((rows) => rows[0].n);
</script>

<main>
  <h1>Frigoteca</h1>
  {#await recipeCount}
    <p>Caricamento…</p>
  {:then n}
    <p>{n === 0 ? "Crea la tua prima ricetta" : `${n} ricette`}</p>
  {:catch err}
    <p role="alert">Errore database: {err}</p>
  {/await}
</main>

<style>
  :root {
    color-scheme: light dark;
    font-family: system-ui, sans-serif;
  }
  main {
    padding: 1rem;
  }
</style>
