import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Customer entity schema
export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  industry: z.string().optional(),
  size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
  location: z.string().optional(),
  foundedYear: z.number().int().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  parentCustomerId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Customer = z.infer<typeof customerSchema>;

// Customer creation input schema
export const createCustomerInputSchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.string().optional(),
  size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
  location: z.string().optional(),
  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  parentCustomerId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Customer update input schema
export const updateCustomerInputSchema = createCustomerInputSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Customer search/filter query schema
export const customerFilterSchema = z.object({
  keyword: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  assignedUserId: z.string().uuid().optional(),
  parentCustomerId: z.string().uuid().optional(),
});

export type CustomerFilter = z.infer<typeof customerFilterSchema>;

// Customer list query schema
export const listCustomersQuerySchema = z.object({
  pagination: paginationSchema,
  filter: customerFilterSchema.optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "industry"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

// Customer repository params
export const createCustomerParamsSchema = z.object({
  name: z.string(),
  industry: z.string().optional(),
  size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
  location: z.string().optional(),
  foundedYear: z.number().int().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  parentCustomerId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
});

export type CreateCustomerParams = z.infer<typeof createCustomerParamsSchema>;

export const updateCustomerParamsSchema = createCustomerParamsSchema.partial();
export type UpdateCustomerParams = z.infer<typeof updateCustomerParamsSchema>;

// Customer with related data
export const customerWithRelationsSchema = customerSchema.extend({
  contacts: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email().optional(),
        title: z.string().optional(),
        isPrimary: z.boolean(),
      }),
    )
    .optional(),
  deals: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        amount: z.string(),
        stage: z.string(),
      }),
    )
    .optional(),
  assignedUser: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
  parentCustomer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
  childCustomers: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
    )
    .optional(),
});

export type CustomerWithRelations = z.infer<typeof customerWithRelationsSchema>;

// Customer statistics
export const customerStatsSchema = z.object({
  totalCustomers: z.number(),
  activeCustomers: z.number(),
  inactiveCustomers: z.number(),
  archivedCustomers: z.number(),
  customersByIndustry: z.record(z.string(), z.number()),
  customersBySize: z.record(z.string(), z.number()),
  recentCustomers: z.array(customerSchema),
});

export type CustomerStats = z.infer<typeof customerStatsSchema>;
