import { expect, test } from "vitest";
import { fraction, formatFraction, parseQuantity } from "./fraction";
import { formatLine, getIngredients, listIngredientNames, saveIngredients, toStored, type IngredientLine } from "./ingredients";
import { createRecipe } from "./recipes";
import { testDb } from "./test-db";

const line = (name: string, qty: string, unit: IngredientLine["unit"], extra: Partial<IngredientLine> = {}): IngredientLine => ({
  name,
  qty: parseQuantity(qty),
  unit,
  note: "",
  optional: false,
  ...extra,
});

async function recipeIn(db = testDb()) {
  const id = await createRecipe(db, { name: "Test", servings: null, instructions: "", glassMl: null });
  return { db, id };
}

test("quantities parse as exact fractions", () => {
  expect(parseQuantity("30")).toEqual(fraction(30));
  expect(parseQuantity("1/4")).toEqual(fraction(1, 4));
  expect(parseQuantity("2/4")).toEqual(fraction(1, 2));
  expect(parseQuantity("1 1/2")).toEqual(fraction(3, 2));
  expect(parseQuantity("1,5")).toEqual(fraction(3, 2));
  expect(parseQuantity("0.25")).toEqual(fraction(1, 4));
  for (const bad of ["", "abc", "0", "1/0", "-1", "1/2/3"]) expect(parseQuantity(bad)).toBeNull();
  expect(formatFraction(fraction(3, 2))).toBe("1 1/2");
  expect(formatFraction(fraction(1, 4))).toBe("1/4");
});

test("quantities are stored in base units and kitchen units are remembered", () => {
  expect(toStored(line("farina", "1", "kg"))).toEqual({ qty: fraction(1000), unit: "g", displayUnit: null });
  expect(toStored(line("latte", "1/2", "l"))).toEqual({ qty: fraction(500), unit: "ml", displayUnit: null });
  expect(toStored(line("olio", "2", "cucchiaio"))).toEqual({ qty: fraction(30), unit: "ml", displayUnit: "cucchiaio" });
  expect(toStored(line("limone", "1", null))).toEqual({ qty: fraction(1), unit: "pz", displayUnit: null });
  expect(toStored(line("sale", "5", "qb"))).toEqual({ qty: null, unit: "qb", displayUnit: null });
  expect(toStored(line("basilico", "", null))).toEqual({ qty: null, unit: null, displayUnit: null });
});

test("saved lines read back in the unit the user chose, in order", async () => {
  const { db, id } = await recipeIn();
  const lines = [
    line("Malibu", "1/4", "parte"),
    line("Succo d'arancia", "2/4", "parte"),
    line("Olio", "1/2", "cucchiaio"),
    line("Latte", "100", "ml", { note: "freddo", optional: true }),
    line("Sale", "", "qb"),
  ];
  await saveIngredients(db, id, lines);
  expect(await getIngredients(db, id)).toEqual([
    { ...lines[0], qty: fraction(1, 4) },
    { ...lines[1], qty: fraction(1, 2) },
    lines[2],
    lines[3],
    lines[4],
  ]);
  const [{ qty_num, qty_den }] = db.raw.prepare("SELECT qty_num, qty_den FROM recipe_ingredient WHERE display_unit = 'cucchiaio'").all();
  expect([qty_num, qty_den]).toEqual([15, 2]);
});

test("saving replaces previous lines and blank rows are skipped", async () => {
  const { db, id } = await recipeIn();
  await saveIngredients(db, id, [line("Uova", "2", null), line("Pecorino", "50", "g")]);
  await saveIngredients(db, id, [line("Guanciale", "100", "g"), line("   ", "1", "g")]);
  expect((await getIngredients(db, id)).map((l) => l.name)).toEqual(["Guanciale"]);
  await saveIngredients(db, id, []);
  expect(await getIngredients(db, id)).toEqual([]);
});

test("ingredients are shared across recipes ignoring case", async () => {
  const { db, id } = await recipeIn();
  const other = (await recipeIn(db)).id;
  await saveIngredients(db, id, [line("Zucchero", "30", "g")]);
  await saveIngredients(db, other, [line("zucchero ", "1", "cucchiaino")]);
  expect(await listIngredientNames(db)).toEqual(["Zucchero"]);
  expect((await getIngredients(db, other))[0].name).toBe("Zucchero");
});

test("lines are formatted for reading", () => {
  expect(formatLine(line("zucchero", "30", "g"))).toBe("30 g zucchero");
  expect(formatLine(line("olio", "2", "cucchiaio"))).toBe("2 cucchiai olio");
  expect(formatLine(line("uova", "2", "pz"))).toBe("2 uova");
  expect(formatLine(line("Malibu", "1/4", "parte"))).toBe("1/4 parte Malibu");
  expect(formatLine(line("sale", "", "qb"))).toBe("sale q.b.");
  expect(formatLine(line("basilico", "", null))).toBe("basilico");
});
