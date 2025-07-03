import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateDealParams,
  Deal,
  DealStats,
  DealWithRelations,
  ListDealsQuery,
  PipelineData,
  UpdateDealParams,
  UpdateDealStageInput,
} from "../types";

export interface DealRepository {
  create(params: CreateDealParams): Promise<Result<Deal, RepositoryError>>;

  findById(id: string): Promise<Result<Deal | null, RepositoryError>>;

  findByIdWithRelations(
    id: string,
  ): Promise<Result<DealWithRelations | null, RepositoryError>>;

  list(
    query: ListDealsQuery,
  ): Promise<Result<{ items: Deal[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateDealParams,
  ): Promise<Result<Deal, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findByCustomerId(
    customerId: string,
  ): Promise<Result<Deal[], RepositoryError>>;

  findByAssignedUser(userId: string): Promise<Result<Deal[], RepositoryError>>;

  updateStage(
    id: string,
    params: UpdateDealStageInput,
  ): Promise<Result<Deal, RepositoryError>>;

  findByStage(stage: string): Promise<Result<Deal[], RepositoryError>>;

  getPipelineData(
    userId?: string,
  ): Promise<Result<PipelineData, RepositoryError>>;

  getStats(userId?: string): Promise<Result<DealStats, RepositoryError>>;

  search(
    keyword: string,
    limit?: number,
  ): Promise<Result<Deal[], RepositoryError>>;

  findExpiredDeals(): Promise<Result<Deal[], RepositoryError>>;

  findUpcomingDeals(days: number): Promise<Result<Deal[], RepositoryError>>;
}
