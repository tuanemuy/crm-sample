import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Notification } from "@/core/domain/notification/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";

// Input schema for viewing important notifications
export const viewImportantNotificationsInputSchema = z.object({
  userId: z.string().uuid(),
  pagination: paginationSchema
    .optional()
    .default({ page: 1, limit: 10, order: "desc", orderBy: "createdAt" }),
  includeRead: z.boolean().optional().default(false),
  daysBack: z.number().int().positive().optional().default(7),
});

export type ViewImportantNotificationsInput = z.infer<
  typeof viewImportantNotificationsInputSchema
>;

export type ViewImportantNotificationsOutput = {
  items: Notification[];
  count: number;
  hasMore: boolean;
};

// Important notification types that require user attention
const IMPORTANT_TYPES = ["alert", "warning", "error"] as const;

export async function viewImportantNotifications(
  context: Context,
  input: ViewImportantNotificationsInput,
): Promise<Result<ViewImportantNotificationsOutput, ApplicationError>> {
  // Verify user exists
  const userResult = await context.userRepository.findById(input.userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to verify user", userResult.error));
  }
  if (!userResult.value) {
    return err(new ApplicationError("User not found"));
  }

  // Calculate date range for important notifications
  const createdAfter = new Date();
  createdAfter.setDate(createdAfter.getDate() - input.daysBack);

  // Get important notifications for each type
  const notificationPromises = IMPORTANT_TYPES.map(async (type) => {
    const result = await context.notificationRepository.list(input.userId, {
      pagination: { page: 1, limit: 100, order: "desc", orderBy: "createdAt" }, // Get up to 100 per type
      filter: {
        type,
        isRead: input.includeRead ? undefined : false,
        createdAfter,
      },
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    return result;
  });

  const results = await Promise.all(notificationPromises);

  // Check for errors
  const errorResult = results.find((result) => result.isErr());
  if (errorResult?.isErr()) {
    return err(
      new ApplicationError(
        "Failed to fetch important notifications",
        errorResult.error,
      ),
    );
  }

  // Combine and sort all important notifications
  const allNotifications: Notification[] = [];
  results.forEach((result) => {
    if (result.isOk()) {
      allNotifications.push(...result.value.items);
    }
  });

  // Sort by createdAt desc and apply pagination
  allNotifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const startIndex = (input.pagination.page - 1) * input.pagination.limit;
  const endIndex = startIndex + input.pagination.limit;
  const paginatedItems = allNotifications.slice(startIndex, endIndex);
  const hasMore = endIndex < allNotifications.length;

  return ok({
    items: paginatedItems,
    count: allNotifications.length,
    hasMore,
  });
}
