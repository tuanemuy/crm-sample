import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateNotificationParams,
  CreateNotificationSettingsInput,
  ListNotificationsQuery,
  MarkAsReadInput,
  Notification,
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from "../types";

export interface NotificationRepository {
  create(
    params: CreateNotificationParams,
  ): Promise<Result<Notification, RepositoryError>>;

  findById(id: string): Promise<Result<Notification | null, RepositoryError>>;

  list(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<Result<{ items: Notification[]; count: number }, RepositoryError>>;

  markAsRead(id: string): Promise<Result<Notification, RepositoryError>>;

  markMultipleAsRead(
    params: MarkAsReadInput,
  ): Promise<Result<void, RepositoryError>>;

  markAllAsRead(userId: string): Promise<Result<void, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  deleteAll(userId: string): Promise<Result<void, RepositoryError>>;

  findUnread(
    userId: string,
    limit?: number,
  ): Promise<Result<Notification[], RepositoryError>>;

  getUnreadCount(userId: string): Promise<Result<number, RepositoryError>>;

  findByType(
    userId: string,
    type: string,
  ): Promise<Result<Notification[], RepositoryError>>;

  cleanup(olderThanDays: number): Promise<Result<number, RepositoryError>>;

  // Notification settings management
  getNotificationSettings(
    userId: string,
  ): Promise<Result<NotificationSettings | null, RepositoryError>>;

  createNotificationSettings(
    userId: string,
    input: CreateNotificationSettingsInput,
  ): Promise<Result<NotificationSettings, RepositoryError>>;

  updateNotificationSettings(
    userId: string,
    input: UpdateNotificationSettingsInput,
  ): Promise<Result<NotificationSettings, RepositoryError>>;
}
