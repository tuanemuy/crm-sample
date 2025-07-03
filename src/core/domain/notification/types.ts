import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Notification entity schema
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["reminder", "alert", "info", "success", "warning", "error"]),
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  isRead: z.boolean(),
  readAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Notification = z.infer<typeof notificationSchema>;

// Notification creation input schema
export const createNotificationInputSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["reminder", "alert", "info", "success", "warning", "error"]),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateNotificationInput = z.infer<
  typeof createNotificationInputSchema
>;

// Notification filter schema
export const notificationFilterSchema = z.object({
  type: z
    .enum(["reminder", "alert", "info", "success", "warning", "error"])
    .optional(),
  isRead: z.boolean().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export type NotificationFilter = z.infer<typeof notificationFilterSchema>;

// Notification list query schema
export const listNotificationsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: notificationFilterSchema.optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;

// Notification repository params
export const createNotificationParamsSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["reminder", "alert", "info", "success", "warning", "error"]),
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  isRead: z.boolean().default(false),
});

export type CreateNotificationParams = z.infer<
  typeof createNotificationParamsSchema
>;

// Mark notifications as read input
export const markAsReadInputSchema = z.object({
  notificationIds: z.array(z.string().uuid()),
});

export type MarkAsReadInput = z.infer<typeof markAsReadInputSchema>;

// Notification settings
export const notificationSettingsSchema = z.object({
  userId: z.string().uuid(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  reminderNotifications: z.boolean(),
  dealNotifications: z.boolean(),
  activityNotifications: z.boolean(),
  leadNotifications: z.boolean(),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

// Notification settings input schemas
export const createNotificationSettingsInputSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  reminderNotifications: z.boolean().default(true),
  dealNotifications: z.boolean().default(true),
  activityNotifications: z.boolean().default(true),
  leadNotifications: z.boolean().default(true),
});

export type CreateNotificationSettingsInput = z.infer<
  typeof createNotificationSettingsInputSchema
>;

export const updateNotificationSettingsInputSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  reminderNotifications: z.boolean().optional(),
  dealNotifications: z.boolean().optional(),
  activityNotifications: z.boolean().optional(),
  leadNotifications: z.boolean().optional(),
});

export type UpdateNotificationSettingsInput = z.infer<
  typeof updateNotificationSettingsInputSchema
>;
