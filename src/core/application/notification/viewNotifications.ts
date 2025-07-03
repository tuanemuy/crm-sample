import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Notification } from "@/core/domain/notification/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";

// Input schema for viewing notifications
export const viewNotificationsInputSchema = z.object({
  userId: z.string().uuid(),
  pagination: paginationSchema
    .optional()
    .default({ page: 1, limit: 20, order: "desc", orderBy: "createdAt" }),
  filter: z
    .object({
      type: z
        .enum(["reminder", "alert", "info", "success", "warning", "error"])
        .optional(),
      isRead: z.boolean().optional(),
      createdAfter: z.string().datetime().optional(),
      createdBefore: z.string().datetime().optional(),
    })
    .optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ViewNotificationsInput = z.infer<
  typeof viewNotificationsInputSchema
>;

export type ViewNotificationsOutput = {
  items: Notification[];
  count: number;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function viewNotifications(
  context: Context,
  input: ViewNotificationsInput,
): Promise<Result<ViewNotificationsOutput, ApplicationError>> {
  // Verify user exists
  const userResult = await context.userRepository.findById(input.userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to verify user", userResult.error));
  }
  if (!userResult.value) {
    return err(new ApplicationError("User not found"));
  }

  // Get notifications list
  const listResult = await context.notificationRepository.list(input.userId, {
    pagination: input.pagination,
    filter: {
      type: input.filter?.type,
      isRead: input.filter?.isRead,
      createdAfter: input.filter?.createdAfter
        ? new Date(input.filter.createdAfter)
        : undefined,
      createdBefore: input.filter?.createdBefore
        ? new Date(input.filter.createdBefore)
        : undefined,
    },
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
  });

  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to list notifications", listResult.error),
    );
  }

  // Get unread count
  const unreadCountResult = await context.notificationRepository.getUnreadCount(
    input.userId,
  );

  if (unreadCountResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get unread count",
        unreadCountResult.error,
      ),
    );
  }

  const { items, count } = listResult.value;
  const totalPages = Math.ceil(count / input.pagination.limit);

  return ok({
    items,
    count,
    unreadCount: unreadCountResult.value,
    pagination: {
      page: input.pagination.page,
      limit: input.pagination.limit,
      totalPages,
    },
  });
}
