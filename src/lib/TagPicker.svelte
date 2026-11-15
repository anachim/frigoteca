<script lang="ts">
  import TagChip from "$lib/TagChip.svelte";
  import type { Tag } from "$lib/tags";

  let { all, selected = $bindable() }: { all: Tag[]; selected: string[] } = $props();

  let draft = $state("");
  const key = (name: string) => name.trim().toLocaleLowerCase("it");
  const isSelected = (name: string) => selected.some((s) => key(s) === key(name));

  // Tags typed in this form but not saved yet still show as chips.
  const options = $derived([
    ...all,
    ...selected.filter((s) => !all.some((t) => key(t.name) === key(s))).map((name) => ({ name, color: null, icon: null })),
  ]);

  function toggle(name: string) {
    selected = isSelected(name) ? selected.filter((s) => key(s) !== key(name)) : [...selected, name];
  }

  function addDraft(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const name = draft.trim();
    if (name && !isSelected(name)) selected = [...selected, all.find((t) => key(t.name) === key(name))?.name ?? name];
    draft = "";
  }
</script>

<fieldset>
  <legend>Tag</legend>
  {#if options.length}
    <div class="chips">
      {#each options as tag (tag.name)}
        <TagChip {tag} selected={isSelected(tag.name)} onclick={() => toggle(tag.name)} />
      {/each}
    </div>
  {/if}
  <input bind:value={draft} onkeydown={addDraft} placeholder="Nuovo tag e Invio (es. Cocktail)" aria-label="Nuovo tag" />
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
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
