CREATE TABLE recipe (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  instructions TEXT,
  servings INTEGER,
  glass_ml INTEGER,
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ingredient (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pantry INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE recipe_ingredient (
  recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredient(id),
  qty_num INTEGER,
  qty_den INTEGER CHECK (qty_den IS NULL OR qty_den > 0),
  unit TEXT CHECK (unit IN ('g', 'ml', 'pz', 'parte', 'qb')),
  display_unit TEXT,
  note TEXT,
  optional INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL
);
CREATE INDEX recipe_ingredient_recipe ON recipe_ingredient(recipe_id);
CREATE INDEX recipe_ingredient_ingredient ON recipe_ingredient(ingredient_id);

CREATE TABLE tag (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  color TEXT,
  icon TEXT
);

CREATE TABLE recipe_tag (
  recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE TABLE fridge_item (
  ingredient_id INTEGER PRIMARY KEY REFERENCES ingredient(id) ON DELETE CASCADE,
  qty_num INTEGER,
  qty_den INTEGER CHECK (qty_den IS NULL OR qty_den > 0),
  unit TEXT CHECK (unit IN ('g', 'ml', 'pz'))
);

CREATE TABLE shopping_item (
  id INTEGER PRIMARY KEY,
  ingredient_id INTEGER REFERENCES ingredient(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  qty_num INTEGER,
  qty_den INTEGER CHECK (qty_den IS NULL OR qty_den > 0),
  unit TEXT CHECK (unit IN ('g', 'ml', 'pz')),
  done INTEGER NOT NULL DEFAULT 0
);

CREATE VIRTUAL TABLE recipe_fts USING fts5(
  name,
  content = 'recipe',
  content_rowid = 'rowid',
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TRIGGER recipe_fts_insert AFTER INSERT ON recipe BEGIN
  INSERT INTO recipe_fts(rowid, name) VALUES (new.rowid, new.name);
END;

CREATE TRIGGER recipe_fts_delete AFTER DELETE ON recipe BEGIN
  INSERT INTO recipe_fts(recipe_fts, rowid, name) VALUES ('delete', old.rowid, old.name);
END;

CREATE TRIGGER recipe_fts_update AFTER UPDATE OF name ON recipe BEGIN
  INSERT INTO recipe_fts(recipe_fts, rowid, name) VALUES ('delete', old.rowid, old.name);
  INSERT INTO recipe_fts(rowid, name) VALUES (new.rowid, new.name);
END;
