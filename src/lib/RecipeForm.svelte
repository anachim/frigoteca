<script lang="ts">
  import IngredientEditor, { emptyDraft, fromDrafts, toDraft } from "$lib/IngredientEditor.svelte";
  import type { IngredientLine } from "$lib/ingredients";
  import { validateRecipe, type RecipeInput } from "$lib/recipes";

  let {
    initial = { name: "", servings: null, instructions: "", glassMl: null },
    initialIngredients = [],
    ingredientNames,
    onsave,
    cancelHref,
  }: {
    initial?: RecipeInput;
    initialIngredients?: IngredientLine[];
    ingredientNames: string[];
    onsave: (input: RecipeInput, ingredients: IngredientLine[]) => Promise<void>;
    cancelHref: string;
  } = $props();

  // The form edits a copy; later changes to the initial props are intentionally ignored.
  // svelte-ignore state_referenced_locally
  let form = $state({
    name: initial.name,
    servings: initial.servings,
    instructions: initial.instructions,
    glassMl: initial.glassMl,
  });
  // svelte-ignore state_referenced_locally
  let drafts = $state(initialIngredients.length ? initialIngredients.map(toDraft) : [emptyDraft()]);
  let error = $state<string | null>(null);
  let saving = $state(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const input: RecipeInput = { ...form, servings: form.servings ?? null, glassMl: form.glassMl ?? null };
    const lines = fromDrafts(drafts);
    error = validateRecipe(input) ?? (typeof lines === "string" ? lines : null);
    if (error || typeof lines === "string") return;
    saving = true;
    try {
      await onsave(input, lines);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      saving = false;
    }
  }
</script>

<form onsubmit={submit}>
  <label>
    Nome
    <input bind:value={form.name} required autocomplete="off" />
  </label>
  <div class="row">
    <label>
      Porzioni
      <input type="number" min="1" step="1" bind:value={form.servings} />
    </label>
    <label>
      Bicchiere (ml)
      <input type="number" min="1" step="1" bind:value={form.glassMl} placeholder="solo cocktail" />
    </label>
  </div>

  <IngredientEditor bind:drafts names={ingredientNames} />

  <label>
    Procedimento
    <textarea rows="10" bind:value={form.instructions}></textarea>
  </label>

  {#if error}<p role="alert">{error}</p>{/if}

  <div class="actions">
    <a class="button" href={cancelHref}>Annulla</a>
    <button class="primary" type="submit" disabled={saving}>Salva</button>
  </div>
</form>

<style>
  form {
    display: grid;
    gap: 1rem;
  }
  label {
    display: grid;
    gap: 0.25rem;
    color: var(--muted);
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
