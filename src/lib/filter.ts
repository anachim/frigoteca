import type { Db, Recipe } from "./recipes";
import type { Tag } from "./tags";

export interface RecipeFilter {
  /** Text typed in the search box; matched against recipe names. */
  query: string;
  /** Recipes must have every one of these tags. */
  tagIds: number[];
  favoritesOnly: boolean;
}

export const emptyFilter: RecipeFilter = { query: "", tagIds: [], favoritesOnly: false };

/**
 * Turns typed text into an FTS5 query where every word must match as a prefix:
 * "spag carb" finds "Spaghetti alla carbonara". Words are quoted so FTS syntax in the input is inert.
 */
export function ftsQuery(text: string): string | null {
  const words = text.toLocaleLowerCase("it").match(/[\p{L}\p{N}]+/gu);
  return words ? words.map((w) => `"${w}"*`).join(" ") : null;
}

/** Ids of recipes whose name matches the text (accents ignored), or null when there is nothing to search. */
export async function searchRecipeIds(db: Db, text: string): Promise<Set<string> | null> {
  const q = ftsQuery(text);
  if (!q) return null;
  const rows = await db.select<{ id: string }[]>(
    "SELECT r.id FROM recipe_fts JOIN recipe r ON r.rowid = recipe_fts.rowid WHERE recipe_fts MATCH ?",
    [q],
  );
  return new Set(rows.map((r) => r.id));
}

/** `matches` is the result of searchRecipeIds for filter.query; null means no text search. */
export function filterRecipes(
  recipes: Recipe[],
  tags: Map<string, Tag[]>,
  filter: RecipeFilter,
  matches: Set<string> | null = null,
): Recipe[] {
  return recipes.filter((r) => {
    if (matches && !matches.has(r.id)) return false;
    if (filter.favoritesOnly && !r.favorite) return false;
    const own = new Set((tags.get(r.id) ?? []).map((t) => t.id));
    return filter.tagIds.every((id) => own.has(id));
  });
}

/** The filter lives in the URL (?q=pasta&tag=1&tag=2&fav=1) so back navigation keeps it. */
export const filterFromUrl = (params: URLSearchParams): RecipeFilter => ({
  query: params.get("q") ?? "",
  tagIds: params.getAll("tag").map(Number).filter(Number.isInteger),
  favoritesOnly: params.get("fav") === "1",
});

export function filterToUrl(filter: RecipeFilter): string {
  const params = new URLSearchParams();
  if (filter.query) params.set("q", filter.query);
  for (const id of filter.tagIds) params.append("tag", String(id));
  if (filter.favoritesOnly) params.set("fav", "1");
  const query = params.toString();
  return query ? `?${query}` : "";
}
