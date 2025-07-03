import { z } from "zod/v4";

export const dataTypeSchema = z.enum([
  "customers",
  "contacts",
  "leads",
  "deals",
  "activities",
  "users",
  "organizations",
  "proposals",
  "documents",
  "all",
]);

export type DataType = z.infer<typeof dataTypeSchema>;

export const formatSchema = z.enum(["csv", "json", "xlsx", "xml"]);

export type Format = z.infer<typeof formatSchema>;

export const operationTypeSchema = z.enum(["import", "export"]);

export type OperationType = z.infer<typeof operationTypeSchema>;

export const statusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export type Status = z.infer<typeof statusSchema>;

export const importExportJobSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  operationType: operationTypeSchema,
  dataType: dataTypeSchema,
  format: formatSchema,
  fileName: z.string(),
  filePath: z.string().optional(),
  status: statusSchema,
  totalRecords: z.number().int().min(0).optional(),
  processedRecords: z.number().int().min(0).optional(),
  errorRecords: z.number().int().min(0).optional(),
  errorMessage: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ImportExportJob = z.infer<typeof importExportJobSchema>;

export const createImportJobSchema = z.object({
  userId: z.string().uuid(),
  dataType: dataTypeSchema,
  format: formatSchema,
  fileName: z.string(),
  filePath: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type CreateImportJobParams = z.infer<typeof createImportJobSchema>;

export const createExportJobSchema = z.object({
  userId: z.string().uuid(),
  dataType: dataTypeSchema,
  format: formatSchema,
  fileName: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type CreateExportJobParams = z.infer<typeof createExportJobSchema>;

export const updateJobSchema = z.object({
  status: statusSchema.optional(),
  totalRecords: z.number().int().min(0).optional(),
  processedRecords: z.number().int().min(0).optional(),
  errorRecords: z.number().int().min(0).optional(),
  errorMessage: z.string().optional(),
  filePath: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type UpdateJobParams = z.infer<typeof updateJobSchema>;

export const listJobsQuerySchema = z.object({
  userId: z.string().uuid(),
  operationType: operationTypeSchema.optional(),
  dataType: dataTypeSchema.optional(),
  status: statusSchema.optional(),
});

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;

export const importConfigSchema = z.object({
  delimiter: z.string().optional(),
  encoding: z.string().optional(),
  hasHeaders: z.boolean().optional(),
  skipRows: z.number().int().min(0).optional(),
  columnMapping: z.record(z.string(), z.string()).optional(),
  validateOnly: z.boolean().optional(),
});

export type ImportConfig = z.infer<typeof importConfigSchema>;

export const exportConfigSchema = z.object({
  includeHeaders: z.boolean().optional(),
  encoding: z.string().optional(),
  dateFormat: z.string().optional(),
  delimiter: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export type ExportConfig = z.infer<typeof exportConfigSchema>;
