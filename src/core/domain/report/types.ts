import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

export const reportTypeSchema = z.enum([
  "sales_performance",
  "sales_activity",
  "customer_analysis",
  "roi_analysis",
  "lead_conversion",
  "deal_pipeline",
  "user_activity",
  "custom",
]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportCategorySchema = z.enum([
  "sales",
  "marketing",
  "customer",
  "activity",
  "analytics",
]);
export type ReportCategory = z.infer<typeof reportCategorySchema>;

export const reportSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: reportTypeSchema,
  category: reportCategorySchema,
  config: z.record(z.string(), z.unknown()).optional(), // JSON configuration
  isTemplate: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(false),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Report = z.infer<typeof reportSchema>;

export const reportDataSchema = z.object({
  labels: z.array(z.string()),
  datasets: z.array(
    z.object({
      name: z.string(),
      data: z.array(z.number()),
      color: z.string().optional(),
    }),
  ),
  summary: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});
export type ReportData = z.infer<typeof reportDataSchema>;

export const reportFilterSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  userId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  dealStatus: z.string().optional(),
  leadStatus: z.string().optional(),
});
export type ReportFilter = z.infer<typeof reportFilterSchema>;

export const favoriteReportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  reportId: z.string().uuid(),
  createdAt: z.date(),
});
export type FavoriteReport = z.infer<typeof favoriteReportSchema>;

// Create types
export const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: reportTypeSchema,
  category: reportCategorySchema,
  config: z.record(z.string(), z.unknown()).optional(),
  isTemplate: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(false),
  createdBy: z.string().uuid(),
});
export type CreateReportParams = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateReportParams = z.infer<typeof updateReportSchema>;

// Query types
export const listReportsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      type: reportTypeSchema.optional(),
      category: reportCategorySchema.optional(),
      isTemplate: z.boolean().optional(),
      isPublic: z.boolean().optional(),
      createdBy: z.string().uuid().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

export const generateReportQuerySchema = z.object({
  reportId: z.string().uuid(),
  filter: reportFilterSchema.optional(),
});
export type GenerateReportQuery = z.infer<typeof generateReportQuerySchema>;

export const listFavoriteReportsQuerySchema = z.object({
  userId: z.string().uuid(),
  pagination: paginationSchema,
});
export type ListFavoriteReportsQuery = z.infer<
  typeof listFavoriteReportsQuerySchema
>;
