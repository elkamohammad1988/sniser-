import * as m0001 from "./0001_init";

export interface Migration {
  id: string;
  up: string;
}

/**
 * Ordered list of migrations. Append new entries — never edit a shipped one.
 * Each `up` is executed exactly once, inside a transaction, and recorded in
 * the `schema_migrations` table.
 */
export const migrations: Migration[] = [{ id: m0001.id, up: m0001.up }];
