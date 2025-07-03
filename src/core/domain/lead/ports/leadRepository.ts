import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateLeadBehaviorParams,
  CreateLeadParams,
  Lead,
  LeadBehavior,
  LeadStats,
  LeadWithUser,
  ListLeadsQuery,
  UpdateLeadParams,
} from "../types";

export interface LeadRepository {
  create(params: CreateLeadParams): Promise<Result<Lead, RepositoryError>>;

  findById(id: string): Promise<Result<Lead | null, RepositoryError>>;

  findByIdWithUser(
    id: string,
  ): Promise<Result<LeadWithUser | null, RepositoryError>>;

  list(
    query: ListLeadsQuery,
  ): Promise<Result<{ items: Lead[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateLeadParams,
  ): Promise<Result<Lead, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findByEmail(email: string): Promise<Result<Lead | null, RepositoryError>>;

  findByAssignedUser(userId: string): Promise<Result<Lead[], RepositoryError>>;

  updateScore(
    id: string,
    score: number,
  ): Promise<Result<Lead, RepositoryError>>;

  updateStatus(
    id: string,
    status: "new" | "contacted" | "qualified" | "converted" | "rejected",
  ): Promise<Result<Lead, RepositoryError>>;

  convert(
    id: string,
    customerId: string,
  ): Promise<Result<Lead, RepositoryError>>;

  getStats(): Promise<Result<LeadStats, RepositoryError>>;

  search(
    keyword: string,
    limit?: number,
  ): Promise<Result<Lead[], RepositoryError>>;

  // Lead behavior tracking
  createBehavior(
    params: CreateLeadBehaviorParams,
  ): Promise<Result<LeadBehavior, RepositoryError>>;

  getBehaviorByLeadId(
    leadId: string,
  ): Promise<Result<LeadBehavior[], RepositoryError>>;
}
