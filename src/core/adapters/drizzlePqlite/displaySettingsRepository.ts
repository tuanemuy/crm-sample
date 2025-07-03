import { eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { DisplaySettingsRepository } from "@/core/domain/displaySettings/ports/displaySettingsRepository";
import {
  type CreateDisplaySettingsParams,
  type DisplaySettings,
  displaySettingsSchema,
  type GetDisplaySettingsQuery,
  type UpdateDisplaySettingsParams,
} from "@/core/domain/displaySettings/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { displaySettings } from "./schema";

export class DrizzlePqliteDisplaySettingsRepository
  implements DisplaySettingsRepository
{
  constructor(private readonly db: Database) {}

  async create(
    params: CreateDisplaySettingsParams,
  ): Promise<Result<DisplaySettings, RepositoryError>> {
    try {
      const result = await this.db
        .insert(displaySettings)
        .values(params)
        .returning();

      const setting = result[0];
      if (!setting) {
        return err(new RepositoryError("Failed to create display settings"));
      }

      return validate(displaySettingsSchema, setting).mapErr((error) => {
        return new RepositoryError("Invalid display settings data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to create display settings", error),
      );
    }
  }

  async findByUserId(
    query: GetDisplaySettingsQuery,
  ): Promise<Result<DisplaySettings | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(displaySettings)
        .where(eq(displaySettings.userId, query.userId));

      const setting = result[0];
      if (!setting) {
        return ok(null);
      }

      return validate(displaySettingsSchema, setting).mapErr((error) => {
        return new RepositoryError("Invalid display settings data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find display settings", error));
    }
  }

  async update(
    id: string,
    params: UpdateDisplaySettingsParams,
  ): Promise<Result<DisplaySettings, RepositoryError>> {
    try {
      const result = await this.db
        .update(displaySettings)
        .set(params)
        .where(eq(displaySettings.id, id))
        .returning();

      const setting = result[0];
      if (!setting) {
        return err(new RepositoryError("Display settings not found"));
      }

      return validate(displaySettingsSchema, setting).mapErr((error) => {
        return new RepositoryError("Invalid display settings data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update display settings", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(displaySettings)
        .where(eq(displaySettings.id, id))
        .returning();

      if (!result[0]) {
        return err(new RepositoryError("Display settings not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to delete display settings", error),
      );
    }
  }
}
