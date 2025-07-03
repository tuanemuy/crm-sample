import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Lead entity schema
export const leadSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  status: z
    .enum(["new", "contacted", "qualified", "converted", "rejected"])
    .default("new"),
  score: z.number().int().min(0).max(100),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  assignedUserId: z.string().uuid().optional(),
  convertedCustomerId: z.string().uuid().optional(),
  convertedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Lead = z.infer<typeof leadSchema>;

// Lead creation input schema
export const createLeadInputSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  assignedUserId: z.string().uuid().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;

// Lead update input schema
export const updateLeadInputSchema = createLeadInputSchema.partial().extend({
  status: z
    .enum(["new", "contacted", "qualified", "converted", "rejected"])
    .optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadInputSchema>;

// Lead filter schema
export const leadFilterSchema = z.object({
  keyword: z.string().optional(),
  status: z
    .enum(["new", "contacted", "qualified", "converted", "rejected"])
    .optional(),
  source: z.string().optional(),
  industry: z.string().optional(),
  assignedUserId: z.string().uuid().optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export type LeadFilter = z.infer<typeof leadFilterSchema>;

// Lead list query schema
export const listLeadsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: leadFilterSchema.optional(),
  sortBy: z
    .enum([
      "firstName",
      "lastName",
      "company",
      "score",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

// Lead repository params
export const createLeadParamsSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  status: z
    .enum(["new", "contacted", "qualified", "converted", "rejected"])
    .default("new"),
  score: z.number().int().min(0).max(100).default(0),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  assignedUserId: z.string().uuid().optional(),
});

export type CreateLeadParams = z.infer<typeof createLeadParamsSchema>;

export const updateLeadParamsSchema = createLeadParamsSchema.partial().extend({
  convertedCustomerId: z.string().uuid().optional(),
  convertedAt: z.date().optional(),
});
export type UpdateLeadParams = z.infer<typeof updateLeadParamsSchema>;

// Lead conversion params
export const convertLeadInputSchema = z.object({
  customerId: z.string().uuid(),
  createContact: z.boolean().default(true),
  createDeal: z.boolean().default(false),
  dealInfo: z
    .object({
      title: z.string(),
      amount: z.string(),
      stage: z.string().optional(),
    })
    .optional(),
});

export type ConvertLeadInput = z.infer<typeof convertLeadInputSchema>;

// Lead with assigned user
export const leadWithUserSchema = leadSchema.extend({
  assignedUser: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
  convertedCustomer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
});

export type LeadWithUser = z.infer<typeof leadWithUserSchema>;

// Lead statistics
export const leadStatsSchema = z.object({
  totalLeads: z.number(),
  newLeads: z.number(),
  contactedLeads: z.number(),
  qualifiedLeads: z.number(),
  convertedLeads: z.number(),
  rejectedLeads: z.number(),
  averageScore: z.number(),
  conversionRate: z.number(),
  leadsBySource: z.record(z.string(), z.number()),
  leadsByIndustry: z.record(z.string(), z.number()),
  recentLeads: z.array(leadSchema),
});

export type LeadStats = z.infer<typeof leadStatsSchema>;

// Lead behavior tracking
export const leadBehaviorSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  type: z.enum([
    "page_view",
    "form_submit",
    "email_open",
    "email_click",
    "download",
  ]),
  action: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  score: z.number().int().default(0),
  occurredAt: z.date(),
  createdAt: z.date(),
});

export type LeadBehavior = z.infer<typeof leadBehaviorSchema>;

export const createLeadBehaviorParamsSchema = z.object({
  leadId: z.string().uuid(),
  type: z.enum([
    "page_view",
    "form_submit",
    "email_open",
    "email_click",
    "download",
  ]),
  action: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  score: z.number().int().default(0),
  occurredAt: z.date().default(() => new Date()),
});

export type CreateLeadBehaviorParams = z.infer<
  typeof createLeadBehaviorParamsSchema
>;
