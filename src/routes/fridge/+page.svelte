<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { getDb } from "$lib/db";
  import { putInFridge, removeFromFridge } from "$lib/fridge";
  import { ensureIngredient, formatLine, type IngredientLine } from "$lib/ingredients";
  import { setPantry } from "$lib/match";
  import { describeLacking } from "$lib/results";
  import type { Need } from "$lib/match";
  import { addLacking } from "$lib/shopping";
  import { SvelteSet } from "svelte/reactivity";

  const added = new SvelteSet<string>();

  async function toShopping(recipeId: string, lacking: Need[]) {
    await addLacking(await getDb(), lacking);
    added.add(recipeId);
  }
  import { page } from "$app/state";
  import { filterFromUrl, filterToUrl } from "$lib/filter";
  import TagChip from "$lib/TagChip.svelte";

  const tagFilter = $derived(filterFromUrl(page.url.searchParams));

  function toggleTag(id: number) {
    const ids = tagFilter.tagIds;
    const tagIds = ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id];
    goto(`/fridge${filterToUrl({ ...tagFilter, tagIds })}`, { replaceState: true, keepFocus: true, noScroll: true });
  }
  import { parseLine, parseLines } from "$lib/parse-line";

  let { data } = $props();

  let text = $state("");
  let input: HTMLInputElement;

  const inFridge = $derived(new Set(data.items.map((i) => i.ingredientId)));
  const suggestions = $derived(data.ingredients.filter((i) => !inFridge.has(i.id) && !i.pantry));
  const pantry = $derived(data.ingredients.filter((i) => i.pantry));
  let pantryText = $state("");

  async function pantryKey(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const name = pantryText.trim();
    if (!name) return;
    pantryText = "";
    const db = await getDb();
    await setPantry(db, await ensureIngredient(db, name), true);
    await invalidateAll();
  }

  async function unpantry(id: number) {
    await setPantry(await getDb(), id, false);
    await invalidateAll();
  }

  async function put(lines: IngredientLine[]) {
    const db = await getDb();
    for (const line of lines) await putInFridge(db, line);
    await invalidateAll();
  }

  async function onkeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const line = parseLine(text);
    if (!line) return;
    text = "";
    await put([line]);
  }

  async function onpaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData("text") ?? "";
    if (!pasted.includes("\n")) return;
    event.preventDefault();
    await put(parseLines(pasted));
  }

  function edit(line: IngredientLine) {
    text = formatLine(line);
    input.focus();
  }

  async function remove(id: number) {
    await removeFromFridge(await getDb(), id);
    await invalidateAll();
  }
</script>

