import { expect, test } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "./draft";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

const broken = new Proxy({} as Storage, {
  get() {
    return () => {
      throw new Error("storage unavailable");
    };
  },
});

test("drafts are saved, read back and cleared per key", () => {
  const store = memoryStorage();
  saveDraft("new", { name: "Carbonara" }, store);
  saveDraft("r1", { name: "Mojito" }, store);
  expect(loadDraft("new", store)).toEqual({ name: "Carbonara" });
  clearDraft("new", store);
  expect(loadDraft("new", store)).toBeNull();
  expect(loadDraft("r1", store)).toEqual({ name: "Mojito" });
});

test("missing, corrupt or failing storage never throws", () => {
  const store = memoryStorage();
  store.setItem("frigoteca:draft:x", "{not json");
  expect(loadDraft("x", store)).toBeNull();
  expect(loadDraft("x", null)).toBeNull();
  expect(() => saveDraft("x", 1, broken)).not.toThrow();
  expect(() => clearDraft("x", broken)).not.toThrow();
  expect(loadDraft("x", broken)).toBeNull();
});
