import Database from "@tauri-apps/plugin-sql";

let db: Promise<Database> | undefined;

export function getDb(): Promise<Database> {
  db ??= Database.load("sqlite:frigoteca.db");
  return db;
}
