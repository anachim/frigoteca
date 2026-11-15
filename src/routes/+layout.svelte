<script lang="ts">
  import { pendingDelete } from "$lib/pending-delete.svelte";

  let { children } = $props();
</script>

{@render children()}

<div class="toast-area" role="status" aria-live="polite">
  {#if pendingDelete.current}
    <div class="toast">
      <span>«{pendingDelete.current.name}» eliminata</span>
      <button onclick={() => pendingDelete.undo()}>Annulla</button>
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    color-scheme: light dark;
    --bg: light-dark(#faf8f5, #1b1a19);
    --surface: light-dark(#ffffff, #262422);
    --text: light-dark(#1f1d1b, #ece9e4);
    --muted: light-dark(#6b665f, #a39d94);
    --border: light-dark(#e2ddd5, #3a3733);
    --accent: light-dark(#c2410c, #fb923c);
    --on-accent: light-dark(#ffffff, #1b1a19);
    --danger: light-dark(#b91c1c, #f87171);
    font-family: system-ui, sans-serif;
    line-height: 1.5;
  }
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
  }
  :global(main) {
    max-width: 40rem;
    margin: 0 auto;
    padding: 1rem;
  }
  :global(a) {
    color: var(--accent);
  }
  :global(button, .button) {
    font: inherit;
    padding: 0.6rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    text-decoration: none;
    cursor: pointer;
    display: inline-block;
  }
  :global(.primary) {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--on-accent);
  }
  :global(.danger) {
    color: var(--danger);
  }
  :global(input, textarea) {
    font: inherit;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    width: 100%;
    box-sizing: border-box;
  }
  :global([role="alert"]) {
    color: var(--danger);
  }
  .toast-area {
    position: fixed;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    border-radius: 0.75rem;
    background: var(--text);
    color: var(--bg);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
  }
  .toast button {
    background: transparent;
    border-color: transparent;
    color: var(--accent);
    font-weight: 600;
  }
</style>
