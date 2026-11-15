<script lang="ts">
  import type { Tag } from "$lib/tags";

  let {
    tag,
    selected,
    onclick,
  }: { tag: Pick<Tag, "name" | "color" | "icon">; selected?: boolean; onclick?: () => void } = $props();
</script>

{#if onclick}
  <button type="button" class="chip" class:selected style:--tag={tag.color} aria-pressed={selected} {onclick}>
    {#if tag.icon}{tag.icon}{/if}
    {tag.name}
  </button>
{:else}
  <span class="chip" style:--tag={tag.color}>
    {#if tag.icon}{tag.icon}{/if}
    {tag.name}
  </span>
{/if}

<style>
  .chip {
    display: inline-flex;
    gap: 0.25rem;
    align-items: center;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    border: 1px solid var(--tag, var(--border));
    background: color-mix(in srgb, var(--tag, var(--border)) 18%, transparent);
    color: var(--text);
    font-size: 0.85rem;
    line-height: 1.6;
  }
  button.chip {
    cursor: pointer;
    opacity: 0.6;
  }
  button.chip.selected {
    opacity: 1;
    background: color-mix(in srgb, var(--tag, var(--accent)) 35%, transparent);
    border-color: var(--tag, var(--accent));
    font-weight: 600;
  }
</style>
