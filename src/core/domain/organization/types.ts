import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Organization entity schema
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  displayName: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).default("UTC"),
  currency: z.string().length(3).default("USD"), // ISO 4217 currency code
  language: z.string().length(2).default("en"), // ISO 639-1 language code
  logoUrl: z.string().url().optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Organization = z.infer<typeof organizationSchema>;

// Department entity schema
export const departmentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentDepartmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(), // User ID
  budget: z.number().positive().optional(),
  costCenter: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Department = z.infer<typeof departmentSchema>;

// Department with hierarchy
export const departmentWithHierarchySchema: z.ZodType<DepartmentWithHierarchy> =
  departmentSchema.extend({
    children: z.array(z.lazy(() => departmentWithHierarchySchema)).optional(),
    parent: z.lazy(() => departmentSchema).optional(),
    manager: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
      })
      .optional(),
  });

export type DepartmentWithHierarchy = Department & {
  children?: DepartmentWithHierarchy[];
  parent?: Department;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
};

// Organization settings
export const organizationSettingsSchema = z.object({
  // Business settings
  businessHours: z
    .object({
      monday: z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      }),
      tuesday: z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      }),
      wednesday: z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      }),
      thursday: z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      }),
      friday: z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      }),
      saturday: z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      }),
      sunday: z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      }),
    })
    .optional(),

  // Email settings
  emailSettings: z
    .object({
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUsername: z.string().optional(),
      smtpPassword: z.string().optional(),
      fromEmail: z.string().email().optional(),
      fromName: z.string().optional(),
    })
    .optional(),

  // Integration settings
  integrations: z
    .record(
      z.string(),
      z.object({
        enabled: z.boolean(),
        config: z.record(z.string(), z.unknown()),
      }),
    )
    .optional(),

  // Security settings
  security: z
    .object({
      passwordPolicy: z
        .object({
          minLength: z.number().min(4).default(8),
          requireUppercase: z.boolean().default(true),
          requireLowercase: z.boolean().default(true),
          requireNumbers: z.boolean().default(true),
          requireSpecialChars: z.boolean().default(false),
          maxAge: z.number().positive().optional(), // days
        })
        .optional(),
      sessionTimeout: z.number().positive().default(24), // hours
      maxLoginAttempts: z.number().positive().default(5),
      lockoutDuration: z.number().positive().default(30), // minutes
    })
    .optional(),

  // Notification settings
  notifications: z
    .object({
      enableEmailNotifications: z.boolean().default(true),
      enablePushNotifications: z.boolean().default(true),
      enableSmsNotifications: z.boolean().default(false),
      digestFrequency: z
        .enum(["immediate", "hourly", "daily", "weekly"])
        .default("daily"),
    })
    .optional(),
});
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

// Create types
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  displayName: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).default("UTC"),
  currency: z.string().length(3).default("USD"),
  language: z.string().length(2).default("en"),
  logoUrl: z.string().url().optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
});
export type CreateOrganizationParams = z.infer<typeof createOrganizationSchema>;

export const createDepartmentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentDepartmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  budget: z.number().positive().optional(),
  costCenter: z.string().max(50).optional(),
});
export type CreateDepartmentParams = z.infer<typeof createDepartmentSchema>;

// Update types
export const updateOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  displayName: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().length(3).optional(),
  language: z.string().length(2).optional(),
  logoUrl: z.string().url().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateOrganizationParams = z.infer<typeof updateOrganizationSchema>;

export const updateDepartmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  parentDepartmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  budget: z.number().positive().optional(),
  costCenter: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDepartmentParams = z.infer<typeof updateDepartmentSchema>;

// Query types
export const listOrganizationsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      keyword: z.string().optional(),
      industry: z.string().optional(),
      size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>;

export const listDepartmentsQuerySchema = z.object({
  organizationId: z.string().uuid(),
  pagination: paginationSchema,
  filter: z
    .object({
      parentDepartmentId: z.string().uuid().optional(),
      managerId: z.string().uuid().optional(),
      isActive: z.boolean().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;

// Settings update
export const updateOrganizationSettingsSchema = z.object({
  organizationId: z.string().uuid(),
  settings: organizationSettingsSchema.partial(),
});
export type UpdateOrganizationSettingsParams = z.infer<
  typeof updateOrganizationSettingsSchema
>;

// Analytics
export const organizationAnalyticsSchema = z.object({
  userCount: z.number().int(),
  departmentCount: z.number().int(),
  customerCount: z.number().int(),
  leadCount: z.number().int(),
  dealCount: z.number().int(),
  activeUserCount: z.number().int(),
  storageUsed: z.number(), // in bytes
  storageLimit: z.number().optional(), // in bytes
  lastActivity: z.date().optional(),
});
export type OrganizationAnalytics = z.infer<typeof organizationAnalyticsSchema>;
