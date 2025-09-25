import * as path from "node:path";
import { migrate as pgliteMigrate } from "drizzle-orm/pglite/migrator";

import { getDatabase } from "./client";

export async function migrate(directory: string) {
  const db = await getDatabase(directory);

  return pgliteMigrate(db, {
    migrationsFolder: path.join(__dirname, "migrations"),
  });
}
