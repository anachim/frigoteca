<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { getDb } from "$lib/db";
  import { putInFridge, removeFromFridge } from "$lib/fridge";
  import { formatLine, type IngredientLine } from "$lib/ingredients";
  import { parseLine, parseLines } from "$lib/parse-line";

  let { data } = $props();

  let text = $state("");
  let input: HTMLInputElement;

  const inFridge = $derived(new Set(data.items.map((i) => i.ingredientId)));
  const suggestions = $derived(data.ingredients.filter((i) => !inFridge.has(i.id)));

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
  .items .remove {
    padding: 0.6rem 0.9rem 0.6rem 0.4rem;
    color: var(--muted);
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
