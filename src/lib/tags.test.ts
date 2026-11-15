import { expect, test } from "vitest";
import { createRecipe, deleteRecipe } from "./recipes";
import { deleteTag, getRecipeTags, listTags, setRecipeTags, tagsByRecipe, updateTag } from "./tags";
import { testDb } from "./test-db";

async function setup() {
  const db = testDb();
  const recipe = (name: string) => createRecipe(db, { name, servings: null, instructions: "", glassMl: null });
  return { db, a: await recipe("Mojito"), b: await recipe("Tiramisù") };
}

const names = (tags: { name: string }[]) => tags.map((t) => t.name);

test("tags are created on the fly, shared and matched ignoring case", async () => {
  const { db, a, b } = await setup();
  await setRecipeTags(db, a, ["Cocktail", "Veloci", " ", "cocktail"]);
  await setRecipeTags(db, b, ["dolci", "veloci"]);
  expect(names(await listTags(db))).toEqual(["Cocktail", "dolci", "Veloci"]);
  expect(names(await getRecipeTags(db, b))).toEqual(["dolci", "Veloci"]);
});

test("setting tags replaces the previous ones", async () => {
  const { db, a } = await setup();
  await setRecipeTags(db, a, ["Cocktail", "Veloci"]);
  await setRecipeTags(db, a, ["Estivi", "Cocktail"]);
  expect(names(await getRecipeTags(db, a))).toEqual(["Cocktail", "Estivi"]);
  await setRecipeTags(db, a, []);
  expect(await getRecipeTags(db, a)).toEqual([]);
  expect(names(await listTags(db))).toEqual(["Cocktail", "Estivi", "Veloci"]);
});

test("tags by recipe groups every recipe's tags", async () => {
  const { db, a, b } = await setup();
  await setRecipeTags(db, a, ["Cocktail"]);
  await setRecipeTags(db, b, ["Dolci", "Veloci"]);
  const map = await tagsByRecipe(db);
  expect(names(map.get(a)!)).toEqual(["Cocktail"]);
  expect(names(map.get(b)!)).toEqual(["Dolci", "Veloci"]);
});

test("tags can be renamed, coloured and deleted", async () => {
  const { db, a } = await setup();
  await setRecipeTags(db, a, ["Cocktail", "Dolci"]);
  const [cocktail, dolci] = await listTags(db);

  expect(await updateTag(db, { ...cocktail, name: "Drink", color: "#ff8800", icon: " 🍹 " })).toBeNull();
  expect(await updateTag(db, { ...dolci, name: "drink" })).toBe('Esiste già un tag "drink"');
  expect(await updateTag(db, { ...dolci, name: "  " })).not.toBeNull();
  expect(await getRecipeTags(db, a)).toEqual([
    { ...dolci },
    { id: cocktail.id, name: "Drink", color: "#ff8800", icon: "🍹" },
  ]);

  await deleteTag(db, dolci.id);
  expect(names(await getRecipeTags(db, a))).toEqual(["Drink"]);
  await deleteRecipe(db, a);
  expect(names(await listTags(db))).toEqual(["Drink"]);
});
