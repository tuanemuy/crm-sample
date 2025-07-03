import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

export const emailTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  subject: z.string(),
  content: z.string(),
  type: z.enum(["marketing", "transactional", "newsletter"]),
  isActive: z.boolean(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type EmailTemplate = z.infer<typeof emailTemplateSchema>;

export const emailCampaignSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  templateId: z.string().uuid(),
  subject: z.string(),
  content: z.string(),
  status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]),
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  totalRecipients: z.number(),
  sentCount: z.number(),
  deliveredCount: z.number(),
  openedCount: z.number(),
  clickedCount: z.number(),
  bouncedCount: z.number(),
  unsubscribedCount: z.number(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type EmailCampaign = z.infer<typeof emailCampaignSchema>;

export const emailHistorySchema = z.object({
  id: z.string().uuid(),
  emailCampaignId: z.string().uuid(),
  leadId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  emailAddress: z.string().email(),
  subject: z.string(),
  content: z.string(),
  status: z.enum([
    "pending",
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "failed",
    "unsubscribed",
  ]),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  openedAt: z.date().optional(),
  clickedAt: z.date().optional(),
  bouncedAt: z.date().optional(),
  unsubscribedAt: z.date().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type EmailHistory = z.infer<typeof emailHistorySchema>;

// Create email template input
export const createEmailTemplateParamsSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["marketing", "transactional", "newsletter"]),
  createdBy: z.string().uuid(),
});
export type CreateEmailTemplateParams = z.infer<
  typeof createEmailTemplateParamsSchema
>;

// Update email template input
export const updateEmailTemplateParamsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  subject: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(["marketing", "transactional", "newsletter"]).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateEmailTemplateParams = z.infer<
  typeof updateEmailTemplateParamsSchema
>;

// Create email campaign input
export const createEmailCampaignParamsSchema = z.object({
  campaignId: z.string().uuid(),
  templateId: z.string().uuid(),
  subject: z.string().min(1),
  content: z.string().min(1),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdBy: z.string().uuid(),
});
export type CreateEmailCampaignParams = z.infer<
  typeof createEmailCampaignParamsSchema
>;

// Update email campaign input
export const updateEmailCampaignParamsSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  status: z
    .enum(["draft", "scheduled", "sending", "sent", "failed"])
    .optional(),
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  totalRecipients: z.number().optional(),
  sentCount: z.number().optional(),
  deliveredCount: z.number().optional(),
  openedCount: z.number().optional(),
  clickedCount: z.number().optional(),
  bouncedCount: z.number().optional(),
  unsubscribedCount: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type UpdateEmailCampaignParams = z.infer<
  typeof updateEmailCampaignParamsSchema
>;

// Record email history input
export const recordEmailHistoryParamsSchema = z.object({
  emailCampaignId: z.string().uuid(),
  leadId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  emailAddress: z.string().email(),
  subject: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).default({}),
});
export type RecordEmailHistoryParams = z.infer<
  typeof recordEmailHistoryParamsSchema
>;

// Update email status input
export const updateEmailStatusParamsSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending",
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "failed",
    "unsubscribed",
  ]),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type UpdateEmailStatusParams = z.infer<
  typeof updateEmailStatusParamsSchema
>;

// List email templates query
export const listEmailTemplatesQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      keyword: z.string().optional(),
      type: z.enum(["marketing", "transactional", "newsletter"]).optional(),
      isActive: z.boolean().optional(),
      createdBy: z.string().uuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["name", "type", "createdAt", "updatedAt"])
        .default("createdAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
export type ListEmailTemplatesQuery = z.infer<
  typeof listEmailTemplatesQuerySchema
>;

// List email campaigns query
export const listEmailCampaignsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      campaignId: z.string().uuid().optional(),
      templateId: z.string().uuid().optional(),
      status: z
        .enum(["draft", "scheduled", "sending", "sent", "failed"])
        .optional(),
      createdBy: z.string().uuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["sentAt", "scheduledAt", "createdAt", "updatedAt"])
        .default("createdAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
export type ListEmailCampaignsQuery = z.infer<
  typeof listEmailCampaignsQuerySchema
>;

// List email history query
export const listEmailHistoryQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      emailCampaignId: z.string().uuid().optional(),
      leadId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
      contactId: z.string().uuid().optional(),
      emailAddress: z.string().email().optional(),
      status: z
        .enum([
          "pending",
          "sent",
          "delivered",
          "opened",
          "clicked",
          "bounced",
          "failed",
          "unsubscribed",
        ])
        .optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["sentAt", "deliveredAt", "openedAt", "clickedAt", "createdAt"])
        .default("createdAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
export type ListEmailHistoryQuery = z.infer<typeof listEmailHistoryQuerySchema>;

// Email campaign with statistics
export const emailCampaignWithStatsSchema = emailCampaignSchema.extend({
  deliveryRate: z.number().default(0),
  openRate: z.number().default(0),
  clickRate: z.number().default(0),
  bounceRate: z.number().default(0),
  unsubscribeRate: z.number().default(0),
});
export type EmailCampaignWithStats = z.infer<
  typeof emailCampaignWithStatsSchema
>;

// Email history with lead information
export const emailHistoryWithLeadSchema = emailHistorySchema.extend({
  lead: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email().optional(),
      company: z.string().optional(),
      status: z.string(),
    })
    .optional(),
});
export type EmailHistoryWithLead = z.infer<typeof emailHistoryWithLeadSchema>;
