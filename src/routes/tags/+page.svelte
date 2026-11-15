<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { getDb } from "$lib/db";
  import TagChip from "$lib/TagChip.svelte";
  import { deleteTag, updateTag, type Tag } from "$lib/tags";

  let { data } = $props();

  let edits = $state<Record<number, Tag>>({});
  let errors = $state<Record<number, string>>({});
  let confirming = $state<number | null>(null);

  $effect(() => {
    edits = Object.fromEntries(data.tags.map((t) => [t.id, { ...t }]));
  });

  async function save(id: number) {
    const error = await updateTag(await getDb(), edits[id]);
    if (error) errors[id] = error;
    else {
      delete errors[id];
      await invalidateAll();
    }
  }

  async function remove(id: number) {
    if (confirming !== id) {
      confirming = id;
      return;
    }
    await deleteTag(await getDb(), id);
    confirming = null;
    await invalidateAll();
  }
</script>

<main>
  <a href="/">← Ricette</a>
  <h1>Tag</h1>

  {#if data.tags.length === 0}
    <p class="empty">Nessun tag. Aggiungili quando crei o modifichi una ricetta.</p>
  {:else}
    <ul>
      {#each data.tags as tag (tag.id)}
        {#if edits[tag.id]}
          <li>
            <TagChip tag={edits[tag.id]} />
            <div class="fields">
              <input class="icon" bind:value={edits[tag.id].icon} onchange={() => save(tag.id)} placeholder="🙂" aria-label="Emoji" maxlength="8" />
              <input bind:value={edits[tag.id].name} onchange={() => save(tag.id)} aria-label="Nome" />
              <input
                type="color"
                value={edits[tag.id].color ?? "#999999"}
                oninput={(e) => (edits[tag.id].color = e.currentTarget.value)}
                onchange={() => save(tag.id)}
                aria-label="Colore"
              />
              <button class="danger" onclick={() => remove(tag.id)} onblur={() => (confirming = null)}>
                {confirming === tag.id ? "Conferma" : "Elimina"}
              </button>
            </div>
            {#if errors[tag.id]}<p role="alert">{errors[tag.id]}</p>{/if}
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
</main>

<style>
  ul {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 1rem;
  }
  li {
    display: grid;
    gap: 0.5rem;
    padding: 0.8rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }
  .fields {
    display: grid;
    grid-template-columns: 3.5rem 1fr 3rem auto;
    gap: 0.4rem;
    align-items: center;
  }
  .icon {
    text-align: center;
  }
  input[type="color"] {
    padding: 0.1rem;
    height: 2.4rem;
  }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 3rem 0;
  }
</style>
