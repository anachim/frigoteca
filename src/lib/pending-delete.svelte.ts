export const UNDO_MS = 5000;

interface Pending {
  id: string;
  name: string;
  run: () => Promise<void>;
  timer: ReturnType<typeof setTimeout>;
}

let pending = $state<Pending | null>(null);

/**
 * Deletion waits a few seconds so it can be undone. Until then the recipe still exists, so closing
 * the app in that window keeps it rather than losing it.
 */
export const pendingDelete = {
  get current(): { id: string; name: string } | null {
    return pending && { id: pending.id, name: pending.name };
  },

  /** Schedules a delete; a delete already waiting runs right away. */
  async schedule(id: string, name: string, run: () => Promise<void>, ms = UNDO_MS): Promise<void> {
    await this.flush();
    const timer = setTimeout(() => this.flush(), ms);
    pending = { id, name, run, timer };
  },

  undo(): void {
    if (pending) clearTimeout(pending.timer);
    pending = null;
  },

  async flush(): Promise<void> {
    const p = pending;
    if (!p) return;
    clearTimeout(p.timer);
    pending = null;
    await p.run();
  },
};
