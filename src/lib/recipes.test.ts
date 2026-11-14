import { expect, test } from "vitest";
import { createRecipe, deleteRecipe, getRecipe, listRecipes, updateRecipe, validateRecipe, type RecipeInput } from "./recipes";
import { testDb } from "./test-db";

const carbonara: RecipeInput = { name: "  Carbonara ", servings: 4, instructions: "Cuoci la pasta.\n", glassMl: null };

test("create, read, update and delete a recipe", async () => {
  const db = testDb();
  const id = await createRecipe(db, carbonara, "r1", "2026-01-01T00:00:00Z");

  expect(await getRecipe(db, id)).toEqual({
    id: "r1",
    name: "Carbonara",
    servings: 4,
    instructions: "Cuoci la pasta.",
    glassMl: null,
    favorite: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  });

  await updateRecipe(db, id, { name: "Mojito", servings: null, instructions: "", glassMl: 300 }, "2026-01-02T00:00:00Z");
  const updated = await getRecipe(db, id);
  expect(updated).toMatchObject({ name: "Mojito", servings: null, glassMl: 300, updatedAt: "2026-01-02T00:00:00Z" });
  expect(updated?.createdAt).toBe("2026-01-01T00:00:00Z");

  await deleteRecipe(db, id);
  expect(await getRecipe(db, id)).toBeUndefined();
});

test("list is sorted by name ignoring case", async () => {
  const db = testDb();
  for (const name of ["tiramisù", "Amatriciana", "carbonara"]) {
    await createRecipe(db, { ...carbonara, name });
  }
  expect((await listRecipes(db)).map((r) => r.name)).toEqual(["Amatriciana", "carbonara", "tiramisù"]);
});

test("generated ids are unique UUIDs", async () => {
  const db = testDb();
  const a = await createRecipe(db, carbonara);
  const b = await createRecipe(db, carbonara);
  expect(a).toMatch(/^[0-9a-f-]{36}$/);
  expect(a).not.toBe(b);
});

test("invalid input is rejected and nothing is saved", async () => {
  const db = testDb();
  expect(validateRecipe({ ...carbonara, name: "   " })).toBe("Il nome è obbligatorio");
  expect(validateRecipe({ ...carbonara, servings: 0 })).not.toBeNull();
  expect(validateRecipe({ ...carbonara, servings: 1.5 })).not.toBeNull();
  expect(validateRecipe({ ...carbonara, glassMl: -1 })).not.toBeNull();
  await expect(createRecipe(db, { ...carbonara, name: "" })).rejects.toThrow("Il nome è obbligatorio");
  expect(await listRecipes(db)).toEqual([]);
});
