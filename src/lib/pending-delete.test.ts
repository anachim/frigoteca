import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { pendingDelete, UNDO_MS } from "./pending-delete.svelte";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  pendingDelete.undo();
  vi.useRealTimers();
});

test("delete runs after the undo window", async () => {
  const run = vi.fn(async () => {});
  await pendingDelete.schedule("a", "Mojito", run);
  expect(pendingDelete.current).toEqual({ id: "a", name: "Mojito" });
  await vi.advanceTimersByTimeAsync(UNDO_MS - 1);
  expect(run).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(run).toHaveBeenCalledOnce();
  expect(pendingDelete.current).toBeNull();
});

test("undo cancels the delete", async () => {
  const run = vi.fn(async () => {});
  await pendingDelete.schedule("a", "Mojito", run);
  pendingDelete.undo();
  await vi.advanceTimersByTimeAsync(UNDO_MS * 2);
  expect(run).not.toHaveBeenCalled();
  expect(pendingDelete.current).toBeNull();
});

test("a second delete runs the first one immediately", async () => {
  const first = vi.fn(async () => {});
  const second = vi.fn(async () => {});
  await pendingDelete.schedule("a", "Mojito", first);
  await pendingDelete.schedule("b", "Negroni", second);
  expect(first).toHaveBeenCalledOnce();
  expect(pendingDelete.current?.id).toBe("b");
  await vi.advanceTimersByTimeAsync(UNDO_MS);
  expect(second).toHaveBeenCalledOnce();
});
