import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  Approval,
  ApprovalStats,
  ApprovalWithRelations,
  ApproveApprovalInput,
  CreateApprovalParams,
  ListApprovalsQuery,
  RejectApprovalInput,
  UpdateApprovalParams,
} from "../types";

export interface ApprovalRepository {
  create(
    params: CreateApprovalParams,
  ): Promise<Result<Approval, RepositoryError>>;

  findById(id: string): Promise<Result<Approval | null, RepositoryError>>;

  findByIdWithRelations(
    id: string,
  ): Promise<Result<ApprovalWithRelations | null, RepositoryError>>;

  list(
    query: ListApprovalsQuery,
  ): Promise<Result<{ items: Approval[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateApprovalParams,
  ): Promise<Result<Approval, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findByRequestedBy(
    userId: string,
  ): Promise<Result<Approval[], RepositoryError>>;

  findByAssignedTo(
    userId: string,
  ): Promise<Result<Approval[], RepositoryError>>;

  findByEntityId(
    entityType: string,
    entityId: string,
  ): Promise<Result<Approval[], RepositoryError>>;

  approve(
    id: string,
    userId: string,
    input: ApproveApprovalInput,
  ): Promise<Result<Approval, RepositoryError>>;

  reject(
    id: string,
    userId: string,
    input: RejectApprovalInput,
  ): Promise<Result<Approval, RepositoryError>>;

  cancel(
    id: string,
    userId: string,
  ): Promise<Result<Approval, RepositoryError>>;

  findPendingApprovals(
    userId?: string,
  ): Promise<Result<Approval[], RepositoryError>>;

  findOverdueApprovals(): Promise<Result<Approval[], RepositoryError>>;

  getStats(userId?: string): Promise<Result<ApprovalStats, RepositoryError>>;

  search(
    keyword: string,
    limit?: number,
  ): Promise<Result<Approval[], RepositoryError>>;
}
