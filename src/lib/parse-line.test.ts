import { expect, test } from "vitest";
import { fraction } from "./fraction";
import { parseLine, parseLines } from "./parse-line";

const l = (name: string, qty: [number, number?] | null, unit: string | null, note = "") => ({
  name,
  qty: qty && fraction(qty[0], qty[1] ?? 1),
  unit,
  note,
  optional: false,
});

test.each([
  ["30 g zucchero", l("zucchero", [30], "g")],
  ["100ml latte", l("latte", [100], "ml")],
  ["1 kg di farina", l("farina", [1], "kg")],
  ["1/2 l d'acqua", l("acqua", [1, 2], "l")],
  ["4 cl gin", l("gin", [4], "cl")],
  ["2 cucchiai olio", l("olio", [2], "cucchiaio")],
  ["1 cucchiaino zucchero", l("zucchero", [1], "cucchiaino")],
  ["1/4 parte Malibu", l("Malibu", [1, 4], "parte")],
  ["2/4 parti succo d'arancia", l("succo d'arancia", [1, 2], "parte")],
  ["1 limone", l("limone", [1], null)],
  ["2 uova", l("uova", [2], null)],
  ["1 1/2 tazze farina", l("farina", [3, 2], "tazza")],
  ["1,5 kg patate", l("patate", [3, 2], "kg")],
  ["sale qb", l("sale", null, "qb")],
  ["Pepe q.b.", l("Pepe", null, "qb")],
  ["basilico", l("basilico", null, null)],
  ["3 pomodori, a fette", l("pomodori", [3], null, "a fette")],
  ["200 g guanciale (o pancetta)", l("guanciale", [200], "g", "o pancetta")],
  ["- 50 g pecorino", l("pecorino", [50], "g")],
  ["2 grandi patate", l("grandi patate", [2], null)],
  ["1 lime", l("lime", [1], null)],
])("%s", (text, expected) => {
  expect(parseLine(text)).toEqual(expected);
});

test("lines without a name are ignored", () => {
  expect(parseLine("")).toBeNull();
  expect(parseLine("30 g")).toBeNull();
  expect(parseLine("qb")).toBeNull();
});

test("a pasted list gives one ingredient per line", () => {
  expect(parseLines("Ingredienti:\n\n200 g spaghetti\r\n2 uova\nsale qb\n").map((x) => x.name)).toEqual([
    "spaghetti",
    "uova",
    "sale",
  ]);
});
