import { formatLine } from "./ingredients";
import type { Need } from "./match";
import type { Recipe } from "./recipes";
import { isUnit, toReadable } from "./units";

export interface Result {
  recipe: Recipe;
  /** Short or missing ingredients, in recipe order. */
  lacking: Need[];
  /** At home, but the amount couldn't be compared. */
  toCheck: Need[];
  /** Servings the fridge covers, when the recipe has servings and some amounts are comparable. */
  servings: number | null;
}

/** The scarcest comparable ingredient decides: half the needed eggs means half the servings. */
export function servingsCovered(needs: Need[], servings: number | null): number | null {
  const ratios = needs.flatMap((n) => n.ratio ?? []);
  if (!servings || ratios.length === 0) return null;
  return Math.min(...ratios.map((r) => Math.floor((r.num * servings) / r.den)));
}

/**
 * "Puoi farla": nothing lacking. "Quasi": something lacking but at least one ingredient at home,
 * fewest lacking first. Recipes with nothing to compare (no counted ingredients) are left out.
 */
export function groupResults(recipes: Recipe[], matches: Map<string, Need[]>): { ready: Result[]; almost: Result[] } {
  const ready: Result[] = [];
  const almost: Result[] = [];
  for (const recipe of recipes) {
    const needs = matches.get(recipe.id) ?? [];
    if (needs.length === 0) continue;
    const result = {
      recipe,
      lacking: needs.filter((n) => n.status === "short" || n.status === "missing"),
      toCheck: needs.filter((n) => n.status === "check"),
      servings: servingsCovered(needs, recipe.servings),
    };
    if (result.lacking.length === 0) ready.push(result);
    else if (needs.some((n) => n.status !== "missing")) almost.push(result);
  }
  almost.sort((a, b) => a.lacking.length - b.lacking.length || a.recipe.name.localeCompare(b.recipe.name, "it"));
  return { ready, almost };
}

/** "2 uova", "50 g pecorino", "vermouth" (when the amount is unknown). */
export function describeLacking(need: Need): string {
  const base = isUnit(need.unit) ? need.unit : null;
  if (!need.lacking || !base || base === "parte" || base === "qb") return need.name;
  const { qty, unit } = toReadable(need.lacking, base);
  return formatLine({ name: need.name, qty, unit, note: "", optional: false });
}
