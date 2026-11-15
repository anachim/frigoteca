<script lang="ts">
  import { page } from "$app/state";
  import { fraction } from "$lib/fraction";
  import { formatLine, scaleLine } from "$lib/ingredients";
  import { splitSteps } from "$lib/steps";

  let { data } = $props();

  // Servings chosen on the recipe page come along in the URL (?porzioni=6).
  const servings = $derived(Number(page.url.searchParams.get("porzioni")) || data.recipe.servings);
  const factor = $derived(servings && data.recipe.servings ? fraction(servings, data.recipe.servings) : fraction(1));
  const lines = $derived(data.ingredients.map((l) => scaleLine(l, factor)));
  const steps = $derived(splitSteps(data.recipe.instructions));

  let gotIngredients = $state<boolean[]>([]);
  let doneSteps = $state<boolean[]>([]);
  let awake = $state<"on" | "unsupported" | "off">("off");

  // Keeps the screen on while cooking. The lock drops when the app goes to the background, so it is
  // requested again on return. Unsupported webviews simply cook with the screen timeout.
  $effect(() => {
    let lock: WakeLockSentinel | null = null;
    let active = true;
    async function request() {
      if (!("wakeLock" in navigator)) {
        awake = "unsupported";
        return;
      }
      try {
        lock = await navigator.wakeLock.request("screen");
        if (!active) return void lock.release();
        awake = "on";
        lock.addEventListener("release", () => (awake = "off"));
      } catch {
        awake = "unsupported";
      }
    }
    const onVisible = () => document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release();
    };
  });
</script>

<main class="cook">
  <header>
    <a class="button" href="/recipe/{data.recipe.id}">← Esci</a>
    <span class="awake">
      {#if awake === "on"}☀️ Schermo sempre acceso{:else if awake === "unsupported"}Schermo acceso non disponibile{/if}
    </span>
  </header>

  <h1>{data.recipe.name}</h1>
  {#if servings}<p class="muted">{servings} {servings === 1 ? "porzione" : "porzioni"}</p>{/if}

  {#if lines.length}
    <h2>Ingredienti</h2>
    <ul class="check">
      {#each lines as line, i (i)}
        <li>
          <label class:done={gotIngredients[i]}>
            <input type="checkbox" bind:checked={gotIngredients[i]} />
            <span>{formatLine(line)}{#if line.note}<span class="muted"> ({line.note})</span>{/if}</span>
          </label>
        </li>
      {/each}
    </ul>
  {/if}

  {#if steps.length}
    <h2>Procedimento</h2>
    <ol class="check steps">
      {#each steps as step, i (i)}
        <li>
          <label class:done={doneSteps[i]}>
            <input type="checkbox" bind:checked={doneSteps[i]} />
            <span><strong>{i + 1}.</strong> {step}</span>
          </label>
        </li>
      {/each}
    </ol>
  {/if}
</main>

<style>
  .cook {
    font-size: 1.3rem;
    line-height: 1.6;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 1rem;
  }
  .awake,
  .muted {
    color: var(--muted);
    font-size: 0.9rem;
  }
  h1 {
    margin-bottom: 0;
  }
  .check {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.25rem;
  }
  label {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.6rem 0.25rem;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
  }
  input[type="checkbox"] {
    width: 1.6rem;
    height: 1.6rem;
    flex-shrink: 0;
    margin-top: 0.2rem;
    accent-color: var(--accent);
  }
  .done span {
    color: var(--muted);
    text-decoration: line-through;
  }
</style>
