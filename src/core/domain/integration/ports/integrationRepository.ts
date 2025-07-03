import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateIntegrationParams,
  Integration,
  ListIntegrationsQuery,
  UpdateIntegrationParams,
} from "../types";

export interface IntegrationRepository {
  create(
    params: CreateIntegrationParams,
  ): Promise<Result<Integration, RepositoryError>>;
  findById(id: string): Promise<Result<Integration | null, RepositoryError>>;
  list(
    query?: ListIntegrationsQuery,
  ): Promise<Result<Integration[], RepositoryError>>;
  update(
    id: string,
    params: UpdateIntegrationParams,
  ): Promise<Result<Integration, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
