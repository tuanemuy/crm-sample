import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

export const campaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["email", "sms", "social", "event", "webinar"]),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.number().optional(),
  targetAudience: z.string().optional(),
  goal: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Campaign = z.infer<typeof campaignSchema>;

export const campaignLeadSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  leadId: z.string().uuid(),
  status: z.enum([
    "assigned",
    "contacted",
    "responded",
    "converted",
    "excluded",
  ]),
  assignedBy: z.string().uuid(),
  assignedAt: z.date(),
  lastContactedAt: z.date().optional(),
  responseAt: z.date().optional(),
  notes: z.string().optional(),
});
export type CampaignLead = z.infer<typeof campaignLeadSchema>;

// Create campaign input
export const createCampaignParamsSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["email", "sms", "social", "event", "webinar"]),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.number().optional(),
  targetAudience: z.string().optional(),
  goal: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdBy: z.string().uuid(),
});
export type CreateCampaignParams = z.infer<typeof createCampaignParamsSchema>;

// Update campaign input
export const updateCampaignParamsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["email", "sms", "social", "event", "webinar"]).optional(),
  status: z
    .enum(["draft", "active", "paused", "completed", "cancelled"])
    .optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.number().optional(),
  targetAudience: z.string().optional(),
  goal: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type UpdateCampaignParams = z.infer<typeof updateCampaignParamsSchema>;

// Assign leads to campaign input
export const assignLeadsToCampaignParamsSchema = z.object({
  campaignId: z.string().uuid(),
  leadIds: z.array(z.string().uuid()),
  assignedBy: z.string().uuid(),
  notes: z.string().optional(),
});
export type AssignLeadsToCampaignParams = z.infer<
  typeof assignLeadsToCampaignParamsSchema
>;

// List campaigns query
export const listCampaignsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      keyword: z.string().optional(),
      type: z.enum(["email", "sms", "social", "event", "webinar"]).optional(),
      status: z
        .enum(["draft", "active", "paused", "completed", "cancelled"])
        .optional(),
      createdBy: z.string().uuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["name", "type", "status", "startDate", "createdAt"])
        .default("createdAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;

// List campaign leads query
export const listCampaignLeadsQuerySchema = z.object({
  campaignId: z.string().uuid(),
  pagination: paginationSchema,
  filter: z
    .object({
      status: z
        .enum(["assigned", "contacted", "responded", "converted", "excluded"])
        .optional(),
      assignedBy: z.string().uuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["assignedAt", "lastContactedAt", "responseAt"])
        .default("assignedAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
export type ListCampaignLeadsQuery = z.infer<
  typeof listCampaignLeadsQuerySchema
>;

// Campaign with statistics
export const campaignWithStatsSchema = campaignSchema.extend({
  totalLeads: z.number().default(0),
  assignedLeads: z.number().default(0),
  contactedLeads: z.number().default(0),
  respondedLeads: z.number().default(0),
  convertedLeads: z.number().default(0),
  excludedLeads: z.number().default(0),
  conversionRate: z.number().default(0),
  responseRate: z.number().default(0),
});
export type CampaignWithStats = z.infer<typeof campaignWithStatsSchema>;
