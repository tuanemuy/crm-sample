import { and, eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { IntegrationRepository } from "@/core/domain/integration/ports/integrationRepository";
import {
  type CreateIntegrationParams,
  type Integration,
  integrationSchema,
  type ListIntegrationsQuery,
  type UpdateIntegrationParams,
} from "@/core/domain/integration/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { integrations } from "./schema";

export class DrizzlePqliteIntegrationRepository
  implements IntegrationRepository
{
  constructor(private readonly db: Database) {}

  async create(
    params: CreateIntegrationParams,
  ): Promise<Result<Integration, RepositoryError>> {
    try {
      const result = await this.db
        .insert(integrations)
        .values({
          ...params,
          status: "inactive",
        })
        .returning();

      const integration = result[0];
      if (!integration) {
        return err(new RepositoryError("Failed to create integration"));
      }

      return validate(integrationSchema, integration).mapErr((error) => {
        return new RepositoryError("Invalid integration data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create integration", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Integration | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id));

      const integration = result[0];
      if (!integration) {
        return ok(null);
      }

      return validate(integrationSchema, integration).mapErr((error) => {
        return new RepositoryError("Invalid integration data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find integration", error));
    }
  }

  async list(
    query?: ListIntegrationsQuery,
  ): Promise<Result<Integration[], RepositoryError>> {
    try {
      const filters = [];

      if (query?.type) {
        filters.push(eq(integrations.type, query.type));
      }
      if (query?.status) {
        filters.push(eq(integrations.status, query.status));
      }
      if (query?.isSystemwide !== undefined) {
        filters.push(eq(integrations.isSystemwide, query.isSystemwide));
      }

      const result = await this.db
        .select()
        .from(integrations)
        .where(filters.length > 0 ? and(...filters) : undefined);

      const validIntegrations = result
        .map((integration) =>
          validate(integrationSchema, integration).unwrapOr(null),
        )
        .filter((integration) => integration !== null);

      return ok(validIntegrations);
    } catch (error) {
      return err(new RepositoryError("Failed to list integrations", error));
    }
  }

  async update(
    id: string,
    params: UpdateIntegrationParams,
  ): Promise<Result<Integration, RepositoryError>> {
    try {
      const result = await this.db
        .update(integrations)
        .set(params)
        .where(eq(integrations.id, id))
        .returning();

      const integration = result[0];
      if (!integration) {
        return err(new RepositoryError("Integration not found"));
      }

      return validate(integrationSchema, integration).mapErr((error) => {
        return new RepositoryError("Invalid integration data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update integration", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(integrations)
        .where(eq(integrations.id, id))
        .returning();

      if (!result[0]) {
        return err(new RepositoryError("Integration not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete integration", error));
    }
  }
}
