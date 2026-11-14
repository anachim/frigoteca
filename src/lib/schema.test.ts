import { DatabaseSync } from "node:sqlite";
import { expect, test } from "vitest";
import { testDb } from "./test-db";

const freshDb = () => testDb().raw;

function addRecipe(db: DatabaseSync, id: string, name: string) {
  db.prepare(
    "INSERT INTO recipe (id, name, created_at, updated_at) VALUES (?, ?, '', '')",
  ).run(id, name);
}

function search(db: DatabaseSync, q: string) {
  return db
    .prepare(
      "SELECT r.id FROM recipe_fts JOIN recipe r ON r.rowid = recipe_fts.rowid WHERE recipe_fts MATCH ?",
    )
    .all(q)
    .map((row) => row.id);
}

test("name search ignores accents and follows renames and deletes", () => {
  const db = freshDb();
  addRecipe(db, "a", "Caffè shakerato");
  expect(search(db, "caffe")).toEqual(["a"]);

  db.prepare("UPDATE recipe SET name = 'Espresso martini' WHERE id = 'a'").run();
  expect(search(db, "caffe")).toEqual([]);
  expect(search(db, "martini")).toEqual(["a"]);

  db.prepare("DELETE FROM recipe WHERE id = 'a'").run();
  expect(search(db, "martini")).toEqual([]);
});

test("units outside the allowed list are rejected", () => {
  const db = freshDb();
  addRecipe(db, "a", "Torta");
  db.prepare("INSERT INTO ingredient (id, name) VALUES (1, 'Zucchero')").run();
  const insert = db.prepare(
    "INSERT INTO recipe_ingredient (recipe_id, ingredient_id, qty_num, qty_den, unit, position) VALUES ('a', 1, 30, 1, ?, 0)",
  );
  insert.run("g");
  expect(() => insert.run("kg")).toThrow();
});

test("deleting a recipe removes its ingredients and tags", () => {
  const db = freshDb();
  addRecipe(db, "a", "Torta");
  db.exec(`
    INSERT INTO ingredient (id, name) VALUES (1, 'Zucchero');
    INSERT INTO tag (id, name) VALUES (1, 'Dolci');
    INSERT INTO recipe_ingredient (recipe_id, ingredient_id, position) VALUES ('a', 1, 0);
    INSERT INTO recipe_tag (recipe_id, tag_id) VALUES ('a', 1);
    DELETE FROM recipe WHERE id = 'a';
  `);
  const count = (table: string) =>
    db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()!.n;
  expect(count("recipe_ingredient")).toBe(0);
  expect(count("recipe_tag")).toBe(0);
});
