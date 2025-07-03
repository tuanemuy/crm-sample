import { and, asc, count, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ActivityRepository } from "@/core/domain/activity/ports/activityRepository";
import {
  type Activity,
  type ActivityStats,
  type ActivityWithRelations,
  activitySchema,
  activityWithRelationsSchema,
  type CalendarEvent,
  type CompleteActivityInput,
  type CreateActivityParams,
  type ListActivitiesQuery,
  type UpdateActivityParams,
} from "@/core/domain/activity/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { activities, contacts, customers, deals, leads, users } from "./schema";

export class DrizzlePqliteActivityRepository implements ActivityRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateActivityParams,
  ): Promise<Result<Activity, RepositoryError>> {
    try {
      const result = await this.db
        .insert(activities)
        .values(params)
        .returning();

      const activity = result[0];
      if (!activity) {
        return err(new RepositoryError("Failed to create activity"));
      }

      return validate(activitySchema, activity).mapErr((error) => {
        return new RepositoryError("Invalid activity data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create activity", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Activity | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(activitySchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid activity data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find activity", error));
    }
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<Result<ActivityWithRelations | null, RepositoryError>> {
    try {
      const [
        activityResult,
        customerResult,
        contactResult,
        dealResult,
        leadResult,
        assignedUserResult,
        createdByUserResult,
      ] = await Promise.all([
        this.db.select().from(activities).where(eq(activities.id, id)).limit(1),
        this.db
          .select({
            id: customers.id,
            name: customers.name,
          })
          .from(customers)
          .innerJoin(activities, eq(activities.customerId, customers.id))
          .where(eq(activities.id, id))
          .limit(1),
        this.db
          .select({
            id: contacts.id,
            name: contacts.name,
            email: contacts.email,
          })
          .from(contacts)
          .innerJoin(activities, eq(activities.contactId, contacts.id))
          .where(eq(activities.id, id))
          .limit(1),
        this.db
          .select({
            id: deals.id,
            title: deals.title,
            amount: deals.amount,
            stage: deals.stage,
          })
          .from(deals)
          .innerJoin(activities, eq(activities.dealId, deals.id))
          .where(eq(activities.id, id))
          .limit(1),
        this.db
          .select({
            id: leads.id,
            firstName: leads.firstName,
            lastName: leads.lastName,
            email: leads.email,
            company: leads.company,
          })
          .from(leads)
          .innerJoin(activities, eq(activities.leadId, leads.id))
          .where(eq(activities.id, id))
          .limit(1),
        this.db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .innerJoin(activities, eq(activities.assignedUserId, users.id))
          .where(eq(activities.id, id))
          .limit(1),
        this.db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .innerJoin(activities, eq(activities.createdByUserId, users.id))
          .where(eq(activities.id, id))
          .limit(1),
      ]);

      if (activityResult.length === 0) {
        return ok(null);
      }

      const activity = activityResult[0];
      const activityWithRelations = {
        ...activity,
        description: activity.description || undefined,
        scheduledAt: activity.scheduledAt || undefined,
        dueDate: activity.dueDate || undefined,
        completedAt: activity.completedAt || undefined,
        duration: activity.duration || undefined,
        customerId: activity.customerId || undefined,
        contactId: activity.contactId || undefined,
        dealId: activity.dealId || undefined,
        leadId: activity.leadId || undefined,
        customer: customerResult[0] || undefined,
        contact: contactResult[0] || undefined,
        deal: dealResult[0] || undefined,
        lead: leadResult[0] || undefined,
        assignedUser: assignedUserResult[0],
        createdByUser: createdByUserResult[0],
      };

      return validate(
        activityWithRelationsSchema,
        activityWithRelations,
      ).mapErr((error) => new RepositoryError("Invalid activity data", error));
    } catch (error) {
      return err(
        new RepositoryError("Failed to find activity with relations", error),
      );
    }
  }

  async list(
    query: ListActivitiesQuery,
  ): Promise<Result<{ items: Activity[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword
        ? like(activities.subject, `%${filter.keyword}%`)
        : undefined,
      filter?.type ? eq(activities.type, filter.type) : undefined,
      filter?.status ? eq(activities.status, filter.status) : undefined,
      filter?.priority ? eq(activities.priority, filter.priority) : undefined,
      filter?.customerId
        ? eq(activities.customerId, filter.customerId)
        : undefined,
      filter?.dealId ? eq(activities.dealId, filter.dealId) : undefined,
      filter?.leadId ? eq(activities.leadId, filter.leadId) : undefined,
      filter?.assignedUserId
        ? eq(activities.assignedUserId, filter.assignedUserId)
        : undefined,
      filter?.createdByUserId
        ? eq(activities.createdByUserId, filter.createdByUserId)
        : undefined,
      filter?.scheduledAfter
        ? gte(activities.scheduledAt, filter.scheduledAfter)
        : undefined,
      filter?.scheduledBefore
        ? lte(activities.scheduledAt, filter.scheduledBefore)
        : undefined,
      filter?.dueAfter ? gte(activities.dueDate, filter.dueAfter) : undefined,
      filter?.dueBefore ? lte(activities.dueDate, filter.dueBefore) : undefined,
      filter?.completedAfter
        ? gte(activities.completedAt, filter.completedAfter)
        : undefined,
      filter?.completedBefore
        ? lte(activities.completedAt, filter.completedBefore)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "subject"
        ? activities.subject
        : sortBy === "scheduledAt"
          ? activities.scheduledAt
          : sortBy === "dueDate"
            ? activities.dueDate
            : sortBy === "completedAt"
              ? activities.completedAt
              : sortBy === "priority"
                ? activities.priority
                : sortBy === "updatedAt"
                  ? activities.updatedAt
                  : activities.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(activities)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(activities)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list activities", error));
    }
  }

  async update(
    id: string,
    params: UpdateActivityParams,
  ): Promise<Result<Activity, RepositoryError>> {
    try {
      const result = await this.db
        .update(activities)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(activities.id, id))
        .returning();

      const activity = result[0];
      if (!activity) {
        return err(new RepositoryError("Activity not found"));
      }

      return validate(activitySchema, activity).mapErr((error) => {
        return new RepositoryError("Invalid activity data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update activity", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(activities)
        .where(eq(activities.id, id))
        .returning({ id: activities.id });

      if (result.length === 0) {
        return err(new RepositoryError("Activity not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete activity", error));
    }
  }

  async findByCustomerId(
    customerId: string,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(activities)
        .where(eq(activities.customerId, customerId))
        .orderBy(desc(activities.scheduledAt));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find activities by customer", error),
      );
    }
  }

  async findByDealId(
    dealId: string,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(activities)
        .where(eq(activities.dealId, dealId))
        .orderBy(desc(activities.scheduledAt));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find activities by deal", error),
      );
    }
  }

  async findByLeadId(
    leadId: string,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(activities)
        .where(eq(activities.leadId, leadId))
        .orderBy(desc(activities.scheduledAt));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find activities by lead", error),
      );
    }
  }

  async findByAssignedUser(
    userId: string,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(activities)
        .where(eq(activities.assignedUserId, userId))
        .orderBy(desc(activities.scheduledAt));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError(
          "Failed to find activities by assigned user",
          error,
        ),
      );
    }
  }

  async findByCreatedByUser(
    userId: string,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(activities)
        .where(eq(activities.createdByUserId, userId))
        .orderBy(desc(activities.createdAt));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError(
          "Failed to find activities by created by user",
          error,
        ),
      );
    }
  }

  async complete(
    id: string,
    params: CompleteActivityInput,
  ): Promise<Result<Activity, RepositoryError>> {
    const updateParams: UpdateActivityParams = {
      status: "completed",
      completedAt: params.completedAt,
      duration: params.duration,
      description: params.notes ? params.notes : undefined,
    };

    return this.update(id, updateParams);
  }

  async updateStatus(
    id: string,
    status: "planned" | "in_progress" | "completed" | "cancelled",
  ): Promise<Result<Activity, RepositoryError>> {
    const updateParams: UpdateActivityParams = {
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    };

    return this.update(id, updateParams);
  }

  async findOverdue(): Promise<Result<Activity[], RepositoryError>> {
    try {
      const now = new Date();
      const result = await this.db
        .select()
        .from(activities)
        .where(
          and(
            lte(activities.dueDate, now),
            sql`${activities.status} NOT IN ('completed', 'cancelled')`,
          ),
        )
        .orderBy(asc(activities.dueDate));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find overdue activities", error),
      );
    }
  }

  async findUpcoming(
    userId: string,
    days: number,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      const result = await this.db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.assignedUserId, userId),
            gte(activities.scheduledAt, now),
            lte(activities.scheduledAt, futureDate),
            sql`${activities.status} NOT IN ('completed', 'cancelled')`,
          ),
        )
        .orderBy(asc(activities.scheduledAt));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find upcoming activities", error),
      );
    }
  }

  async findTodayActivities(
    userId: string,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );

      const result = await this.db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.assignedUserId, userId),
            gte(activities.scheduledAt, startOfDay),
            lte(activities.scheduledAt, endOfDay),
          ),
        )
        .orderBy(asc(activities.scheduledAt));

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find today's activities", error),
      );
    }
  }

  async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Result<CalendarEvent[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: activities.id,
          title: activities.subject,
          type: activities.type,
          start: activities.scheduledAt,
          duration: activities.duration,
          status: activities.status,
          priority: activities.priority,
          customer: {
            id: customers.id,
            name: customers.name,
          },
          deal: {
            id: deals.id,
            title: deals.title,
          },
          assignedUser: {
            id: users.id,
            name: users.name,
          },
        })
        .from(activities)
        .leftJoin(customers, eq(activities.customerId, customers.id))
        .leftJoin(deals, eq(activities.dealId, deals.id))
        .innerJoin(users, eq(activities.assignedUserId, users.id))
        .where(
          and(
            eq(activities.assignedUserId, userId),
            gte(activities.scheduledAt, startDate),
            lte(activities.scheduledAt, endDate),
          ),
        )
        .orderBy(asc(activities.scheduledAt));

      const events: CalendarEvent[] = result.map((item) => {
        const endTime =
          item.start && item.duration
            ? new Date(item.start.getTime() + item.duration * 60 * 1000)
            : undefined;

        return {
          id: item.id,
          title: item.title,
          type: item.type as CalendarEvent["type"],
          start: item.start || new Date(),
          end: endTime,
          allDay: !item.start,
          status: item.status as CalendarEvent["status"],
          priority: item.priority as CalendarEvent["priority"],
          customer: item.customer || undefined,
          deal: item.deal || undefined,
          assignedUser: item.assignedUser,
        };
      });

      return ok(events);
    } catch (error) {
      return err(new RepositoryError("Failed to get calendar events", error));
    }
  }

  async getStats(
    userId?: string,
  ): Promise<Result<ActivityStats, RepositoryError>> {
    try {
      const baseQuery = userId
        ? eq(activities.assignedUserId, userId)
        : undefined;

      const [
        totalCount,
        statusCounts,
        typeCounts,
        priorityCounts,
        overdueCount,
        todayCount,
        upcomingCount,
        completionStats,
        recentActivities,
      ] = await Promise.all([
        this.db.select({ count: count() }).from(activities).where(baseQuery),
        this.db
          .select({ status: activities.status, count: count() })
          .from(activities)
          .where(baseQuery)
          .groupBy(activities.status),
        this.db
          .select({ type: activities.type, count: count() })
          .from(activities)
          .where(baseQuery)
          .groupBy(activities.type),
        this.db
          .select({ priority: activities.priority, count: count() })
          .from(activities)
          .where(baseQuery)
          .groupBy(activities.priority),
        this.db
          .select({ count: count() })
          .from(activities)
          .where(
            and(
              baseQuery,
              lte(activities.dueDate, new Date()),
              sql`${activities.status} NOT IN ('completed', 'cancelled')`,
            ),
          ),
        this.db
          .select({ count: count() })
          .from(activities)
          .where(
            and(
              baseQuery,
              gte(
                activities.scheduledAt,
                new Date(new Date().setHours(0, 0, 0, 0)),
              ),
              lte(
                activities.scheduledAt,
                new Date(new Date().setHours(23, 59, 59, 999)),
              ),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(activities)
          .where(
            and(
              baseQuery,
              gte(activities.scheduledAt, new Date()),
              sql`${activities.status} NOT IN ('completed', 'cancelled')`,
            ),
          ),
        this.db
          .select({
            avgDuration: sql<number>`AVG(${activities.duration})`,
          })
          .from(activities)
          .where(
            and(
              baseQuery,
              eq(activities.status, "completed"),
              sql`${activities.duration} IS NOT NULL`,
            ),
          ),
        this.db
          .select()
          .from(activities)
          .where(baseQuery)
          .orderBy(desc(activities.createdAt))
          .limit(5),
      ]);

      const totalActivities = totalCount[0]?.count || 0;
      const completedActivities =
        statusCounts.find((s) => s.status === "completed")?.count || 0;
      const completionRate =
        totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

      const stats = {
        totalActivities,
        plannedActivities:
          statusCounts.find((s) => s.status === "planned")?.count || 0,
        inProgressActivities:
          statusCounts.find((s) => s.status === "in_progress")?.count || 0,
        completedActivities,
        cancelledActivities:
          statusCounts.find((s) => s.status === "cancelled")?.count || 0,
        overdueActivities: overdueCount[0]?.count || 0,
        todayActivities: todayCount[0]?.count || 0,
        upcomingActivities: upcomingCount[0]?.count || 0,
        activitiesByType: Object.fromEntries(
          typeCounts.map((item) => [item.type, item.count]),
        ),
        activitiesByPriority: Object.fromEntries(
          priorityCounts.map((item) => [item.priority, item.count]),
        ),
        completionRate,
        avgDuration: completionStats[0]?.avgDuration || 0,
        recentActivities: recentActivities
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      };

      return ok(stats);
    } catch (error) {
      return err(new RepositoryError("Failed to get activity stats", error));
    }
  }

  async search(
    keyword: string,
    userId?: string,
    limit = 10,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      const baseFilters = [
        sql`${activities.subject} ILIKE ${`%${keyword}%`} OR ${activities.description} ILIKE ${`%${keyword}%`}`,
      ];

      if (userId) {
        baseFilters.push(eq(activities.assignedUserId, userId));
      }

      const result = await this.db
        .select()
        .from(activities)
        .where(and(...baseFilters))
        .orderBy(desc(activities.updatedAt))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(activitySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to search activities", error));
    }
  }
}
