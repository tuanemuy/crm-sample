import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Proposal entity schema
export const proposalSchema = z.object({
  id: z.string().uuid(),
  dealId: z.string().uuid(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z
    .enum([
      "draft",
      "pending_approval",
      "approved",
      "sent",
      "viewed",
      "accepted",
      "rejected",
      "expired",
    ])
    .default("draft"),
  type: z.enum(["proposal", "quote", "estimate"]).default("proposal"),
  templateId: z.string().uuid().optional(),
  validUntil: z.date().optional(),
  sentAt: z.date().optional(),
  viewedAt: z.date().optional(),
  respondedAt: z.date().optional(),
  subtotal: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxAmount: z.number().nonnegative().default(0),
  taxPercent: z.number().min(0).max(100).default(0),
  totalAmount: z.number().nonnegative().default(0),
  currency: z.string().length(3).default("USD"),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  version: z.number().int().positive().default(1),
  parentProposalId: z.string().uuid().optional(), // For revisions
  createdBy: z.string().uuid(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Proposal = z.infer<typeof proposalSchema>;

// Proposal Item entity schema
export const proposalItemSchema = z.object({
  id: z.string().uuid(),
  proposalId: z.string().uuid(),
  productId: z.string().uuid().optional(), // Reference to product catalog
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  lineTotal: z.number().nonnegative(),
  sortOrder: z.number().int().nonnegative().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProposalItem = z.infer<typeof proposalItemSchema>;

// Proposal Template entity schema
export const proposalTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  headerTemplate: z.string().max(10000).optional(),
  footerTemplate: z.string().max(10000).optional(),
  termsTemplate: z.string().max(5000).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProposalTemplate = z.infer<typeof proposalTemplateSchema>;

// Proposal with items
export const proposalWithItemsSchema = proposalSchema.extend({
  items: z.array(proposalItemSchema),
  deal: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      stage: z.string(),
    })
    .optional(),
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
  contact: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
  template: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
});
export type ProposalWithItems = z.infer<typeof proposalWithItemsSchema>;

// Create types
export const createProposalSchema = z.object({
  dealId: z.string().uuid(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["proposal", "quote", "estimate"]).default("proposal"),
  templateId: z.string().uuid().optional(),
  validUntil: z.date().optional(),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  currency: z.string().length(3).default("USD"),
  createdBy: z.string().uuid(),
});
export type CreateProposalParams = z.infer<typeof createProposalSchema>;

export const createProposalItemSchema = z.object({
  proposalId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().nonnegative().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateProposalItemParams = z.infer<typeof createProposalItemSchema>;

export const createProposalTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  headerTemplate: z.string().max(10000).optional(),
  footerTemplate: z.string().max(10000).optional(),
  termsTemplate: z.string().max(5000).optional(),
  isDefault: z.boolean().default(false),
  createdBy: z.string().uuid(),
});
export type CreateProposalTemplateParams = z.infer<
  typeof createProposalTemplateSchema
>;

// Update types
export const updateProposalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum([
      "draft",
      "pending_approval",
      "approved",
      "sent",
      "viewed",
      "accepted",
      "rejected",
      "expired",
    ])
    .optional(),
  validUntil: z.date().optional(),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  approvedBy: z.string().uuid().optional(),
});
export type UpdateProposalParams = z.infer<typeof updateProposalSchema>;

export const updateProposalItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateProposalItemParams = z.infer<typeof updateProposalItemSchema>;

// Query types
export const listProposalsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      dealId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
      status: z
        .enum([
          "draft",
          "pending_approval",
          "approved",
          "sent",
          "viewed",
          "accepted",
          "rejected",
          "expired",
        ])
        .optional(),
      type: z.enum(["proposal", "quote", "estimate"]).optional(),
      createdBy: z.string().uuid().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListProposalsQuery = z.infer<typeof listProposalsQuerySchema>;

// Analytics
export const proposalAnalyticsSchema = z.object({
  totalProposals: z.number().int(),
  proposalsByStatus: z.record(z.string(), z.number().int()),
  proposalsByType: z.record(z.string(), z.number().int()),
  totalValue: z.number(),
  averageValue: z.number(),
  acceptanceRate: z.number().min(0).max(100),
  averageResponseTime: z.number().nonnegative(), // in days
  monthlyTrend: z.array(
    z.object({
      month: z.string(),
      count: z.number().int(),
      value: z.number(),
    }),
  ),
});
export type ProposalAnalytics = z.infer<typeof proposalAnalyticsSchema>;
