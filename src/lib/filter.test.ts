import { expect, test } from "vitest";
import { filterFromUrl, filterRecipes, filterToUrl } from "./filter";
import { createRecipe, listRecipes, setFavorite } from "./recipes";
import { listTags, setRecipeTags, tagsByRecipe } from "./tags";
import { testDb } from "./test-db";

async function setup() {
  const db = testDb();
  const add = async (name: string, tags: string[]) => {
    const id = await createRecipe(db, { name, servings: null, instructions: "", glassMl: null });
    await setRecipeTags(db, id, tags);
    return id;
  };
  await add("Mojito", ["Cocktail", "Estivi"]);
  const negroni = await add("Negroni", ["Cocktail"]);
  await add("Tiramisù", ["Dolci"]);
  await setFavorite(db, negroni, true);
  const tagId = Object.fromEntries((await listTags(db)).map((t) => [t.name, t.id]));
  return { recipes: await listRecipes(db), tags: await tagsByRecipe(db), tagId };
}

const names = (rs: { name: string }[]) => rs.map((r) => r.name);

test("no filter keeps everything", async () => {
  const { recipes, tags } = await setup();
  expect(names(filterRecipes(recipes, tags, { tagIds: [], favoritesOnly: false }))).toEqual(["Mojito", "Negroni", "Tiramisù"]);
});

test("selected tags must all match", async () => {
  const { recipes, tags, tagId } = await setup();
  expect(names(filterRecipes(recipes, tags, { tagIds: [tagId.Cocktail], favoritesOnly: false }))).toEqual(["Mojito", "Negroni"]);
  expect(names(filterRecipes(recipes, tags, { tagIds: [tagId.Cocktail, tagId.Estivi], favoritesOnly: false }))).toEqual(["Mojito"]);
  expect(filterRecipes(recipes, tags, { tagIds: [tagId.Cocktail, tagId.Dolci], favoritesOnly: false })).toEqual([]);
});

test("favorites only, alone or with tags", async () => {
  const { recipes, tags, tagId } = await setup();
  expect(names(filterRecipes(recipes, tags, { tagIds: [], favoritesOnly: true }))).toEqual(["Negroni"]);
  expect(filterRecipes(recipes, tags, { tagIds: [tagId.Dolci], favoritesOnly: true })).toEqual([]);
});

test("filter round-trips through the URL", () => {
  const filter = { tagIds: [3, 7], favoritesOnly: true };
  expect(filterToUrl(filter)).toBe("?tag=3&tag=7&fav=1");
  expect(filterFromUrl(new URLSearchParams(filterToUrl(filter)))).toEqual(filter);
  expect(filterToUrl({ tagIds: [], favoritesOnly: false })).toBe("");
  expect(filterFromUrl(new URLSearchParams("tag=abc&tag=2"))).toEqual({ tagIds: [2], favoritesOnly: false });
});
