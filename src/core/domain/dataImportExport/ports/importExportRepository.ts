import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateExportJobParams,
  CreateImportJobParams,
  ImportExportJob,
  ListJobsQuery,
  UpdateJobParams,
} from "../types";

export interface ImportExportRepository {
  createImportJob(
    params: CreateImportJobParams,
  ): Promise<Result<ImportExportJob, RepositoryError>>;
  createExportJob(
    params: CreateExportJobParams,
  ): Promise<Result<ImportExportJob, RepositoryError>>;
  findById(
    id: string,
  ): Promise<Result<ImportExportJob | null, RepositoryError>>;
  list(
    query: ListJobsQuery,
  ): Promise<Result<ImportExportJob[], RepositoryError>>;
  update(
    id: string,
    params: UpdateJobParams,
  ): Promise<Result<ImportExportJob, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
