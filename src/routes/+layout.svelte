<script lang="ts">
  import { page } from "$app/state";
  import { pendingDelete } from "$lib/pending-delete.svelte";

  let { children } = $props();

  const sections = [
    { href: "/", label: "Ricette", icon: "📖" },
    { href: "/fridge", label: "Frigo", icon: "🧊" },
    { href: "/shopping", label: "Spesa", icon: "🛒" },
    { href: "/recipe/new", label: "Nuova", icon: "➕" },
    { href: "/tags", label: "Tag", icon: "🏷️" },
  ];
  const path = $derived(page.url.pathname);
  // Forms keep their own Save/Cancel bar and cooking mode wants the whole screen, so the nav steps aside.
  const inForm = $derived(path === "/recipe/new" || path.endsWith("/edit") || path.endsWith("/cook"));
  const current = (href: string) =>
    href === "/" ? path === "/" || (path.startsWith("/recipe/") && !inForm) : path === href;
</script>

<div class="app" class:in-form={inForm}>
  {#if !inForm}
    <nav class="app-nav" aria-label="Sezioni">
      {#each sections as s (s.href)}
        <a href={s.href} aria-current={current(s.href) ? "page" : undefined}>
          <span aria-hidden="true">{s.icon}</span>
          {s.label}
        </a>
      {/each}
    </nav>
  {/if}
  {@render children()}
</div>

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
  .app-nav {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .app-nav a {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    color: var(--muted);
    text-decoration: none;
  }
  .app-nav a[aria-current="page"] {
    color: var(--accent);
    font-weight: 600;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  /* Phones: nav at the bottom, within thumb reach. */
  @media (max-width: 640px) {
    .app-nav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
      justify-content: space-around;
      padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
      border-bottom: none;
      border-top: 1px solid var(--border);
    }
    .app-nav a {
      flex-direction: column;
      gap: 0;
      font-size: 0.8rem;
      padding: 0.25rem 0.4rem;
    }
    .app-nav a span {
      font-size: 1.3rem;
    }
    .app:not(.in-form) {
      padding-bottom: calc(4.5rem + env(safe-area-inset-bottom));
    }
    .app.in-form :global(.form-actions) {
      position: sticky;
      bottom: 0;
      margin: 0 -1rem;
      padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
      background: var(--bg);
      border-top: 1px solid var(--border);
    }
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
  @media (max-width: 640px) {
    .toast-area {
      bottom: calc(5.5rem + env(safe-area-inset-bottom));
    }
  }
</style>
