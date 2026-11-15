import { expect, test } from "vitest";
import { filterFromUrl, filterRecipes, filterToUrl, ftsQuery, searchRecipeIds } from "./filter";
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
  return { db, recipes: await listRecipes(db), tags: await tagsByRecipe(db), tagId };
}

const names = (rs: { name: string }[]) => rs.map((r) => r.name);

test("no filter keeps everything", async () => {
  const { recipes, tags } = await setup();
  expect(names(filterRecipes(recipes, tags, { query: "", tagIds: [], favoritesOnly: false }))).toEqual(["Mojito", "Negroni", "Tiramisù"]);
});

test("selected tags must all match", async () => {
  const { recipes, tags, tagId } = await setup();
  expect(names(filterRecipes(recipes, tags, { query: "", tagIds: [tagId.Cocktail], favoritesOnly: false }))).toEqual(["Mojito", "Negroni"]);
  expect(names(filterRecipes(recipes, tags, { query: "", tagIds: [tagId.Cocktail, tagId.Estivi], favoritesOnly: false }))).toEqual(["Mojito"]);
  expect(filterRecipes(recipes, tags, { query: "", tagIds: [tagId.Cocktail, tagId.Dolci], favoritesOnly: false })).toEqual([]);
});

test("favorites only, alone or with tags", async () => {
  const { recipes, tags, tagId } = await setup();
  expect(names(filterRecipes(recipes, tags, { query: "", tagIds: [], favoritesOnly: true }))).toEqual(["Negroni"]);
  expect(filterRecipes(recipes, tags, { query: "", tagIds: [tagId.Dolci], favoritesOnly: true })).toEqual([]);
});

test("filter round-trips through the URL", () => {
  const filter = { query: "pasta fresca", tagIds: [3, 7], favoritesOnly: true };
  expect(filterToUrl(filter)).toBe("?q=pasta+fresca&tag=3&tag=7&fav=1");
  expect(filterFromUrl(new URLSearchParams(filterToUrl(filter)))).toEqual(filter);
  expect(filterToUrl({ query: "", tagIds: [], favoritesOnly: false })).toBe("");
  expect(filterFromUrl(new URLSearchParams("tag=abc&tag=2"))).toEqual({ query: "", tagIds: [2], favoritesOnly: false });
});

test("search words become quoted FTS prefixes", () => {
  expect(ftsQuery("Spag  carb")).toBe('"spag"* "carb"*');
  expect(ftsQuery('caffè" OR *')).toBe('"caffè"* "or"*');
  expect(ftsQuery("  ")).toBeNull();
});

test("name search matches word prefixes, ignores accents and combines with filters", async () => {
  const { db, recipes, tags, tagId } = await setup();
  const search = async (text: string) => names(filterRecipes(recipes, tags, { query: text, tagIds: [], favoritesOnly: false }, await searchRecipeIds(db, text)));
  expect(await search("neg")).toEqual(["Negroni"]);
  expect(await search("tiramisu")).toEqual(["Tiramisù"]);
  expect(await search("xyz")).toEqual([]);
  expect(await search("")).toEqual(["Mojito", "Negroni", "Tiramisù"]);
  const mo = await searchRecipeIds(db, "mo");
  expect(names(filterRecipes(recipes, tags, { query: "mo", tagIds: [tagId.Estivi], favoritesOnly: false }, mo))).toEqual(["Mojito"]);
  expect(filterRecipes(recipes, tags, { query: "mo", tagIds: [], favoritesOnly: true }, mo)).toEqual([]);
});
