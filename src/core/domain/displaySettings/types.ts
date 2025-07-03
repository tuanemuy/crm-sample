import { z } from "zod/v4";

export const displaySettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  theme: z.enum(["light", "dark", "auto"]),
  language: z.enum(["ja", "en"]),
  dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"]),
  timeFormat: z.enum(["24h", "12h"]),
  timezone: z.string(),
  currency: z.enum(["JPY", "USD", "EUR"]),
  itemsPerPage: z.number().int().min(10).max(100),
  enableNotifications: z.boolean(),
  enableEmailNotifications: z.boolean(),
  compactMode: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DisplaySettings = z.infer<typeof displaySettingsSchema>;

export const createDisplaySettingsSchema = z.object({
  userId: z.string().uuid(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
  language: z.enum(["ja", "en"]).optional(),
  dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"]).optional(),
  timeFormat: z.enum(["24h", "12h"]).optional(),
  timezone: z.string().optional(),
  currency: z.enum(["JPY", "USD", "EUR"]).optional(),
  itemsPerPage: z.number().int().min(10).max(100).optional(),
  enableNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  compactMode: z.boolean().optional(),
});

export type CreateDisplaySettingsParams = z.infer<
  typeof createDisplaySettingsSchema
>;

export const updateDisplaySettingsSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]).optional(),
  language: z.enum(["ja", "en"]).optional(),
  dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"]).optional(),
  timeFormat: z.enum(["24h", "12h"]).optional(),
  timezone: z.string().optional(),
  currency: z.enum(["JPY", "USD", "EUR"]).optional(),
  itemsPerPage: z.number().int().min(10).max(100).optional(),
  enableNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  compactMode: z.boolean().optional(),
});

export type UpdateDisplaySettingsParams = z.infer<
  typeof updateDisplaySettingsSchema
>;

export const getDisplaySettingsQuerySchema = z.object({
  userId: z.string().uuid(),
});

export type GetDisplaySettingsQuery = z.infer<
  typeof getDisplaySettingsQuerySchema
>;
