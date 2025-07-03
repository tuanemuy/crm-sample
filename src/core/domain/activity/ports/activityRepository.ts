import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  Activity,
  ActivityStats,
  ActivityWithRelations,
  CalendarEvent,
  CompleteActivityInput,
  CreateActivityParams,
  ListActivitiesQuery,
  UpdateActivityParams,
} from "../types";

export interface ActivityRepository {
  create(
    params: CreateActivityParams,
  ): Promise<Result<Activity, RepositoryError>>;

  findById(id: string): Promise<Result<Activity | null, RepositoryError>>;

  findByIdWithRelations(
    id: string,
  ): Promise<Result<ActivityWithRelations | null, RepositoryError>>;

  list(
    query: ListActivitiesQuery,
  ): Promise<Result<{ items: Activity[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateActivityParams,
  ): Promise<Result<Activity, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findByCustomerId(
    customerId: string,
  ): Promise<Result<Activity[], RepositoryError>>;

  findByDealId(dealId: string): Promise<Result<Activity[], RepositoryError>>;

  findByLeadId(leadId: string): Promise<Result<Activity[], RepositoryError>>;

  findByAssignedUser(
    userId: string,
  ): Promise<Result<Activity[], RepositoryError>>;

  findByCreatedByUser(
    userId: string,
  ): Promise<Result<Activity[], RepositoryError>>;

  complete(
    id: string,
    params: CompleteActivityInput,
  ): Promise<Result<Activity, RepositoryError>>;

  updateStatus(
    id: string,
    status: "planned" | "in_progress" | "completed" | "cancelled",
  ): Promise<Result<Activity, RepositoryError>>;

  findOverdue(): Promise<Result<Activity[], RepositoryError>>;

  findUpcoming(
    userId: string,
    days: number,
  ): Promise<Result<Activity[], RepositoryError>>;

  findTodayActivities(
    userId: string,
  ): Promise<Result<Activity[], RepositoryError>>;

  getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Result<CalendarEvent[], RepositoryError>>;

  getStats(userId?: string): Promise<Result<ActivityStats, RepositoryError>>;

  search(
    keyword: string,
    userId?: string,
    limit?: number,
  ): Promise<Result<Activity[], RepositoryError>>;
}
