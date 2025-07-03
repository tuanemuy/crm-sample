import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Activity report schema
export const activityReportSchema = z.object({
  reportMetadata: z.object({
    generatedAt: z.date(),
    period: z.object({
      startDate: z.date(),
      endDate: z.date(),
    }),
    userId: z.string().uuid().optional(),
    totalActivities: z.number(),
  }),
  summary: z.object({
    totalActivities: z.number(),
    completedActivities: z.number(),
    pendingActivities: z.number(),
    cancelledActivities: z.number(),
    completionRate: z.number(),
    averageDuration: z.number(),
  }),
  activityByType: z.array(
    z.object({
      type: z.string(),
      count: z.number(),
      completedCount: z.number(),
      pendingCount: z.number(),
      completionRate: z.number(),
      totalDuration: z.number(),
      averageDuration: z.number(),
    }),
  ),
  activityByPriority: z.array(
    z.object({
      priority: z.string(),
      count: z.number(),
      completedCount: z.number(),
      completionRate: z.number(),
    }),
  ),
  userPerformance: z.array(
    z.object({
      userId: z.string(),
      userName: z.string(),
      totalActivities: z.number(),
      completedActivities: z.number(),
      completionRate: z.number(),
      totalDuration: z.number(),
      averageDuration: z.number(),
    }),
  ),
  dailyActivity: z.array(
    z.object({
      date: z.string(),
      totalActivities: z.number(),
      completedActivities: z.number(),
      averageDuration: z.number(),
    }),
  ),
  topActivities: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      subject: z.string(),
      status: z.string(),
      priority: z.string(),
      duration: z.number().optional(),
      assignedUser: z.object({
        id: z.string(),
        name: z.string(),
      }),
      customer: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional(),
      deal: z
        .object({
          id: z.string(),
          title: z.string(),
        })
        .optional(),
    }),
  ),
});

export type ActivityReport = z.infer<typeof activityReportSchema>;

// Input schema for activity report generation
export const generateActivityReportInputSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  userId: z.string().uuid().optional(),
  activityType: z.enum(["call", "email", "meeting", "task", "note"]).optional(),
  includeUserPerformance: z.boolean().default(true),
  includeDailyBreakdown: z.boolean().default(true),
  includeTopActivities: z.boolean().default(true),
  topActivitiesLimit: z.number().int().min(1).max(50).default(20),
});

export type GenerateActivityReportInput = z.infer<
  typeof generateActivityReportInputSchema
>;

