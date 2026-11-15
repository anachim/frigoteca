import { expect, test } from "vitest";
import { listFridge, putInFridge } from "./fridge";
import { formatLine, saveIngredients } from "./ingredients";
import { matchAll } from "./match";
import { parseLine } from "./parse-line";
import { createRecipe } from "./recipes";
import { addLacking, addLine, clearDone, listShopping, moveDoneToFridge, setDone } from "./shopping";
import { testDb } from "./test-db";

type TestDb = ReturnType<typeof testDb>;
const add = (db: TestDb, text: string) => addLine(db, parseLine(text)!);
const shown = async (db: TestDb) => (await listShopping(db)).map((i) => formatLine(i.line) + (i.done ? " ✓" : ""));

test("typed lines are listed readably and repeated items add up", async () => {
  const db = testDb();
  await add(db, "500 g farina");
  await add(db, "1 kg farina");
  await add(db, "2 uova");
  await add(db, "carta da forno");
  await add(db, "Carta da forno");
  expect(await shown(db)).toEqual(["carta da forno", "1,5 kg farina", "2 uova"]);
});

test("known ingredients are linked, other text stays free", async () => {
  const db = testDb();
  await putInFridge(db, parseLine("uova")!);
  await add(db, "6 Uova");
  await add(db, "carta da forno");
  const items = await listShopping(db);
  expect(items.map((i) => [i.line.name, i.ingredientId !== null])).toEqual([
    ["carta da forno", false],
    ["uova", true],
  ]);
});

test("lacking ingredients from fridge results go on the list with the missing amount", async () => {
  const db = testDb();
  const id = await createRecipe(db, { name: "Carbonara", servings: null, instructions: "", glassMl: null });
  await saveIngredients(db, id, ["4 uova", "50 g pecorino", "pepe"].map((l) => parseLine(l)!));
  await putInFridge(db, parseLine("1 uova")!);
  const needs = (await matchAll(db)).get(id)!.filter((n) => n.status === "short" || n.status === "missing");
  await addLacking(db, needs);
  expect(await shown(db)).toEqual(["50 g pecorino", "pepe", "3 uova"]);
});

test("bought items move to the fridge, adding to what is there", async () => {
  const db = testDb();
  await putInFridge(db, parseLine("2 uova")!);
  await add(db, "6 uova");
  await add(db, "200 g burro");
  await add(db, "carta da forno");
  await add(db, "latte");
  for (const item of await listShopping(db)) if (item.line.name !== "latte") await setDone(db, item.id, true);
  expect(await shown(db)).toEqual(["latte", "200 g burro ✓", "carta da forno ✓", "6 uova ✓"]);

  await moveDoneToFridge(db);
  expect(await shown(db)).toEqual(["latte"]);
  expect((await listFridge(db)).map((i) => formatLine(i.line))).toEqual(["200 g burro", "carta da forno", "8 uova"]);
});

test("bought items can also just be cleared", async () => {
  const db = testDb();
  await add(db, "pane");
  const [item] = await listShopping(db);
  await setDone(db, item.id, true);
  await clearDone(db);
  expect(await listShopping(db)).toEqual([]);
});
