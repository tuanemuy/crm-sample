import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ApprovalRepository } from "@/core/domain/approval/ports/approvalRepository";
import type {
  Approval,
  ApprovalStats,
  ApprovalWithRelations,
  ApproveApprovalInput,
  CreateApprovalParams,
  ListApprovalsQuery,
  RejectApprovalInput,
  UpdateApprovalParams,
} from "@/core/domain/approval/types";
import {
  approvalSchema,
  approvalStatsSchema,
  approvalWithRelationsSchema,
} from "@/core/domain/approval/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { approvals, users } from "./schema";

export class DrizzlePgliteApprovalRepository implements ApprovalRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateApprovalParams,
  ): Promise<Result<Approval, RepositoryError>> {
    try {
      const result = await this.db
        .insert(approvals)
        .values({
          entityType: params.entityType,
          entityId: params.entityId,
          title: params.title,
          description: params.description,
          requestedBy: params.requestedBy,
          assignedTo: params.assignedTo,
          priority: params.priority,
          requestData: params.requestData || {},
          dueDate: params.dueDate,
        })
        .returning();

      const approval = result[0];
      if (!approval) {
        return err(new RepositoryError("Failed to create approval"));
      }

      return validate(approvalSchema, approval).mapErr((error) => {
        return new RepositoryError("Invalid approval data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create approval", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Approval | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(approvals)
        .where(eq(approvals.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(approvalSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid approval data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find approval", error));
    }
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<Result<ApprovalWithRelations | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          approval: approvals,
          requestedByUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          assignedToUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(approvals)
        .leftJoin(users, eq(approvals.requestedBy, users.id))
        .leftJoin(users, eq(approvals.assignedTo, users.id))
        .where(eq(approvals.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const row = result[0];
      const approvalWithRelations = {
        ...row.approval,
        requestedByUser: row.requestedByUser,
        assignedToUser: row.assignedToUser,
        entity: undefined, // Would need to implement entity resolution based on entityType
      };

      return validate(
        approvalWithRelationsSchema,
        approvalWithRelations,
      ).mapErr((error) => {
        return new RepositoryError(
          "Invalid approval with relations data",
          error,
        );
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to find approval with relations", error),
      );
    }
  }

  async list(
    query: ListApprovalsQuery,
  ): Promise<Result<{ items: Approval[]; count: number }, RepositoryError>> {
    const {
      pagination,
      filter,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword
        ? like(approvals.title, `%${filter.keyword}%`)
        : undefined,
      filter?.status ? eq(approvals.status, filter.status) : undefined,
      filter?.entityType
        ? eq(approvals.entityType, filter.entityType)
        : undefined,
      filter?.priority ? eq(approvals.priority, filter.priority) : undefined,
      filter?.requestedBy
        ? eq(approvals.requestedBy, filter.requestedBy)
        : undefined,
      filter?.assignedTo
        ? eq(approvals.assignedTo, filter.assignedTo)
        : undefined,
      filter?.dueBefore
        ? sql`${approvals.dueDate} <= ${filter.dueBefore}`
        : undefined,
      filter?.dueAfter
        ? sql`${approvals.dueDate} >= ${filter.dueAfter}`
        : undefined,
      filter?.createdAfter
        ? sql`${approvals.createdAt} >= ${filter.createdAfter}`
        : undefined,
      filter?.createdBefore
        ? sql`${approvals.createdAt} <= ${filter.createdBefore}`
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy = sortOrder === "asc" ? asc : desc;
    const sortColumnMap = {
      title: approvals.title,
      status: approvals.status,
      priority: approvals.priority,
      dueDate: approvals.dueDate,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    };
    const sortColumn =
      sortColumnMap[sortBy as keyof typeof sortColumnMap] ||
      approvals.createdAt;

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(approvals)
          .where(and(...filters))
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(approvals)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(approvalSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0].count),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list approvals", error));
    }
  }

  async update(
    id: string,
    params: UpdateApprovalParams,
  ): Promise<Result<Approval, RepositoryError>> {
    try {
      const result = await this.db
        .update(approvals)
        .set(params)
        .where(eq(approvals.id, id))
        .returning();

      const approval = result[0];
      if (!approval) {
        return err(new RepositoryError("Approval not found"));
      }

      return validate(approvalSchema, approval).mapErr((error) => {
        return new RepositoryError("Invalid approval data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update approval", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(approvals).where(eq(approvals.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete approval", error));
    }
  }

  async findByRequestedBy(
    userId: string,
  ): Promise<Result<Approval[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(approvals)
        .where(eq(approvals.requestedBy, userId))
        .orderBy(desc(approvals.createdAt));

      return ok(
        result
          .map((item) => validate(approvalSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find approvals by requested by", error),
      );
    }
  }

  async findByAssignedTo(
    userId: string,
  ): Promise<Result<Approval[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(approvals)
        .where(eq(approvals.assignedTo, userId))
        .orderBy(desc(approvals.createdAt));

      return ok(
        result
          .map((item) => validate(approvalSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find approvals by assigned to", error),
      );
    }
  }

  async findByEntityId(
    entityType: string,
    entityId: string,
  ): Promise<Result<Approval[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(approvals)
        .where(
          and(
            eq(approvals.entityType, entityType),
            eq(approvals.entityId, entityId),
          ),
        )
        .orderBy(desc(approvals.createdAt));

      return ok(
        result
          .map((item) => validate(approvalSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find approvals by entity", error),
      );
    }
  }

  async approve(
    id: string,
    _userId: string,
    input: ApproveApprovalInput,
  ): Promise<Result<Approval, RepositoryError>> {
    try {
      const result = await this.db
        .update(approvals)
        .set({
          status: "approved",
          approverComments: input.comments,
          approvedAt: new Date(),
        })
        .where(eq(approvals.id, id))
        .returning();

      const approval = result[0];
      if (!approval) {
        return err(new RepositoryError("Approval not found"));
      }

      return validate(approvalSchema, approval).mapErr((error) => {
        return new RepositoryError("Invalid approval data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to approve request", error));
    }
  }

  async reject(
    id: string,
    _userId: string,
    input: RejectApprovalInput,
  ): Promise<Result<Approval, RepositoryError>> {
    try {
      const result = await this.db
        .update(approvals)
        .set({
          status: "rejected",
          approverComments: `${input.reason}: ${input.comments}`,
          rejectedAt: new Date(),
        })
        .where(eq(approvals.id, id))
        .returning();

      const approval = result[0];
      if (!approval) {
        return err(new RepositoryError("Approval not found"));
      }

      return validate(approvalSchema, approval).mapErr((error) => {
        return new RepositoryError("Invalid approval data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to reject request", error));
    }
  }

  async cancel(
    id: string,
    _userId: string,
  ): Promise<Result<Approval, RepositoryError>> {
    try {
      const result = await this.db
        .update(approvals)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
        })
        .where(eq(approvals.id, id))
        .returning();

      const approval = result[0];
      if (!approval) {
        return err(new RepositoryError("Approval not found"));
      }

      return validate(approvalSchema, approval).mapErr((error) => {
        return new RepositoryError("Invalid approval data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to cancel approval", error));
    }
  }

  async findPendingApprovals(
    userId?: string,
  ): Promise<Result<Approval[], RepositoryError>> {
    try {
      const filters = [
        eq(approvals.status, "pending"),
        userId ? eq(approvals.assignedTo, userId) : undefined,
      ].filter(Boolean);

      const result = await this.db
        .select()
        .from(approvals)
        .where(and(...filters))
        .orderBy(asc(approvals.dueDate), desc(approvals.createdAt));

      return ok(
        result
          .map((item) => validate(approvalSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find pending approvals", error),
      );
    }
  }

  async findOverdueApprovals(): Promise<Result<Approval[], RepositoryError>> {
    try {
      const now = new Date();
      const result = await this.db
        .select()
        .from(approvals)
        .where(
          and(
            eq(approvals.status, "pending"),
            sql`${approvals.dueDate} < ${now}`,
          ),
        )
        .orderBy(asc(approvals.dueDate));

      return ok(
        result
          .map((item) => validate(approvalSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find overdue approvals", error),
      );
    }
  }

  async getStats(
    userId?: string,
  ): Promise<Result<ApprovalStats, RepositoryError>> {
    try {
      // This is a simplified implementation
      // In a real application, you'd want to use more sophisticated SQL queries
      const filters = userId ? [eq(approvals.assignedTo, userId)] : [];

      const [
        totalResult,
        pendingResult,
        approvedResult,
        rejectedResult,
        cancelledResult,
      ] = await Promise.all([
        this.db
          .select({ count: sql`count(*)` })
          .from(approvals)
          .where(and(...filters)),
        this.db
          .select({ count: sql`count(*)` })
          .from(approvals)
          .where(and(eq(approvals.status, "pending"), ...filters)),
        this.db
          .select({ count: sql`count(*)` })
          .from(approvals)
          .where(and(eq(approvals.status, "approved"), ...filters)),
        this.db
          .select({ count: sql`count(*)` })
          .from(approvals)
          .where(and(eq(approvals.status, "rejected"), ...filters)),
        this.db
          .select({ count: sql`count(*)` })
          .from(approvals)
          .where(and(eq(approvals.status, "cancelled"), ...filters)),
      ]);

      const stats = {
        totalApprovals: Number(totalResult[0].count),
        pendingApprovals: Number(pendingResult[0].count),
        approvedApprovals: Number(approvedResult[0].count),
        rejectedApprovals: Number(rejectedResult[0].count),
        cancelledApprovals: Number(cancelledResult[0].count),
        averageApprovalTime: 0, // Would need more complex calculation
        approvalsByPriority: {},
        approvalsByEntityType: {},
        monthlyTrend: [],
        topApprovers: [],
      };

      return validate(approvalStatsSchema, stats).mapErr((error) => {
        return new RepositoryError("Invalid approval stats data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get approval stats", error));
    }
  }

  async search(
    keyword: string,
    limit = 10,
  ): Promise<Result<Approval[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(approvals)
        .where(like(approvals.title, `%${keyword}%`))
        .orderBy(desc(approvals.createdAt))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(approvalSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to search approvals", error));
    }
  }
}
