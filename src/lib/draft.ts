/**
 * Unsaved form drafts kept in browser storage. Storage can be missing or throw (private mode,
 * cleared data), so every access is guarded and the form works without it.
 */
const PREFIX = "frigoteca:draft:";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadDraft<T>(key: string, store = storage()): T | null {
  try {
    const raw = store?.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, value: unknown, store = storage()): void {
  try {
    store?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the draft is a convenience, the form keeps working.
  }
}

export function clearDraft(key: string, store = storage()): void {
  try {
    store?.removeItem(PREFIX + key);
  } catch {
    // Same as above.
  }
}