<main>
  <h1>Il mio frigo</h1>

  <input
    bind:this={input}
    bind:value={text}
    {onkeydown}
    {onpaste}
    placeholder="Scrivi e premi Invio: 500 g farina, 6 uova, limone…"
    aria-label="Aggiungi al frigo"
    autocomplete="off"
  />
  <p class="hint">La quantità è facoltativa. Riscrivere un ingrediente ne aggiorna la quantità.</p>

  {#if data.items.length}
    <h2>Nel frigo</h2>
    <ul class="items">
      {#each data.items as item (item.ingredientId)}
        <li>
          <button class="item" onclick={() => edit(item.line)} title="Modifica quantità">{formatLine(item.line)}</button>
          <button class="remove" onclick={() => remove(item.ingredientId)} aria-label="Togli {item.line.name}">✕</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">Il frigo è vuoto. Scrivi cosa hai o tocca gli ingredienti qui sotto.</p>
  {/if}

  {#if data.items.length && data.allTags.length}
    <div class="chips tag-filter" role="group" aria-label="Filtra risultati per tag">
      {#each data.allTags as tag (tag.id)}
        <TagChip {tag} selected={tagFilter.tagIds.includes(tag.id)} onclick={() => toggleTag(tag.id)} />
      {/each}
    </div>
  {/if}

  {#if data.results.ready.length || data.results.almost.length}
    <section aria-live="polite">
      {#if data.results.ready.length}
        <h2>Puoi farla ({data.results.ready.length})</h2>
        <ul class="results">
          {#each data.results.ready as r (r.recipe.id)}
            <li>
              <a href="/recipe/{r.recipe.id}">
                <strong>{r.recipe.name}</strong>
                {#if r.servings !== null}
                  <span class="lacking">ti basta per {r.servings} {r.servings === 1 ? "porzione" : "porzioni"}</span>
                {/if}
                {#if r.toCheck.length}
                  <span class="check">⚠ verifica quantità: {r.toCheck.map((n) => n.name).join(", ")}</span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
      {#if data.results.almost.length}
        <h2>Quasi ({data.results.almost.length})</h2>
        <ul class="results">
          {#each data.results.almost as r (r.recipe.id)}
            <li>
              <a href="/recipe/{r.recipe.id}">
                <strong>{r.recipe.name}</strong>
                <span class="lacking">ti manca: {r.lacking.map(describeLacking).join(", ")}</span>
                {#if r.toCheck.length}
                  <span class="check">⚠ verifica quantità: {r.toCheck.map((n) => n.name).join(", ")}</span>
                {/if}
              </a>
              <button class="to-shopping" onclick={() => toShopping(r.recipe.id, r.lacking)} disabled={added.has(r.recipe.id)}>
                {added.has(r.recipe.id) ? "✓ Nella lista della spesa" : "🛒 Aggiungi i mancanti alla spesa"}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {:else if data.items.length}
    <p class="empty">
      {tagFilter.tagIds.length ? "Nessuna ricetta con questi tag usa questi ingredienti." : "Nessuna ricetta usa ancora questi ingredienti."}
    </p>
  {/if}

  {#if suggestions.length}
    <h2>Aggiungi al volo</h2>
    <div class="chips">
      {#each suggestions as ing (ing.id)}
        <button class="chip" onclick={() => put([{ name: ing.name, qty: null, unit: null, note: "", optional: false }])}>
          + {ing.name}
        </button>
      {/each}
    </div>
  {/if}

  <h2>Sempre in dispensa</h2>
  <p class="hint">Sale, olio, acqua… non contano mai come mancanti nella ricerca.</p>
  {#if pantry.length}
    <ul class="items pantry">
      {#each pantry as ing (ing.id)}
        <li>
          <span class="item">{ing.name}</span>
          <button class="remove" onclick={() => unpantry(ing.id)} aria-label="Togli {ing.name} dalla dispensa">✕</button>
        </li>
      {/each}
    </ul>
  {/if}
  <input bind:value={pantryText} onkeydown={pantryKey} placeholder="Aggiungi e premi Invio (es. sale)" aria-label="Aggiungi alla dispensa" autocomplete="off" />
</main>

<style>
  h2 {
    font-size: 1.1rem;
    margin-top: 1.5rem;
  }
  .hint,
  .empty {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .items {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .items li {
    display: flex;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    overflow: hidden;
  }
  .items button {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0.6rem 0.4rem 0.6rem 1rem;
  }
  .items .item {
    padding: 0.6rem 0.4rem 0.6rem 1rem;
  }
  .pantry li {
    border-color: var(--border);
    background: var(--surface);
  }
  .items .remove {
    padding: 0.6rem 0.9rem 0.6rem 0.4rem;
    color: var(--muted);
  }
  .tag-filter {
    margin-top: 1.5rem;
  }
  .results {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }
  .results a {
    display: grid;
    gap: 0.2rem;
    padding: 0.8rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    color: inherit;
    text-decoration: none;
  }
  .to-shopping {
    margin-top: 0.3rem;
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  .lacking {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .check {
    color: var(--accent);
    font-size: 0.85rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .chip {
    border-radius: 999px;
    padding: 0.6rem 1rem;
  }
</style>
