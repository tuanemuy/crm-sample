import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Contact History entity schema
export const contactHistorySchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  type: z.enum(["call", "email", "meeting", "note"]),
  subject: z.string(),
  content: z.string().optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  status: z.enum(["completed", "attempted", "failed"]).optional(),
  duration: z.number().int().optional(),
  contactedByUserId: z.string().uuid(),
  contactedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContactHistory = z.infer<typeof contactHistorySchema>;

// Contact History creation input schema
export const createContactHistoryInputSchema = z.object({
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  type: z.enum(["call", "email", "meeting", "note"]),
  subject: z.string().min(1).max(255),
  content: z.string().optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  status: z.enum(["completed", "attempted", "failed"]).optional(),
  duration: z.number().int().positive().optional(),
  contactedAt: z.date().optional(),
});

export type CreateContactHistoryInput = z.infer<
  typeof createContactHistoryInputSchema
>;

// Contact History update input schema
export const updateContactHistoryInputSchema =
  createContactHistoryInputSchema.partial();
export type UpdateContactHistoryInput = z.infer<
  typeof updateContactHistoryInputSchema
>;

// Contact History filter schema
export const contactHistoryFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  type: z.enum(["call", "email", "meeting", "note"]).optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  status: z.enum(["completed", "attempted", "failed"]).optional(),
  contactedByUserId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type ContactHistoryFilter = z.infer<typeof contactHistoryFilterSchema>;

// Contact History list query schema
export const listContactHistoryQuerySchema = z.object({
  pagination: paginationSchema,
  filter: contactHistoryFilterSchema.optional(),
  sortBy: z
    .enum(["contactedAt", "createdAt", "subject", "type"])
    .default("contactedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListContactHistoryQuery = z.infer<
  typeof listContactHistoryQuerySchema
>;

// Contact History repository params
export const createContactHistoryParamsSchema = z.object({
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  type: z.enum(["call", "email", "meeting", "note"]),
  subject: z.string(),
  content: z.string().optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  status: z.enum(["completed", "attempted", "failed"]).optional(),
  duration: z.number().int().optional(),
  contactedByUserId: z.string().uuid(),
  contactedAt: z.date(),
});

export type CreateContactHistoryParams = z.infer<
  typeof createContactHistoryParamsSchema
>;

export const updateContactHistoryParamsSchema =
  createContactHistoryParamsSchema.partial();
export type UpdateContactHistoryParams = z.infer<
  typeof updateContactHistoryParamsSchema
>;

// Contact History with related data
export const contactHistoryWithRelationsSchema = contactHistorySchema.extend({
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
      email: z.string().email().optional(),
    })
    .optional(),
  contactedByUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
});

export type ContactHistoryWithRelations = z.infer<
  typeof contactHistoryWithRelationsSchema
>;
