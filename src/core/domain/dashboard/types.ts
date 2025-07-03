import { z } from "zod/v4";

export const widgetTypeSchema = z.enum([
  "sales_overview",
  "recent_leads",
  "recent_deals",
  "activity_feed",
  "performance_metrics",
  "pipeline_chart",
  "revenue_chart",
  "task_list",
  "quick_actions",
  "contact_list",
  "calendar",
  "notifications",
]);

export type WidgetType = z.infer<typeof widgetTypeSchema>;

export const widgetConfigSchema = z.object({
  id: z.string().uuid(),
  type: widgetTypeSchema,
  title: z.string().min(1).max(255),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }),
  size: z.object({
    width: z.number().int().min(1).max(12),
    height: z.number().int().min(1).max(12),
  }),
  settings: z.record(z.string(), z.unknown()).optional(),
  isVisible: z.boolean(),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;

export const dashboardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  isDefault: z.boolean(),
  widgets: z.array(widgetConfigSchema),
  layout: z.enum(["grid", "fluid"]),
  gridSize: z.number().int().min(8).max(24),
  backgroundColor: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Dashboard = z.infer<typeof dashboardSchema>;

export const createDashboardSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  isDefault: z.boolean().optional(),
  widgets: z.array(widgetConfigSchema).optional(),
  layout: z.enum(["grid", "fluid"]).optional(),
  gridSize: z.number().int().min(8).max(24).optional(),
  backgroundColor: z.string().optional(),
});

export type CreateDashboardParams = z.infer<typeof createDashboardSchema>;

export const updateDashboardSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isDefault: z.boolean().optional(),
  widgets: z.array(widgetConfigSchema).optional(),
  layout: z.enum(["grid", "fluid"]).optional(),
  gridSize: z.number().int().min(8).max(24).optional(),
  backgroundColor: z.string().optional(),
});

export type UpdateDashboardParams = z.infer<typeof updateDashboardSchema>;

export const listDashboardsQuerySchema = z.object({
  userId: z.string().uuid(),
});

export type ListDashboardsQuery = z.infer<typeof listDashboardsQuerySchema>;

export const getDashboardQuerySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export type GetDashboardQuery = z.infer<typeof getDashboardQuerySchema>;
