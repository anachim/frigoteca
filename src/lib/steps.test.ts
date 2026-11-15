import { expect, test } from "vitest";
import { splitSteps } from "./steps";

test("instructions split into steps without list markers", () => {
  expect(splitSteps("1. Bolli l'acqua\n2) Cuoci la pasta\n\n- Manteca\r\n• Servi\n  Impiatta  ")).toEqual([
    "Bolli l'acqua",
    "Cuoci la pasta",
    "Manteca",
    "Servi",
    "Impiatta",
  ]);
  expect(splitSteps("Cuoci 10 minuti a 180 gradi\n2.5 kg di patate")).toEqual([
    "Cuoci 10 minuti a 180 gradi",
    "2.5 kg di patate",
  ]);
  expect(splitSteps("  \n\n")).toEqual([]);
});
