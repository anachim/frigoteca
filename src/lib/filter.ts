import type { Recipe } from "./recipes";
import type { Tag } from "./tags";

export interface RecipeFilter {
  /** Recipes must have every one of these tags. */
  tagIds: number[];
  favoritesOnly: boolean;
}

export function filterRecipes(recipes: Recipe[], tags: Map<string, Tag[]>, filter: RecipeFilter): Recipe[] {
  return recipes.filter((r) => {
    if (filter.favoritesOnly && !r.favorite) return false;
    const own = new Set((tags.get(r.id) ?? []).map((t) => t.id));
    return filter.tagIds.every((id) => own.has(id));
  });
}

/** The filter lives in the URL (?tag=1&tag=2&fav=1) so back navigation keeps it. */
export const filterFromUrl = (params: URLSearchParams): RecipeFilter => ({
  tagIds: params.getAll("tag").map(Number).filter(Number.isInteger),
  favoritesOnly: params.get("fav") === "1",
});

export function filterToUrl(filter: RecipeFilter): string {
  const params = new URLSearchParams();
  for (const id of filter.tagIds) params.append("tag", String(id));
  if (filter.favoritesOnly) params.set("fav", "1");
  const query = params.toString();
  return query ? `?${query}` : "";
}
