import { z } from "zod/v4";
import { getDatabase } from "@/core/adapters/drizzlePglite/client";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  NEXT_PUBLIC_URL: z.string().url(),
  DATABASE_DIRECTORY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.safeParse(process.env);
if (!env.success) {
  const errors = env.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Environment validation failed: ${errors}`);
}

const db = getDatabase(env.data.DATABASE_DIRECTORY);
// const ${entity}Repository = new DrizzleSqlite${Entity}Repository(db);

export const context: Context = {
  publicUrl: env.data.NEXT_PUBLIC_URL,
  // ${entity}Repository,
};
