import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateDashboardParams,
  Dashboard,
  GetDashboardQuery,
  ListDashboardsQuery,
  UpdateDashboardParams,
} from "../types";

export interface DashboardRepository {
  create(
    params: CreateDashboardParams,
  ): Promise<Result<Dashboard, RepositoryError>>;
  findById(
    query: GetDashboardQuery,
  ): Promise<Result<Dashboard | null, RepositoryError>>;
  findByUserId(
    query: ListDashboardsQuery,
  ): Promise<Result<Dashboard[], RepositoryError>>;
  update(
    id: string,
    params: UpdateDashboardParams,
  ): Promise<Result<Dashboard, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
  setDefault(
    id: string,
    userId: string,
  ): Promise<Result<void, RepositoryError>>;
}
