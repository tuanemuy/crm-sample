import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Deal entity schema
export const dealSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  stage: z.enum([
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ]),
  amount: z.string(), // Decimal as string for precision
  probability: z.number().int().min(0).max(100),
  expectedCloseDate: z.date().optional(),
  actualCloseDate: z.date().optional(),
  description: z.string().optional(),
  competitors: z.array(z.string()),
  assignedUserId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Deal = z.infer<typeof dealSchema>;

// Deal creation input schema
export const createDealInputSchema = z.object({
  title: z.string().min(1).max(255),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  stage: z
    .enum(["prospecting", "qualification", "proposal", "negotiation"])
    .default("prospecting"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal")
    .default("0"),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: z.date().optional(),
  description: z.string().optional(),
  competitors: z.array(z.string()).default([]),
  assignedUserId: z.string().uuid(),
});

export type CreateDealInput = z.infer<typeof createDealInputSchema>;

// Deal update input schema
export const updateDealInputSchema = createDealInputSchema.partial().extend({
  stage: z
    .enum([
      "prospecting",
      "qualification",
      "proposal",
      "negotiation",
      "closed_won",
      "closed_lost",
    ])
    .optional(),
  actualCloseDate: z.date().optional(),
});

export type UpdateDealInput = z.infer<typeof updateDealInputSchema>;

// Deal filter schema
export const dealFilterSchema = z.object({
  keyword: z.string().optional(),
  stage: z
    .enum([
      "prospecting",
      "qualification",
      "proposal",
      "negotiation",
      "closed_won",
      "closed_lost",
    ])
    .optional(),
  customerId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  minProbability: z.number().int().min(0).max(100).optional(),
  maxProbability: z.number().int().min(0).max(100).optional(),
  expectedCloseBefore: z.date().optional(),
  expectedCloseAfter: z.date().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export type DealFilter = z.infer<typeof dealFilterSchema>;

// Deal list query schema
export const listDealsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: dealFilterSchema.optional(),
  sortBy: z
    .enum([
      "title",
      "amount",
      "probability",
      "expectedCloseDate",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>;

// Deal repository params
export const createDealParamsSchema = z.object({
  title: z.string(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  stage: z
    .enum([
      "prospecting",
      "qualification",
      "proposal",
      "negotiation",
      "closed_won",
      "closed_lost",
    ])
    .default("prospecting"),
  amount: z.string().default("0"),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: z.date().optional(),
  actualCloseDate: z.date().optional(),
  description: z.string().optional(),
  competitors: z.array(z.string()).default([]),
  assignedUserId: z.string().uuid(),
});

export type CreateDealParams = z.infer<typeof createDealParamsSchema>;

export const updateDealParamsSchema = createDealParamsSchema.partial();
export type UpdateDealParams = z.infer<typeof updateDealParamsSchema>;

// Deal with relationships
export const dealWithRelationsSchema = dealSchema.extend({
  customer: z.object({
    id: z.string().uuid(),
    name: z.string(),
    industry: z.string().optional(),
  }),
  contact: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email().optional(),
      title: z.string().optional(),
    })
    .optional(),
  assignedUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  activities: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.string(),
        subject: z.string(),
        scheduledAt: z.date().optional(),
        status: z.string(),
      }),
    )
    .optional(),
});

export type DealWithRelations = z.infer<typeof dealWithRelationsSchema>;

// Deal stage update
export const updateDealStageInputSchema = z.object({
  stage: z.enum([
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ]),
  probability: z.number().int().min(0).max(100).optional(),
  actualCloseDate: z.date().optional(),
  reason: z.string().optional(), // For closed_lost deals
});

export type UpdateDealStageInput = z.infer<typeof updateDealStageInputSchema>;

// Deal statistics
export const dealStatsSchema = z.object({
  totalDeals: z.number(),
  activeDeals: z.number(),
  wonDeals: z.number(),
  lostDeals: z.number(),
  totalValue: z.string(),
  wonValue: z.string(),
  lostValue: z.string(),
  avgDealSize: z.string(),
  winRate: z.number(),
  avgSalesCycle: z.number(), // in days
  dealsByStage: z.record(z.string(), z.number()),
  monthlyTrend: z.array(
    z.object({
      month: z.string(),
      count: z.number(),
      value: z.string(),
    }),
  ),
  topPerformers: z.array(
    z.object({
      userId: z.string(),
      userName: z.string(),
      dealCount: z.number(),
      totalValue: z.string(),
    }),
  ),
});

export type DealStats = z.infer<typeof dealStatsSchema>;

// Pipeline view data
export const pipelineStageSchema = z.object({
  stage: z.enum([
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ]),
  name: z.string(),
  deals: z.array(dealWithRelationsSchema),
  totalValue: z.string(),
  dealCount: z.number(),
});

export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export const pipelineDataSchema = z.object({
  stages: z.array(pipelineStageSchema),
  totalValue: z.string(),
  totalDeals: z.number(),
  conversionRates: z.record(z.string(), z.number()),
});

export type PipelineData = z.infer<typeof pipelineDataSchema>;
