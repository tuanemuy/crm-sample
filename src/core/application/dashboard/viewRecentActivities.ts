import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Activity } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";

// Input schema for viewing recent activities
export const viewRecentActivitiesInputSchema = z.object({
  userId: z.string().uuid().optional(), // Optional: view all activities or user-specific
  pagination: paginationSchema
    .optional()
    .default({ page: 1, limit: 20, order: "desc", orderBy: "updatedAt" }),
  daysBack: z.number().int().positive().optional().default(7),
  includeCompleted: z.boolean().optional().default(true),
  types: z
    .array(z.enum(["email", "call", "meeting", "task", "note"]))
    .optional(),
});

export type ViewRecentActivitiesInput = z.infer<
  typeof viewRecentActivitiesInputSchema
>;

export type RecentActivitiesSummary = {
  activities: Array<{
    activity: Activity;
    customer?: {
      id: string;
      name: string;
    };
    contact?: {
      id: string;
      name: string;
    };
    deal?: {
      id: string;
      title: string;
      stage: string;
    };
    lead?: {
      id: string;
      name: string;
      status: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  stats: {
    totalActivities: number;
    completedActivities: number;
    byType: Record<string, number>;
    byUser: Array<{
      userId: string;
      userName: string;
      activityCount: number;
    }>;
  };
};

export async function viewRecentActivities(
  context: Context,
  input: ViewRecentActivitiesInput,
): Promise<Result<RecentActivitiesSummary, ApplicationError>> {
  // If userId is provided, verify user exists
  if (input.userId) {
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify user", userResult.error),
      );
    }
    if (!userResult.value) {
      return err(new ApplicationError("User not found"));
    }
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - input.daysBack);

  // Build filter
  const statusFilter = input.includeCompleted
    ? undefined
    : (["planned", "in_progress"] as Array<
        "planned" | "in_progress" | "completed" | "cancelled"
      >);

  // List recent activities
  const activitiesResult = await context.activityRepository.list({
    pagination: input.pagination,
    filter: {
      assignedUserId: input.userId,
      type: input.types?.[0], // Take first type if multiple provided
      status: statusFilter?.[0], // Take first status if multiple provided
      scheduledAfter: startDate,
      scheduledBefore: endDate,
    },
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  if (activitiesResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get recent activities",
        activitiesResult.error,
      ),
    );
  }

  const { items: activities, count } = activitiesResult.value;

  // Enrich activities with related entity information
  const enrichedActivities = await Promise.all(
    activities.map(async (activity) => {
      const enriched: RecentActivitiesSummary["activities"][0] = { activity };

      // Get customer info if linked
      if (activity.customerId) {
        const customerResult = await context.customerRepository.findById(
          activity.customerId,
        );
        if (customerResult.isOk() && customerResult.value) {
          enriched.customer = {
            id: customerResult.value.id,
            name: customerResult.value.name,
          };
        }
      }

      // Get contact info if linked
      if (activity.contactId) {
        const contactResult = await context.contactRepository.findById(
          activity.contactId,
        );
        if (contactResult.isOk() && contactResult.value) {
          enriched.contact = {
            id: contactResult.value.id,
            name: contactResult.value.name,
          };
        }
      }

      // Get deal info if linked
      if (activity.dealId) {
        const dealResult = await context.dealRepository.findById(
          activity.dealId,
        );
        if (dealResult.isOk() && dealResult.value) {
          enriched.deal = {
            id: dealResult.value.id,
            title: dealResult.value.title,
            stage: dealResult.value.stage,
          };
        }
      }

      // Get lead info if linked
      if (activity.leadId) {
        const leadResult = await context.leadRepository.findById(
          activity.leadId,
        );
        if (leadResult.isOk() && leadResult.value) {
          enriched.lead = {
            id: leadResult.value.id,
            name: `${leadResult.value.firstName} ${leadResult.value.lastName}`,
            status: leadResult.value.status,
          };
        }
      }

      return enriched;
    }),
  );

  // Calculate statistics
  const byType: Record<string, number> = {};
  const userActivityMap = new Map<
    string,
    { userName: string; count: number }
  >();

  activities.forEach((activity) => {
    // Count by type
    byType[activity.type] = (byType[activity.type] || 0) + 1;

    // Count by user (would need to fetch user names)
    const userId = activity.assignedUserId;
    const current = userActivityMap.get(userId) || {
      userName: "Unknown",
      count: 0,
    };
    userActivityMap.set(userId, {
      userName: current.userName,
      count: current.count + 1,
    });
  });

  const stats = {
    totalActivities: count,
    completedActivities: activities.filter((a) => a.status === "completed")
      .length,
    byType,
    byUser: Array.from(userActivityMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      activityCount: data.count,
    })),
  };

  const totalPages = Math.ceil(count / input.pagination.limit);

  return ok({
    activities: enrichedActivities,
    pagination: {
      page: input.pagination.page,
      limit: input.pagination.limit,
      totalPages,
      totalItems: count,
    },
    stats,
  });
}
