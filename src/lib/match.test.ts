import { expect, test } from "vitest";
import { putInFridge } from "./fridge";
import { ensureIngredient, saveIngredients } from "./ingredients";
import { matchAll, setPantry } from "./match";
import { parseLine } from "./parse-line";
import { createRecipe } from "./recipes";
import { testDb } from "./test-db";

type TestDb = ReturnType<typeof testDb>;

async function recipe(db: TestDb, name: string, lines: string[], glassMl: number | null = null) {
  const id = await createRecipe(db, { name, servings: null, instructions: "", glassMl });
  await saveIngredients(db, id, lines.map((l) => parseLine(l)!));
  return id;
}

const fridge = async (db: TestDb, ...lines: string[]) => {
  for (const l of lines) await putInFridge(db, parseLine(l)!);
};

const statuses = async (db: TestDb, id: string) =>
  ((await matchAll(db)).get(id) ?? []).map((n) => [n.name, n.status, n.lacking && `${n.lacking.num}/${n.lacking.den}`, n.unit]);

test("enough, short and missing in the same unit", async () => {
  const db = testDb();
  const id = await recipe(db, "Carbonara", ["320 g spaghetti", "4 uova", "100 g guanciale"]);
  await fridge(db, "1 kg spaghetti", "2 uova");
  expect(await statuses(db, id)).toEqual([
    ["spaghetti", "ok", null, "g"],
    ["uova", "short", "2/1", "pz"],
    ["guanciale", "missing", "100/1", "g"],
  ]);
});

test("amounts that can't be compared need a check", async () => {
  const db = testDb();
  const id = await recipe(db, "Torta", ["200 g latte", "3 uova"]);
  await fridge(db, "1 l latte", "uova");
  expect(await statuses(db, id)).toEqual([
    ["latte", "check", null, "g"],
    ["uova", "check", null, "pz"],
  ]);
});

test("recipes without amounts only need the ingredient at home", async () => {
  const db = testDb();
  const id = await recipe(db, "Insalata", ["lattuga", "sale qb"]);
  await fridge(db, "lattuga", "100 g sale");
  expect(await statuses(db, id)).toEqual([
    ["lattuga", "ok", null, null],
    ["sale", "ok", null, "qb"],
  ]);
});

test("optional and pantry ingredients are not counted", async () => {
  const db = testDb();
  const id = await recipe(db, "Pasta", ["100 g pasta", "sale qb", "basilico"]);
  await saveIngredients(db, id, [parseLine("100 g pasta")!, parseLine("sale qb")!, { ...parseLine("basilico")!, optional: true }]);
  await setPantry(db, await ensureIngredient(db, "sale"), true);
  expect(await statuses(db, id)).toEqual([["pasta", "missing", "100/1", "g"]]);
});

test("cocktail parts become ml with a glass size, presence only without", async () => {
  const db = testDb();
  const withGlass = await recipe(db, "Malibu orange", ["1/4 parte malibu", "3/4 parte succo d'arancia"], 200);
  const noGlass = await recipe(db, "Negroni", ["1 parte gin", "1 parte vermouth"]);
  await fridge(db, "100 ml malibu", "100 ml succo d'arancia", "gin");
  expect(await statuses(db, withGlass)).toEqual([
    ["malibu", "ok", null, "ml"],
    ["succo d'arancia", "short", "50/1", "ml"],
  ]);
  expect(await statuses(db, noGlass)).toEqual([
    ["gin", "ok", null, "parte"],
    ["vermouth", "missing", null, "parte"],
  ]);
});

test("recipes without ingredients are listed with no needs", async () => {
  const db = testDb();
  const id = await createRecipe(db, { name: "Vuota", servings: null, instructions: "", glassMl: null });
  expect((await matchAll(db)).get(id)).toEqual([]);
});