export async function generateActivityReport(
  context: Context,
  input: GenerateActivityReportInput,
): Promise<Result<ActivityReport, ApplicationError>> {
  // Validate input
  const validationResult = validate(generateActivityReportInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for activity report generation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  try {
    // Build filter for activities within the report period
    const activityFilter = {
      scheduledAfter: validInput.startDate,
      scheduledBefore: validInput.endDate,
      assignedUserId: validInput.userId,
      type: validInput.activityType,
    };

    // Get activities for the report period
    const activitiesResult = await context.activityRepository.list({
      pagination: {
        page: 1,
        limit: 10000,
        order: "desc",
        orderBy: "scheduledAt",
      },
      filter: activityFilter,
      sortBy: "scheduledAt",
      sortOrder: "desc",
    });

    if (activitiesResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to fetch activities for report",
          activitiesResult.error,
        ),
      );
    }

    const activities = activitiesResult.value.items;

    // Calculate summary statistics
    const totalActivities = activities.length;
    const completedActivities = activities.filter(
      (a) => a.status === "completed",
    ).length;
    const pendingActivities = activities.filter(
      (a) => a.status === "planned" || a.status === "in_progress",
    ).length;
    const cancelledActivities = activities.filter(
      (a) => a.status === "cancelled",
    ).length;
    const completionRate =
      totalActivities > 0 ? completedActivities / totalActivities : 0;

    const activitiesWithDuration = activities.filter(
      (a) => a.duration && a.duration > 0,
    );
    const totalDuration = activitiesWithDuration.reduce(
      (sum, a) => sum + (a.duration || 0),
      0,
    );
    const averageDuration =
      activitiesWithDuration.length > 0
        ? totalDuration / activitiesWithDuration.length
        : 0;

    // Calculate activity by type
    const typeMap = new Map<
      string,
      {
        count: number;
        completedCount: number;
        pendingCount: number;
        totalDuration: number;
        durationsCount: number;
      }
    >();

    activities.forEach((activity) => {
      const type = activity.type;
      if (!typeMap.has(type)) {
        typeMap.set(type, {
          count: 0,
          completedCount: 0,
          pendingCount: 0,
          totalDuration: 0,
          durationsCount: 0,
        });
      }

      const typeData = typeMap.get(type);
      if (!typeData) return;

      typeData.count++;
      if (activity.status === "completed") typeData.completedCount++;
      if (activity.status === "planned" || activity.status === "in_progress")
        typeData.pendingCount++;
      if (activity.duration && activity.duration > 0) {
        typeData.totalDuration += activity.duration;
        typeData.durationsCount++;
      }
    });

    const activityByType = Array.from(typeMap.entries()).map(
      ([type, data]) => ({
        type,
        count: data.count,
        completedCount: data.completedCount,
        pendingCount: data.pendingCount,
        completionRate: data.count > 0 ? data.completedCount / data.count : 0,
        totalDuration: data.totalDuration,
        averageDuration:
          data.durationsCount > 0
            ? data.totalDuration / data.durationsCount
            : 0,
      }),
    );

    // Calculate activity by priority
    const priorityMap = new Map<
      string,
      { count: number; completedCount: number }
    >();

    activities.forEach((activity) => {
      const priority = activity.priority;
      if (!priorityMap.has(priority)) {
        priorityMap.set(priority, { count: 0, completedCount: 0 });
      }

      const priorityData = priorityMap.get(priority);
      if (!priorityData) return;

      priorityData.count++;
      if (activity.status === "completed") priorityData.completedCount++;
    });

    const activityByPriority = Array.from(priorityMap.entries()).map(
      ([priority, data]) => ({
        priority,
        count: data.count,
        completedCount: data.completedCount,
        completionRate: data.count > 0 ? data.completedCount / data.count : 0,
      }),
    );

    // Calculate user performance (if requested and not filtered by specific user)
    const userPerformance: ActivityReport["userPerformance"] = [];
    if (validInput.includeUserPerformance && !validInput.userId) {
      const userMap = new Map<
        string,
        {
          userName: string;
          totalActivities: number;
          completedActivities: number;
          totalDuration: number;
          durationsCount: number;
        }
      >();

      activities.forEach((activity) => {
        const userId = activity.assignedUserId;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userName: `User ${userId}`, // Simplified - would join with user data in real app
            totalActivities: 0,
            completedActivities: 0,
            totalDuration: 0,
            durationsCount: 0,
          });
        }

        const userData = userMap.get(userId);
        if (!userData) return;

        userData.totalActivities++;
        if (activity.status === "completed") userData.completedActivities++;
        if (activity.duration && activity.duration > 0) {
          userData.totalDuration += activity.duration;
          userData.durationsCount++;
        }
      });

      userPerformance.push(
        ...Array.from(userMap.entries()).map(([userId, data]) => ({
          userId,
          userName: data.userName,
          totalActivities: data.totalActivities,
          completedActivities: data.completedActivities,
          completionRate:
            data.totalActivities > 0
              ? data.completedActivities / data.totalActivities
              : 0,
          totalDuration: data.totalDuration,
          averageDuration:
            data.durationsCount > 0
              ? data.totalDuration / data.durationsCount
              : 0,
        })),
      );
    }

    // Calculate daily activity breakdown
    const dailyActivity: ActivityReport["dailyActivity"] = [];
    if (validInput.includeDailyBreakdown) {
      const dailyMap = new Map<
        string,
        {
          totalActivities: number;
          completedActivities: number;
          totalDuration: number;
          durationsCount: number;
        }
      >();

      activities.forEach((activity) => {
        const date =
          activity.scheduledAt?.toISOString().split("T")[0] ||
          activity.createdAt.toISOString().split("T")[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            totalActivities: 0,
            completedActivities: 0,
            totalDuration: 0,
            durationsCount: 0,
          });
        }

        const dailyData = dailyMap.get(date);
        if (!dailyData) return;

        dailyData.totalActivities++;
        if (activity.status === "completed") dailyData.completedActivities++;
        if (activity.duration && activity.duration > 0) {
          dailyData.totalDuration += activity.duration;
          dailyData.durationsCount++;
        }
      });

      dailyActivity.push(
        ...Array.from(dailyMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, data]) => ({
            date,
            totalActivities: data.totalActivities,
            completedActivities: data.completedActivities,
            averageDuration:
              data.durationsCount > 0
                ? data.totalDuration / data.durationsCount
                : 0,
          })),
      );
    }

    // Get top activities by priority and recent completion
    const topActivities: ActivityReport["topActivities"] = [];
    if (validInput.includeTopActivities) {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

      topActivities.push(
        ...activities
          .sort((a, b) => {
            const aPriority =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const bPriority =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

            if (aPriority !== bPriority) return bPriority - aPriority;

            const aDate = a.completedAt || a.scheduledAt || a.createdAt;
            const bDate = b.completedAt || b.scheduledAt || b.createdAt;
            return bDate.getTime() - aDate.getTime();
          })
          .slice(0, validInput.topActivitiesLimit)
          .map((activity) => ({
            id: activity.id,
            type: activity.type,
            subject: activity.subject,
            status: activity.status,
            priority: activity.priority,
            duration: activity.duration,
            assignedUser: {
              id: activity.assignedUserId,
              name: `User ${activity.assignedUserId}`, // Simplified
            },
            customer: activity.customerId
              ? {
                  id: activity.customerId,
                  name: `Customer ${activity.customerId}`, // Simplified
                }
              : undefined,
            deal: activity.dealId
              ? {
                  id: activity.dealId,
                  title: `Deal ${activity.dealId}`, // Simplified
                }
              : undefined,
          })),
      );
    }

    const report: ActivityReport = {
      reportMetadata: {
        generatedAt: new Date(),
        period: {
          startDate: validInput.startDate,
          endDate: validInput.endDate,
        },
        userId: validInput.userId,
        totalActivities,
      },
      summary: {
        totalActivities,
        completedActivities,
        pendingActivities,
        cancelledActivities,
        completionRate,
        averageDuration,
      },
      activityByType,
      activityByPriority,
      userPerformance,
      dailyActivity,
      topActivities,
    };

    return ok(report);
  } catch (error) {
    return err(
      new ApplicationError("Failed to generate activity report", error),
    );
  }
}
