<script lang="ts">
  let { children } = $props();
</script>

{@render children()}

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
</style>
