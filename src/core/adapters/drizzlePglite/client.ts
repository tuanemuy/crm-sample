import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>> & {
  $client: PGlite;
};

export async function getDatabase(directory: string) {
  const client = new PGlite(directory);
  // Wait for PGLite to be ready
  await client.waitReady;
  const db = drizzle({
    client,
    schema,
  });
  return Object.assign(db, { $client: client });
}

export class TransactionError extends Error {
  override readonly name = "TransactionError";

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

interface DatabaseError {
  code: string;
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if ("code" in value) {
    return true;
  }

  return false;
}
