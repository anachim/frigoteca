<script lang="ts" module>
  import { formatFraction, parseQuantity } from "$lib/fraction";
  import type { IngredientLine } from "$lib/ingredients";
  import { UNITS, type Unit } from "$lib/units";

  export interface DraftLine {
    key: number;
    name: string;
    qty: string;
    unit: Unit | "";
    note: string;
    optional: boolean;
  }

  let nextKey = 0;

  export const emptyDraft = (): DraftLine => ({ key: nextKey++, name: "", qty: "", unit: "", note: "", optional: false });

  export const toDraft = (l: IngredientLine): DraftLine => ({
    key: nextKey++,
    name: l.name,
    qty: l.qty ? formatFraction(l.qty) : "",
    unit: l.unit ?? "",
    note: l.note,
    optional: l.optional,
  });

  /** Returns the lines, or an error message naming the first unreadable quantity. */
  export function fromDrafts(drafts: DraftLine[]): IngredientLine[] | string {
    const lines: IngredientLine[] = [];
    for (const d of drafts) {
      const qty = parseQuantity(d.qty);
      if (d.qty.trim() && !qty) return `Quantità non valida per "${d.name || "ingrediente"}": ${d.qty}`;
      lines.push({ name: d.name, qty, unit: d.unit || null, note: d.note, optional: d.optional });
    }
    return lines;
  }
</script>

<script lang="ts">
  let { drafts = $bindable(), names }: { drafts: DraftLine[]; names: string[] } = $props();

  const unitOptions = Object.keys(UNITS) as Unit[];
  const unitText = (u: Unit) => (u === "pz" ? "pz" : UNITS[u].singular);
</script>

<fieldset>
  <legend>Ingredienti</legend>
  <datalist id="ingredient-names">
    {#each names as name (name)}<option value={name}></option>{/each}
  </datalist>

  {#each drafts as draft, i (draft.key)}
    <div class="line">
      <input class="qty" bind:value={draft.qty} placeholder="q.tà" inputmode="decimal" aria-label="Quantità" />
      <select class="unit" bind:value={draft.unit} aria-label="Unità">
        <option value="">—</option>
        {#each unitOptions as u (u)}<option value={u}>{unitText(u)}</option>{/each}
      </select>
      <input class="name" bind:value={draft.name} list="ingredient-names" placeholder="ingrediente" aria-label="Ingrediente" />
      <input class="note" bind:value={draft.note} placeholder="nota (es. a fette)" aria-label="Nota" />
      <label class="optional"><input type="checkbox" bind:checked={draft.optional} /> facoltativo</label>
      <button type="button" class="remove" onclick={() => drafts.splice(i, 1)} aria-label="Rimuovi ingrediente">✕</button>
    </div>
  {/each}

  <button type="button" onclick={() => drafts.push(emptyDraft())}>+ Aggiungi ingrediente</button>
</fieldset>

<style>
  fieldset {
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    display: grid;
    gap: 0.75rem;
  }
  legend {
    color: var(--muted);
  }
  .line {
    display: grid;
    grid-template-columns: 4.5rem 6.5rem 1fr auto;
    gap: 0.4rem;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .note {
    grid-column: 1 / 3;
  }
  .optional {
    grid-column: 3 / 4;
    color: var(--muted);
    display: flex;
    gap: 0.3rem;
    align-items: center;
  }
  .optional input {
    width: auto;
  }
  .remove {
    grid-row: 1;
    grid-column: 4;
    padding: 0.4rem 0.6rem;
  }
  select {
    font: inherit;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
  }
</style>
