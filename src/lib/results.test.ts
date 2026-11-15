import { expect, test } from "vitest";
import { putInFridge } from "./fridge";
import { saveIngredients } from "./ingredients";
import { matchAll } from "./match";
import { parseLine } from "./parse-line";
import { createRecipe, listRecipes } from "./recipes";
import { describeLacking, groupResults, servingsCovered } from "./results";
import { testDb } from "./test-db";

async function setup(fridgeLines: string[]) {
  const db = testDb();
  const recipe = async (name: string, lines: string[]) => {
    const id = await createRecipe(db, { name, servings: null, instructions: "", glassMl: null });
    await saveIngredients(db, id, lines.map((l) => parseLine(l)!));
  };
  await recipe("Carbonara", ["320 g spaghetti", "4 uova", "50 g pecorino", "100 g guanciale"]);
  await recipe("Frittata", ["4 uova", "parmigiano"]);
  await recipe("Uova sode", ["2 uova"]);
  await recipe("Tiramisù", ["250 g mascarpone", "savoiardi"]);
  await recipe("Senza ingredienti", []);
  for (const l of fridgeLines) await putInFridge(db, parseLine(l)!);
  return groupResults(await listRecipes(db), await matchAll(db));
}

const names = (rs: { recipe: { name: string } }[]) => rs.map((r) => r.recipe.name);

test("recipes split into ready and almost, fewest lacking first", async () => {
  const { ready, almost } = await setup(["1 kg spaghetti", "2 uova", "parmigiano"]);
  expect(names(ready)).toEqual(["Uova sode"]);
  expect(names(almost)).toEqual(["Frittata", "Carbonara"]);
  expect(almost[1].lacking.map(describeLacking)).toEqual(["2 uova", "50 g pecorino", "100 g guanciale"]);
});

test("recipes with nothing at home or nothing to compare are left out", async () => {
  const { ready, almost } = await setup([]);
  expect(ready).toEqual([]);
  expect(almost).toEqual([]);
});

test("amounts that can't be compared still count as ready, flagged to check", async () => {
  const { ready } = await setup(["uova", "parmigiano"]);
  expect(names(ready)).toEqual(["Frittata", "Uova sode"]);
  expect(ready[0].toCheck.map((n) => n.name)).toEqual(["uova"]);
});

test("lacking amounts read in the best unit", () => {
  const need = { ingredientId: 1, name: "farina", status: "short" as const, unit: "g", lacking: { num: 1500, den: 1 }, ratio: null };
  expect(describeLacking(need)).toBe("1,5 kg farina");
  expect(describeLacking({ ...need, unit: "parte", lacking: null })).toBe("farina");
  expect(describeLacking({ ...need, name: "uova", unit: "pz", lacking: { num: 2, den: 1 } })).toBe("2 uova");
});

test("servings covered follow the scarcest comparable ingredient", async () => {
  const db = testDb();
  const id = await createRecipe(db, { name: "Carbonara", servings: 4, instructions: "", glassMl: null });
  await saveIngredients(db, id, ["400 g spaghetti", "4 uova", "pepe"].map((l) => parseLine(l)!));
  for (const l of ["1 kg spaghetti", "6 uova", "pepe"]) await putInFridge(db, parseLine(l)!);
  const { ready } = groupResults(await listRecipes(db), await matchAll(db));
  expect(ready[0].servings).toBe(6);

  const ratio = (num: number, den = 1) => ({ ingredientId: 1, name: "x", status: "ok" as const, unit: "g", lacking: null, ratio: { num, den } });
  expect(servingsCovered([ratio(3, 2), ratio(5, 4)], 2)).toBe(2);
  expect(servingsCovered([ratio(1, 3)], 4)).toBe(1);
  expect(servingsCovered([ratio(2)], null)).toBeNull();
  expect(servingsCovered([{ ...ratio(2), ratio: null }], 4)).toBeNull();
});
