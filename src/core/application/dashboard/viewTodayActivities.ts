import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Activity } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";

// Input schema for viewing today's activities
export const viewTodayActivitiesInputSchema = z.object({
  userId: z.string().uuid(),
  timezone: z.string().optional().default("UTC"),
});

export type ViewTodayActivitiesInput = z.infer<
  typeof viewTodayActivitiesInputSchema
>;

export type TodayActivitiesSummary = {
  activities: Activity[];
  summary: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    byType: {
      meetings: number;
      calls: number;
      emails: number;
      tasks: number;
      notes: number;
    };
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  upcomingHours: Array<{
    hour: number;
    activities: Activity[];
  }>;
};

export async function viewTodayActivities(
  context: Context,
  input: ViewTodayActivitiesInput,
): Promise<Result<TodayActivitiesSummary, ApplicationError>> {
  // Verify user exists
  const userResult = await context.userRepository.findById(input.userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to verify user", userResult.error));
  }
  if (!userResult.value) {
    return err(new ApplicationError("User not found"));
  }

  // Get today's date range
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // List activities for today
  const activitiesResult = await context.activityRepository.list({
    pagination: { page: 1, limit: 100, order: "asc", orderBy: "scheduledAt" },
    filter: {
      assignedUserId: input.userId,
      scheduledAfter: startOfDay,
      scheduledBefore: endOfDay,
    },
    sortBy: "scheduledAt",
    sortOrder: "asc",
  });

  if (activitiesResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get today's activities",
        activitiesResult.error,
      ),
    );
  }

  const activities = activitiesResult.value.items;

  // Calculate summary statistics
  const summary = {
    total: activities.length,
    completed: activities.filter((a) => a.status === "completed").length,
    pending: activities.filter(
      (a) => a.status === "planned" || a.status === "in_progress",
    ).length,
    overdue: activities.filter((a) => {
      if (a.status === "completed" || a.status === "cancelled") return false;
      if (!a.scheduledAt) return false;
      return a.scheduledAt < now;
    }).length,
    byType: {
      meetings: activities.filter((a) => a.type === "meeting").length,
      calls: activities.filter((a) => a.type === "call").length,
      emails: activities.filter((a) => a.type === "email").length,
      tasks: activities.filter((a) => a.type === "task").length,
      notes: activities.filter((a) => a.type === "note").length,
    },
    byPriority: {
      urgent: activities.filter((a) => a.priority === "urgent").length,
      high: activities.filter((a) => a.priority === "high").length,
      medium: activities.filter((a) => a.priority === "medium").length,
      low: activities.filter((a) => a.priority === "low").length,
    },
  };

  // Group activities by hour for timeline view
  const upcomingHours: Array<{ hour: number; activities: Activity[] }> = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourActivities = activities.filter((activity) => {
      if (!activity.scheduledAt) return false;
      const activityHour = new Date(activity.scheduledAt).getHours();
      return activityHour === hour;
    });
    if (hourActivities.length > 0) {
      upcomingHours.push({ hour, activities: hourActivities });
    }
  }

  return ok({
    activities,
    summary,
    upcomingHours,
  });
}
