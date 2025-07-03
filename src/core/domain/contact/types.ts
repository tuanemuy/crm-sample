import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Contact entity schema
export const contactSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  name: z.string(),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Contact = z.infer<typeof contactSchema>;

// Contact creation input schema
export const createContactInputSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(1).max(255),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export type CreateContactInput = z.infer<typeof createContactInputSchema>;

// Contact update input schema
export const updateContactInputSchema = createContactInputSchema
  .omit({ customerId: true })
  .partial();
export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

// Contact filter schema
export const contactFilterSchema = z.object({
  keyword: z.string().optional(),
  customerId: z.string().uuid().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

export type ContactFilter = z.infer<typeof contactFilterSchema>;

// Contact list query schema
export const listContactsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: contactFilterSchema.optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;

// Contact repository params
export const createContactParamsSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string(),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreateContactParams = z.infer<typeof createContactParamsSchema>;

export const updateContactParamsSchema = createContactParamsSchema
  .omit({ customerId: true })
  .partial();
export type UpdateContactParams = z.infer<typeof updateContactParamsSchema>;

// Contact with customer info
export const contactWithCustomerSchema = contactSchema.extend({
  customer: z.object({
    id: z.string().uuid(),
    name: z.string(),
    industry: z.string().optional(),
  }),
});

export type ContactWithCustomer = z.infer<typeof contactWithCustomerSchema>;
