import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Customer entity schema
export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  industry: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  size: z
    .enum(["small", "medium", "large", "enterprise", "startup"])
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  location: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  foundedYear: z
    .number()
    .int()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  website: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  status: z
    .enum(["active", "inactive", "archived", "prospect"])
    .default("active"),
  parentCustomerId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  assignedUserId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Customer = z.infer<typeof customerSchema>;

// Helper type for creating customers in tests with only required fields
export type CustomerInput = {
  id: string;
  name: string;
  status?: "active" | "inactive" | "archived" | "prospect";
  industry?: string;
  size?: "small" | "medium" | "large" | "enterprise" | "startup";
  location?: string;
  foundedYear?: number;
  website?: string;
  description?: string;
  parentCustomerId?: string;
  assignedUserId?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Helper function to create a customer with proper defaults
export function createCustomerForTest(input: CustomerInput): Customer {
  return {
    id: input.id,
    name: input.name,
    status: input.status ?? "active",
    industry: input.industry ?? undefined,
    size: input.size ?? undefined,
    location: input.location ?? undefined,
    foundedYear: input.foundedYear ?? undefined,
    website: input.website ?? undefined,
    description: input.description ?? undefined,
    parentCustomerId: input.parentCustomerId ?? undefined,
    assignedUserId: input.assignedUserId ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

// Customer creation input schema
export const createCustomerInputSchema = z.object({
  name: z
    .string()
    .min(1, { message: "会社名は必須です" })
    .max(255, { message: "会社名は255文字以内で入力してください" }),
  industry: z.string().optional(),
  size: z
    .enum(["small", "medium", "large", "enterprise", "startup"])
    .optional(),
  location: z.string().optional(),
  foundedYear: z
    .number()
    .int({ message: "創業年は整数で入力してください" })
    .min(1800, { message: "創業年は1800年以降を入力してください" })
    .max(new Date().getFullYear(), {
      message: "創業年は今年以前の年を入力してください",
    })
    .optional(),
  website: z
    .string()
    .url({ message: "有効なURLを入力してください" })
    .optional(),
  description: z.string().optional(),
  parentCustomerId: z
    .string()
    .uuid({ message: "親顧客IDの形式が正しくありません" })
    .optional(),
  assignedUserId: z
    .string()
    .uuid({ message: "担当者IDの形式が正しくありません" })
    .optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Customer update input schema
export const updateCustomerInputSchema = createCustomerInputSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Customer search/filter query schema
export const customerFilterSchema = z.object({
  keyword: z.string().optional(),
  industry: z.string().optional(),
  size: z
    .enum(["small", "medium", "large", "enterprise", "startup"])
    .optional(),
  status: z.enum(["active", "inactive", "archived", "prospect"]).optional(),
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
  size: z
    .enum(["small", "medium", "large", "enterprise", "startup"])
    .optional(),
  location: z.string().optional(),
  foundedYear: z.number().int().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  status: z
    .enum(["active", "inactive", "archived", "prospect"])
    .default("active"),
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
        phone: z.string().optional(),
        isPrimary: z.boolean(),
        customerId: z.string().uuid(),
        isActive: z.boolean(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
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
        customerId: z.string().uuid(),
        probability: z.number().optional(),
        assignedUserId: z.string().uuid().optional(),
      }),
    )
    .optional(),
  activities: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.string(),
        subject: z.string(),
        scheduledAt: z.date().optional(),
        status: z.string(),
        customerId: z.string().uuid().optional(),
        assignedUserId: z.string().uuid().optional(),
      }),
    )
    .optional(),
  documents: z
    .array(
      z.object({
        id: z.string().uuid(),
        filename: z.string(),
        originalFilename: z.string(),
        mimeType: z.string(),
        size: z.number(),
        url: z.string(),
        description: z.string().optional(),
        name: z.string().optional(),
        entityType: z.string().optional(),
        createdAt: z.date(),
      }),
    )
    .optional(),
  assignedUser: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
      role: z.string(),
      isActive: z.boolean().optional(),
      createdAt: z.date().optional(),
    })
    .optional(),
  parentCustomer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      status: z.string(),
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
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
