import type { Db } from "./recipes";

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

const byName = "ORDER BY name COLLATE NOCASE";

export const listTags = (db: Db) => db.select<Tag[]>(`SELECT id, name, color, icon FROM tag ${byName}`);

export const getRecipeTags = (db: Db, recipeId: string) =>
  db.select<Tag[]>(
    `SELECT t.id, t.name, t.color, t.icon FROM tag t JOIN recipe_tag rt ON rt.tag_id = t.id
     WHERE rt.recipe_id = ? ${byName}`,
    [recipeId],
  );

/** Tags of every recipe, for the recipe list. */
export async function tagsByRecipe(db: Db): Promise<Map<string, Tag[]>> {
  const rows = await db.select<(Tag & { recipe_id: string })[]>(
    `SELECT rt.recipe_id, t.id, t.name, t.color, t.icon FROM tag t JOIN recipe_tag rt ON rt.tag_id = t.id ${byName}`,
  );
  const map = new Map<string, Tag[]>();
  for (const { recipe_id, ...tag } of rows) map.set(recipe_id, [...(map.get(recipe_id) ?? []), tag]);
  return map;
}

/** Sets exactly these tags on a recipe, creating unknown names (case-insensitive match). */
export async function setRecipeTags(db: Db, recipeId: string, names: string[]): Promise<void> {
  const ids: number[] = [];
  for (const name of new Set(names.map((n) => n.trim()).filter(Boolean))) {
    await db.execute("INSERT INTO tag (name) VALUES (?) ON CONFLICT (name) DO NOTHING", [name]);
    const [row] = await db.select<{ id: number }[]>("SELECT id FROM tag WHERE name = ?", [name]);
    ids.push(row.id);
  }
  // Add first, then remove: an interruption leaves extra tags, never a recipe that lost them.
  for (const id of ids) {
    await db.execute("INSERT OR IGNORE INTO recipe_tag (recipe_id, tag_id) VALUES (?, ?)", [recipeId, id]);
  }
  await db.execute(
    `DELETE FROM recipe_tag WHERE recipe_id = ? AND tag_id NOT IN (${ids.map(() => "?").join(", ")})`,
    [recipeId, ...ids],
  );
}

/** Returns a user-facing error message, or null when saved. */
export async function updateTag(db: Db, tag: Tag): Promise<string | null> {
  const name = tag.name.trim();
  if (!name) return "Il nome del tag è obbligatorio";
  const [clash] = await db.select<{ id: number }[]>("SELECT id FROM tag WHERE name = ? AND id <> ?", [name, tag.id]);
  if (clash) return `Esiste già un tag "${name}"`;
  await db.execute("UPDATE tag SET name = ?, color = ?, icon = ? WHERE id = ?", [
    name,
    tag.color || null,
    tag.icon?.trim() || null,
    tag.id,
  ]);
  return null;
}

export const deleteTag = (db: Db, id: number) => db.execute("DELETE FROM tag WHERE id = ?", [id]);
