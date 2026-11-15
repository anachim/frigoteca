<script lang="ts">
  import { goto } from "$app/navigation";
  import { clearDraft, loadDraft, saveDraft } from "$lib/draft";
  import IngredientEditor, { emptyDraft, fromDrafts, toDraft, type DraftLine } from "$lib/IngredientEditor.svelte";
  import type { IngredientLine } from "$lib/ingredients";
  import { validateRecipe, type RecipeInput } from "$lib/recipes";
  import TagPicker from "$lib/TagPicker.svelte";
  import type { Tag } from "$lib/tags";

  let {
    initial = { name: "", servings: null, instructions: "", glassMl: null },
    initialIngredients = [],
    initialTags = [],
    allTags,
    ingredientNames,
    draftKey,
    onsave,
    cancelHref,
  }: {
    initial?: RecipeInput;
    initialIngredients?: IngredientLine[];
    initialTags?: string[];
    allTags: Tag[];
    ingredientNames: string[];
    /** Where the unsaved draft of this form is kept, e.g. "new" or "edit:<id>". */
    draftKey: string;
    onsave: (input: RecipeInput, ingredients: IngredientLine[], tags: string[]) => Promise<void>;
    cancelHref: string;
  } = $props();

  interface Snapshot {
    form: RecipeInput;
    lines: Omit<DraftLine, "key">[];
    tags: string[];
  }

  // The form edits a copy; later changes to the initial props are intentionally ignored.
  // svelte-ignore state_referenced_locally
  const fromProps: Snapshot = {
    form: { name: initial.name, servings: initial.servings, instructions: initial.instructions, glassMl: initial.glassMl },
    lines: (initialIngredients.length ? initialIngredients.map(toDraft) : [emptyDraft()]).map(({ key, ...l }) => l),
    tags: [...initialTags],
  };
  // svelte-ignore state_referenced_locally
  const restored = loadDraft<Snapshot>(draftKey);
  const start = restored ?? fromProps;

  let form = $state({ ...start.form });
  let drafts = $state(start.lines.map((l) => ({ ...emptyDraft(), ...l })));
  let tags = $state([...start.tags]);
  let showRestored = $state(restored !== null);
  let error = $state<string | null>(null);
  let saving = $state(false);

  const snapshot = (): Snapshot => ({ form: { ...form }, lines: drafts.map(({ key, ...l }) => l), tags: [...tags] });
  const pristine = JSON.stringify(fromProps);

  $effect(() => {
    const now = snapshot();
    if (JSON.stringify(now) === pristine) clearDraft(draftKey);
    else saveDraft(draftKey, now);
  });

  function discardDraft() {
    form = { ...fromProps.form };
    drafts = fromProps.lines.map((l) => ({ ...emptyDraft(), ...l }));
    tags = [...fromProps.tags];
    showRestored = false;
  }

  async function cancel() {
    clearDraft(draftKey);
    await goto(cancelHref);
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const input: RecipeInput = { ...form, servings: form.servings ?? null, glassMl: form.glassMl ?? null };
    const lines = fromDrafts(drafts);
    error = validateRecipe(input) ?? (typeof lines === "string" ? lines : null);
    if (error || typeof lines === "string") return;
    saving = true;
    try {
      await onsave(input, lines, tags);
      clearDraft(draftKey);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      saving = false;
    }
  }
</script>

<form onsubmit={submit}>
  {#if showRestored}
    <p class="restored" role="status">
      Bozza non salvata ripristinata.
      <button type="button" onclick={discardDraft}>Scarta bozza</button>
    </p>
  {/if}
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

  <TagPicker all={allTags} bind:selected={tags} />

  <label>
    Procedimento
    <textarea rows="10" bind:value={form.instructions}></textarea>
  </label>

  {#if error}<p role="alert">{error}</p>{/if}

  <div class="actions form-actions">
    <button type="button" onclick={cancel}>Annulla</button>
    <button class="primary" type="submit" disabled={saving}>Salva</button>
  </div>
</form>

<style>
  form {
    display: grid;
    gap: 1rem;
  }
  .restored {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin: 0;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
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
