import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const directory = process.env.DATABASE_DIRECTORY;

if (!directory) {
  throw new Error("DATABASE_DIRECTORY environment variable is not set.");
}

export default defineConfig({
  out: "./src/core/adapters/drizzlePglite/migrations",
  schema: "./src/core/adapters/drizzlePglite/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: directory,
  },
});
