import { z } from "zod/v4";

export const integrationTypeSchema = z.enum([
  "email",
  "calendar",
  "slack",
  "teams",
  "salesforce",
  "hubspot",
  "zapier",
  "webhook",
  "api",
  "database",
  "file_storage",
  "payment_gateway",
  "analytics",
  "social_media",
]);

export type IntegrationType = z.infer<typeof integrationTypeSchema>;

export const integrationStatusSchema = z.enum([
  "active",
  "inactive",
  "error",
  "pending",
  "configured",
]);

export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

export const integrationConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  endpoint: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  credentials: z.record(z.string(), z.string()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  syncInterval: z.number().int().min(0).optional(),
  isEnabled: z.boolean(),
});

export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;

export const integrationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: integrationTypeSchema,
  description: z.string().optional(),
  status: integrationStatusSchema,
  config: integrationConfigSchema,
  lastSyncAt: z.date().optional(),
  lastErrorMessage: z.string().optional(),
  isSystemwide: z.boolean(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Integration = z.infer<typeof integrationSchema>;

export const createIntegrationSchema = z.object({
  name: z.string().min(1).max(255),
  type: integrationTypeSchema,
  description: z.string().optional(),
  config: integrationConfigSchema,
  isSystemwide: z.boolean().optional(),
  createdBy: z.string().uuid(),
});

export type CreateIntegrationParams = z.infer<typeof createIntegrationSchema>;

export const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: integrationStatusSchema.optional(),
  config: integrationConfigSchema.optional(),
  lastSyncAt: z.date().optional(),
  lastErrorMessage: z.string().optional(),
  isSystemwide: z.boolean().optional(),
});

export type UpdateIntegrationParams = z.infer<typeof updateIntegrationSchema>;

export const listIntegrationsQuerySchema = z.object({
  type: integrationTypeSchema.optional(),
  status: integrationStatusSchema.optional(),
  isSystemwide: z.boolean().optional(),
});

export type ListIntegrationsQuery = z.infer<typeof listIntegrationsQuerySchema>;

export const testIntegrationSchema = z.object({
  id: z.string().uuid(),
});

export type TestIntegrationParams = z.infer<typeof testIntegrationSchema>;
