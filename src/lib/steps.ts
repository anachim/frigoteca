/**
 * Splits instructions into steps for cooking mode: one step per non-empty line, dropping list markers
 * such as "1. ", "2) ", "- " or "• " that people type or paste. A marker needs a space after it, so
 * "2.5 kg di patate" stays intact.
 */
export const splitSteps = (instructions: string): string[] =>
  instructions
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^(\d+[.)]|[-•*])\s+/, "").trim())
    .filter(Boolean);
