import { and, eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { DashboardRepository } from "@/core/domain/dashboard/ports/dashboardRepository";
import {
  type CreateDashboardParams,
  type Dashboard,
  dashboardSchema,
  type GetDashboardQuery,
  type ListDashboardsQuery,
  type UpdateDashboardParams,
} from "@/core/domain/dashboard/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { dashboards } from "./schema";

export class DrizzlePqliteDashboardRepository implements DashboardRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateDashboardParams,
  ): Promise<Result<Dashboard, RepositoryError>> {
    try {
      const result = await this.db
        .insert(dashboards)
        .values(params)
        .returning();

      const dashboard = result[0];
      if (!dashboard) {
        return err(new RepositoryError("Failed to create dashboard"));
      }

      return validate(dashboardSchema, dashboard).mapErr((error) => {
        return new RepositoryError("Invalid dashboard data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create dashboard", error));
    }
  }

  async findById(
    query: GetDashboardQuery,
  ): Promise<Result<Dashboard | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(dashboards)
        .where(
          and(eq(dashboards.id, query.id), eq(dashboards.userId, query.userId)),
        );

      const dashboard = result[0];
      if (!dashboard) {
        return ok(null);
      }

      return validate(dashboardSchema, dashboard).mapErr((error) => {
        return new RepositoryError("Invalid dashboard data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find dashboard", error));
    }
  }

  async findByUserId(
    query: ListDashboardsQuery,
  ): Promise<Result<Dashboard[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(dashboards)
        .where(eq(dashboards.userId, query.userId));

      const validDashboards = result
        .map((dashboard) => validate(dashboardSchema, dashboard).unwrapOr(null))
        .filter((dashboard) => dashboard !== null);

      return ok(validDashboards);
    } catch (error) {
      return err(new RepositoryError("Failed to find dashboards", error));
    }
  }

  async update(
    id: string,
    params: UpdateDashboardParams,
  ): Promise<Result<Dashboard, RepositoryError>> {
    try {
      const result = await this.db
        .update(dashboards)
        .set(params)
        .where(eq(dashboards.id, id))
        .returning();

      const dashboard = result[0];
      if (!dashboard) {
        return err(new RepositoryError("Dashboard not found"));
      }

      return validate(dashboardSchema, dashboard).mapErr((error) => {
        return new RepositoryError("Invalid dashboard data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update dashboard", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(dashboards)
        .where(eq(dashboards.id, id))
        .returning();

      if (!result[0]) {
        return err(new RepositoryError("Dashboard not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete dashboard", error));
    }
  }

  async setDefault(
    id: string,
    userId: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .update(dashboards)
          .set({ isDefault: false })
          .where(eq(dashboards.userId, userId));

        await tx
          .update(dashboards)
          .set({ isDefault: true })
          .where(eq(dashboards.id, id));
      });

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to set default dashboard", error));
    }
  }
}
