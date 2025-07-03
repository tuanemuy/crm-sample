import { and, asc, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import {
  type CreateNotificationParams,
  type CreateNotificationSettingsInput,
  type ListNotificationsQuery,
  type MarkAsReadInput,
  type Notification,
  type NotificationSettings,
  notificationSchema,
  notificationSettingsSchema,
  type UpdateNotificationSettingsInput,
} from "@/core/domain/notification/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { notificationSettings, notifications } from "./schema";

export class DrizzlePqliteNotificationRepository
  implements NotificationRepository
{
  constructor(private readonly db: Database) {}

  async create(
    params: CreateNotificationParams,
  ): Promise<Result<Notification, RepositoryError>> {
    try {
      const result = await this.db
        .insert(notifications)
        .values(params)
        .returning();

      const notification = result[0];
      if (!notification) {
        return err(new RepositoryError("Failed to create notification"));
      }

      return validate(notificationSchema, notification).mapErr((error) => {
        return new RepositoryError("Invalid notification data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create notification", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Notification | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(notificationSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid notification data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find notification", error));
    }
  }

  async list(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<
    Result<{ items: Notification[]; count: number }, RepositoryError>
  > {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      eq(notifications.userId, userId),
      filter?.type ? eq(notifications.type, filter.type) : undefined,
      filter?.isRead !== undefined
        ? eq(notifications.isRead, filter.isRead)
        : undefined,
      filter?.createdAfter
        ? gte(notifications.createdAt, filter.createdAfter)
        : undefined,
      filter?.createdBefore
        ? lte(notifications.createdAt, filter.createdBefore)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "title"
        ? notifications.title
        : sortBy === "updatedAt"
          ? notifications.updatedAt
          : notifications.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(notifications)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(notifications)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(notificationSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list notifications", error));
    }
  }

  async markAsRead(id: string): Promise<Result<Notification, RepositoryError>> {
    try {
      const result = await this.db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, id))
        .returning();

      const notification = result[0];
      if (!notification) {
        return err(new RepositoryError("Notification not found"));
      }

      return validate(notificationSchema, notification).mapErr((error) => {
        return new RepositoryError("Invalid notification data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to mark notification as read", error),
      );
    }
  }

  async markMultipleAsRead(
    params: MarkAsReadInput,
  ): Promise<Result<void, RepositoryError>> {
    try {
      if (params.notificationIds.length === 0) {
        return ok(undefined);
      }

      await this.db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(notifications.id, params.notificationIds));

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError(
          "Failed to mark multiple notifications as read",
          error,
        ),
      );
    }
  }

  async markAllAsRead(userId: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        );

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to mark all notifications as read", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(notifications)
        .where(eq(notifications.id, id))
        .returning({ id: notifications.id });

      if (result.length === 0) {
        return err(new RepositoryError("Notification not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete notification", error));
    }
  }

  async deleteAll(userId: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(notifications)
        .where(eq(notifications.userId, userId));

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to delete all notifications", error),
      );
    }
  }

  async findUnread(
    userId: string,
    limit = 10,
  ): Promise<Result<Notification[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(notificationSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find unread notifications", error),
      );
    }
  }

  async getUnreadCount(
    userId: string,
  ): Promise<Result<number, RepositoryError>> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        );

      return ok(result[0]?.count || 0);
    } catch (error) {
      return err(new RepositoryError("Failed to get unread count", error));
    }
  }

  async findByType(
    userId: string,
    type: string,
  ): Promise<Result<Notification[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(notifications)
        .where(
          and(eq(notifications.userId, userId), eq(notifications.type, type)),
        )
        .orderBy(desc(notifications.createdAt))
        .limit(50);

      return ok(
        result
          .map((item) => validate(notificationSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find notifications by type", error),
      );
    }
  }

  async cleanup(
    olderThanDays: number,
  ): Promise<Result<number, RepositoryError>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.db
        .delete(notifications)
        .where(
          and(
            lte(notifications.createdAt, cutoffDate),
            eq(notifications.isRead, true),
          ),
        )
        .returning({ id: notifications.id });

      return ok(result.length);
    } catch (error) {
      return err(new RepositoryError("Failed to cleanup notifications", error));
    }
  }

  // Notification settings management
  async getNotificationSettings(
    userId: string,
  ): Promise<Result<NotificationSettings | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(notificationSettingsSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid notification settings data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to get notification settings", error),
      );
    }
  }

  async createNotificationSettings(
    userId: string,
    input: CreateNotificationSettingsInput,
  ): Promise<Result<NotificationSettings, RepositoryError>> {
    try {
      const result = await this.db
        .insert(notificationSettings)
        .values({
          userId,
          emailNotifications: input.emailNotifications,
          pushNotifications: input.pushNotifications,
          reminderNotifications: input.reminderNotifications,
          dealNotifications: input.dealNotifications,
          activityNotifications: input.activityNotifications,
          leadNotifications: input.leadNotifications,
        })
        .returning();

      const settings = result[0];
      if (!settings) {
        return err(
          new RepositoryError("Failed to create notification settings"),
        );
      }

      return validate(notificationSettingsSchema, settings).mapErr((error) => {
        return new RepositoryError("Invalid notification settings data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to create notification settings", error),
      );
    }
  }

  async updateNotificationSettings(
    userId: string,
    input: UpdateNotificationSettingsInput,
  ): Promise<Result<NotificationSettings, RepositoryError>> {
    try {
      const updateData: Partial<typeof notificationSettings.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.emailNotifications !== undefined) {
        updateData.emailNotifications = input.emailNotifications;
      }
      if (input.pushNotifications !== undefined) {
        updateData.pushNotifications = input.pushNotifications;
      }
      if (input.reminderNotifications !== undefined) {
        updateData.reminderNotifications = input.reminderNotifications;
      }
      if (input.dealNotifications !== undefined) {
        updateData.dealNotifications = input.dealNotifications;
      }
      if (input.activityNotifications !== undefined) {
        updateData.activityNotifications = input.activityNotifications;
      }
      if (input.leadNotifications !== undefined) {
        updateData.leadNotifications = input.leadNotifications;
      }

      const result = await this.db
        .update(notificationSettings)
        .set(updateData)
        .where(eq(notificationSettings.userId, userId))
        .returning();

      const settings = result[0];
      if (!settings) {
        return err(new RepositoryError("Notification settings not found"));
      }

      return validate(notificationSettingsSchema, settings).mapErr((error) => {
        return new RepositoryError("Invalid notification settings data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update notification settings", error),
      );
    }
  }
}
