<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { getDb } from "$lib/db";
  import { formatLine } from "$lib/ingredients";
  import { parseLine, parseLines } from "$lib/parse-line";
  import { addLine, clearDone, moveDoneToFridge, removeItem, setDone } from "$lib/shopping";

  let { data } = $props();
  let text = $state("");

  const bought = $derived(data.items.filter((i) => i.done).length);

  async function run(action: (db: Awaited<ReturnType<typeof getDb>>) => Promise<unknown>) {
    await action(await getDb());
    await invalidateAll();
  }

  async function onkeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const line = parseLine(text);
    if (!line) return;
    text = "";
    await run((db) => addLine(db, line));
  }

  async function onpaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData("text") ?? "";
    if (!pasted.includes("\n")) return;
    event.preventDefault();
    await run(async (db) => {
      for (const line of parseLines(pasted)) await addLine(db, line);
    });
  }
</script>

<main>
  <h1>Lista della spesa</h1>

  <input
    bind:value={text}
    {onkeydown}
    {onpaste}
    placeholder="Scrivi e premi Invio: 1 kg farina, carta da forno…"
    aria-label="Aggiungi alla spesa"
    autocomplete="off"
  />

  {#if data.items.length}
    <ul>
      {#each data.items as item (item.id)}
        <li>
          <label class:done={item.done}>
            <input type="checkbox" checked={item.done} onchange={(e) => run((db) => setDone(db, item.id, e.currentTarget.checked))} />
            <span>{formatLine(item.line)}</span>
          </label>
          <button class="remove" onclick={() => run((db) => removeItem(db, item.id))} aria-label="Togli {item.line.name}">✕</button>
        </li>
      {/each}
    </ul>

    {#if bought}
      <div class="actions">
        <button onclick={() => run(clearDone)}>Togli i comprati</button>
        <button class="primary" onclick={() => run(moveDoneToFridge)}>🧊 Metti nel frigo i comprati ({bought})</button>
      </div>
    {/if}
  {:else}
    <p class="empty">La lista è vuota. Dal frigo puoi aggiungere quello che manca a una ricetta.</p>
  {/if}
</main>

<style>
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border);
  }
  label {
    flex: 1;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.7rem 0.25rem;
    cursor: pointer;
  }
  input[type="checkbox"] {
    width: 1.4rem;
    height: 1.4rem;
    accent-color: var(--accent);
  }
  .done span {
    color: var(--muted);
    text-decoration: line-through;
  }
  .remove {
    border: none;
    background: transparent;
    color: var(--muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 2rem 0;
  }
</style>
