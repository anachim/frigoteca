import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { Db } from "./recipes";

/** In-memory database with the real migration applied, exposed through the same Db shape as the Tauri SQL plugin. */
export function testDb(): Db & { raw: DatabaseSync } {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON");
  raw.exec(readFileSync("src-tauri/migrations/001_init.sql", "utf8"));
  const params = (args: unknown[]) => args as SQLInputValue[];
  return {
    raw,
    async select<T>(sql: string, args: unknown[] = []) {
      return raw.prepare(sql).all(...params(args)) as T;
    },
    async execute(sql: string, args: unknown[] = []) {
      return raw.prepare(sql).run(...params(args));
    },
  };
}
