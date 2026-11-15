import { expect, test } from "vitest";
import { ingredientsByUse, listFridge, putInFridge, removeFromFridge } from "./fridge";
import { formatLine, saveIngredients } from "./ingredients";
import { parseLine } from "./parse-line";
import { createRecipe } from "./recipes";
import { testDb } from "./test-db";

const put = (db: ReturnType<typeof testDb>, text: string) => putInFridge(db, parseLine(text)!);
const shown = async (db: ReturnType<typeof testDb>) => (await listFridge(db)).map((i) => formatLine(i.line));

test("fridge keeps quantities in base units and shows them readably", async () => {
  const db = testDb();
  await put(db, "1500 g farina");
  await put(db, "1/2 l latte");
  await put(db, "6 uova");
  await put(db, "2 cucchiai olio");
  await put(db, "limone");
  expect(await shown(db)).toEqual(["1,5 kg farina", "500 ml latte", "limone", "30 ml olio", "6 uova"]);
});

test("putting the same ingredient again replaces its quantity, ignoring case", async () => {
  const db = testDb();
  await put(db, "500 g Farina");
  await put(db, "200 g farina");
  expect(await shown(db)).toEqual(["200 g Farina"]);
  await put(db, "farina");
  expect(await shown(db)).toEqual(["Farina"]);
});

test("proportions and q.b. just mean the ingredient is there", async () => {
  const db = testDb();
  await put(db, "1 parte gin");
  await put(db, "sale qb");
  expect(await shown(db)).toEqual(["gin", "sale"]);
});

test("items can be removed", async () => {
  const db = testDb();
  await put(db, "6 uova");
  const [item] = await listFridge(db);
  await removeFromFridge(db, item.ingredientId);
  expect(await listFridge(db)).toEqual([]);
});

test("ingredients are ordered by how many recipes use them", async () => {
  const db = testDb();
  const recipe = (name: string) => createRecipe(db, { name, servings: null, instructions: "", glassMl: null });
  await saveIngredients(db, await recipe("Carbonara"), [parseLine("2 uova")!, parseLine("pecorino")!]);
  await saveIngredients(db, await recipe("Frittata"), [parseLine("4 uova")!]);
  await put(db, "zucchine");
  expect((await ingredientsByUse(db)).map((i) => [i.name, i.uses])).toEqual([
    ["uova", 2],
    ["pecorino", 1],
    ["zucchine", 0],
  ]);
});
