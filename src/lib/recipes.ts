export interface Db {
  select<T>(sql: string, args?: unknown[]): Promise<T>;
  execute(sql: string, args?: unknown[]): Promise<unknown>;
}

export interface RecipeInput {
  name: string;
  servings: number | null;
  instructions: string;
  glassMl: number | null;
}

export interface Recipe extends RecipeInput {
  id: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecipeRow {
  id: string;
  name: string;
  instructions: string | null;
  servings: number | null;
  glass_ml: number | null;
  favorite: number;
  created_at: string;
  updated_at: string;
}

const toRecipe = (row: RecipeRow): Recipe => ({
  id: row.id,
  name: row.name,
  instructions: row.instructions ?? "",
  servings: row.servings,
  glassMl: row.glass_ml,
  favorite: row.favorite === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const isPositiveInt = (n: number | null) => n === null || (Number.isInteger(n) && n > 0);

/** Returns a user-facing error message, or null when the input is valid. */
export function validateRecipe(input: RecipeInput): string | null {
  if (!input.name.trim()) return "Il nome è obbligatorio";
  if (!isPositiveInt(input.servings)) return "Le porzioni devono essere un numero intero positivo";
  if (!isPositiveInt(input.glassMl)) return "Il volume del bicchiere deve essere un numero intero positivo";
  return null;
}

function checked(input: RecipeInput): RecipeInput {
  const error = validateRecipe(input);
  if (error) throw new Error(error);
  return { ...input, name: input.name.trim(), instructions: input.instructions.trim() };
}

export async function listRecipes(db: Db): Promise<Recipe[]> {
  const rows = await db.select<RecipeRow[]>("SELECT * FROM recipe ORDER BY name COLLATE NOCASE");
  return rows.map(toRecipe);
}

export async function getRecipe(db: Db, id: string): Promise<Recipe | undefined> {
  const rows = await db.select<RecipeRow[]>("SELECT * FROM recipe WHERE id = ?", [id]);
  return rows[0] && toRecipe(rows[0]);
}

export async function createRecipe(
  db: Db,
  input: RecipeInput,
  id: string = crypto.randomUUID(),
  now: string = new Date().toISOString(),
): Promise<string> {
  const r = checked(input);
  await db.execute(
    "INSERT INTO recipe (id, name, instructions, servings, glass_ml, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, r.name, r.instructions, r.servings, r.glassMl, now, now],
  );
  return id;
}

export async function updateRecipe(
  db: Db,
  id: string,
  input: RecipeInput,
  now: string = new Date().toISOString(),
): Promise<void> {
  const r = checked(input);
  await db.execute(
    "UPDATE recipe SET name = ?, instructions = ?, servings = ?, glass_ml = ?, updated_at = ? WHERE id = ?",
    [r.name, r.instructions, r.servings, r.glassMl, now, id],
  );
}

export async function deleteRecipe(db: Db, id: string): Promise<void> {
  await db.execute("DELETE FROM recipe WHERE id = ?", [id]);
}

export async function setFavorite(db: Db, id: string, favorite: boolean): Promise<void> {
  await db.execute("UPDATE recipe SET favorite = ? WHERE id = ?", [favorite ? 1 : 0, id]);
}
