import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Approval entity schema
export const approvalSchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum(["deal", "proposal", "contract", "discount"]),
  entityId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  requestedBy: z.string().uuid(),
  assignedTo: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  requestData: z.record(z.string(), z.any()).optional(), // Flexible data for different approval types
  approverComments: z.string().optional(),
  approvedAt: z.date().optional(),
  rejectedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Approval = z.infer<typeof approvalSchema>;

// Approval creation input schema
export const createApprovalInputSchema = z.object({
  entityType: z.enum(["deal", "proposal", "contract", "discount"]),
  entityId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  assignedTo: z.string().uuid(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  requestData: z.record(z.string(), z.any()).optional(),
  dueDate: z.date().optional(),
});

export type CreateApprovalInput = z.infer<typeof createApprovalInputSchema>;

// Approval update input schema
export const updateApprovalInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  requestData: z.record(z.string(), z.any()).optional(),
  dueDate: z.date().optional(),
});

export type UpdateApprovalInput = z.infer<typeof updateApprovalInputSchema>;

// Approval filter schema
export const approvalFilterSchema = z.object({
  keyword: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  entityType: z.enum(["deal", "proposal", "contract", "discount"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  requestedBy: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  dueBefore: z.date().optional(),
  dueAfter: z.date().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export type ApprovalFilter = z.infer<typeof approvalFilterSchema>;

// Approval list query schema
export const listApprovalsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: approvalFilterSchema.optional(),
  sortBy: z
    .enum(["title", "status", "priority", "dueDate", "createdAt", "updatedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListApprovalsQuery = z.infer<typeof listApprovalsQuerySchema>;

// Approval repository params
export const createApprovalParamsSchema = z.object({
  entityType: z.enum(["deal", "proposal", "contract", "discount"]),
  entityId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  requestedBy: z.string().uuid(),
  assignedTo: z.string().uuid(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  requestData: z.record(z.string(), z.any()).optional(),
  dueDate: z.date().optional(),
});

export type CreateApprovalParams = z.infer<typeof createApprovalParamsSchema>;

export const updateApprovalParamsSchema = createApprovalParamsSchema.partial();
export type UpdateApprovalParams = z.infer<typeof updateApprovalParamsSchema>;

// Approval action schemas
export const approveApprovalInputSchema = z.object({
  comments: z.string().max(1000).optional(),
});

export type ApproveApprovalInput = z.infer<typeof approveApprovalInputSchema>;

export const rejectApprovalInputSchema = z.object({
  comments: z.string().min(1).max(1000),
  reason: z.string().min(1).max(255),
});

export type RejectApprovalInput = z.infer<typeof rejectApprovalInputSchema>;

// Approval with relationships
export const approvalWithRelationsSchema = approvalSchema.extend({
  requestedByUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  assignedToUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  entity: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      type: z.string(),
    })
    .optional(),
});

export type ApprovalWithRelations = z.infer<typeof approvalWithRelationsSchema>;

// Approval statistics
export const approvalStatsSchema = z.object({
  totalApprovals: z.number(),
  pendingApprovals: z.number(),
  approvedApprovals: z.number(),
  rejectedApprovals: z.number(),
  cancelledApprovals: z.number(),
  averageApprovalTime: z.number(), // in hours
  approvalsByPriority: z.record(z.string(), z.number()),
  approvalsByEntityType: z.record(z.string(), z.number()),
  monthlyTrend: z.array(
    z.object({
      month: z.string(),
      pending: z.number(),
      approved: z.number(),
      rejected: z.number(),
    }),
  ),
  topApprovers: z.array(
    z.object({
      userId: z.string(),
      userName: z.string(),
      approvalCount: z.number(),
      averageTime: z.number(),
    }),
  ),
});

export type ApprovalStats = z.infer<typeof approvalStatsSchema>;
