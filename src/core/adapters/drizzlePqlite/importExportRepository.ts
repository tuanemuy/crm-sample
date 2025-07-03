import { and, eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ImportExportRepository } from "@/core/domain/dataImportExport/ports/importExportRepository";
import {
  type CreateExportJobParams,
  type CreateImportJobParams,
  type ImportExportJob,
  importExportJobSchema,
  type ListJobsQuery,
  type UpdateJobParams,
} from "@/core/domain/dataImportExport/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { importExportJobs } from "./schema";

export class DrizzlePqliteImportExportRepository
  implements ImportExportRepository
{
  constructor(private readonly db: Database) {}

  async createImportJob(
    params: CreateImportJobParams,
  ): Promise<Result<ImportExportJob, RepositoryError>> {
    try {
      const result = await this.db
        .insert(importExportJobs)
        .values({
          ...params,
          operationType: "import",
          status: "pending",
        })
        .returning();

      const job = result[0];
      if (!job) {
        return err(new RepositoryError("Failed to create import job"));
      }

      return validate(importExportJobSchema, job).mapErr((error) => {
        return new RepositoryError("Invalid import job data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create import job", error));
    }
  }

  async createExportJob(
    params: CreateExportJobParams,
  ): Promise<Result<ImportExportJob, RepositoryError>> {
    try {
      const result = await this.db
        .insert(importExportJobs)
        .values({
          ...params,
          operationType: "export",
          status: "pending",
        })
        .returning();

      const job = result[0];
      if (!job) {
        return err(new RepositoryError("Failed to create export job"));
      }

      return validate(importExportJobSchema, job).mapErr((error) => {
        return new RepositoryError("Invalid export job data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create export job", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<ImportExportJob | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(importExportJobs)
        .where(eq(importExportJobs.id, id));

      const job = result[0];
      if (!job) {
        return ok(null);
      }

      return validate(importExportJobSchema, job).mapErr((error) => {
        return new RepositoryError("Invalid import/export job data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to find import/export job", error),
      );
    }
  }

  async list(
    query: ListJobsQuery,
  ): Promise<Result<ImportExportJob[], RepositoryError>> {
    try {
      const filters = [eq(importExportJobs.userId, query.userId)];

      if (query.operationType) {
        filters.push(eq(importExportJobs.operationType, query.operationType));
      }
      if (query.dataType) {
        filters.push(eq(importExportJobs.dataType, query.dataType));
      }
      if (query.status) {
        filters.push(eq(importExportJobs.status, query.status));
      }

      const result = await this.db
        .select()
        .from(importExportJobs)
        .where(and(...filters))
        .orderBy(importExportJobs.createdAt);

      const validJobs = result
        .map((job) => validate(importExportJobSchema, job).unwrapOr(null))
        .filter((job) => job !== null);

      return ok(validJobs);
    } catch (error) {
      return err(
        new RepositoryError("Failed to list import/export jobs", error),
      );
    }
  }

  async update(
    id: string,
    params: UpdateJobParams,
  ): Promise<Result<ImportExportJob, RepositoryError>> {
    try {
      const result = await this.db
        .update(importExportJobs)
        .set(params)
        .where(eq(importExportJobs.id, id))
        .returning();

      const job = result[0];
      if (!job) {
        return err(new RepositoryError("Import/export job not found"));
      }

      return validate(importExportJobSchema, job).mapErr((error) => {
        return new RepositoryError("Invalid import/export job data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update import/export job", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(importExportJobs)
        .where(eq(importExportJobs.id, id))
        .returning();

      if (!result[0]) {
        return err(new RepositoryError("Import/export job not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to delete import/export job", error),
      );
    }
  }
}
