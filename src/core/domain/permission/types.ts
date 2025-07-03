import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Permission entity schema
export const permissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  resource: z.string().min(1).max(100), // e.g., "users", "leads", "deals"
  action: z.string().min(1).max(100), // e.g., "read", "write", "delete"
  scope: z.enum(["global", "organization", "own"]).default("own"),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Permission = z.infer<typeof permissionSchema>;

// Role entity schema
export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isSystem: z.boolean().default(false), // システム定義のロール（削除不可）
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Role = z.infer<typeof roleSchema>;

// RolePermission association
export const rolePermissionSchema = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  createdAt: z.date(),
});
export type RolePermission = z.infer<typeof rolePermissionSchema>;

// UserRole association
export const userRoleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  assignedBy: z.string().uuid(),
  assignedAt: z.date(),
});
export type UserRole = z.infer<typeof userRoleSchema>;

// Role with permissions
export const roleWithPermissionsSchema = roleSchema.extend({
  permissions: z.array(permissionSchema),
});
export type RoleWithPermissions = z.infer<typeof roleWithPermissionsSchema>;

// User with roles and permissions
export const userWithRolesSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(roleWithPermissionsSchema),
  allPermissions: z.array(permissionSchema), // 全ロールから集約された権限
});
export type UserWithRoles = z.infer<typeof userWithRolesSchema>;

// Create types
export const createPermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  resource: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  scope: z.enum(["global", "organization", "own"]).default("own"),
  isActive: z.boolean().default(true),
});
export type CreatePermissionParams = z.infer<typeof createPermissionSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreateRoleParams = z.infer<typeof createRoleSchema>;

export const assignRoleToUserSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  assignedBy: z.string().uuid(),
});
export type AssignRoleToUserParams = z.infer<typeof assignRoleToUserSchema>;

export const assignPermissionToRoleSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});
export type AssignPermissionToRoleParams = z.infer<
  typeof assignPermissionToRoleSchema
>;

// Update types
export const updatePermissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  resource: z.string().min(1).max(100).optional(),
  action: z.string().min(1).max(100).optional(),
  scope: z.enum(["global", "organization", "own"]).optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePermissionParams = z.infer<typeof updatePermissionSchema>;

export const updateRoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRoleParams = z.infer<typeof updateRoleSchema>;

// Query types
export const listPermissionsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      resource: z.string().optional(),
      action: z.string().optional(),
      scope: z.enum(["global", "organization", "own"]).optional(),
      isActive: z.boolean().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListPermissionsQuery = z.infer<typeof listPermissionsQuerySchema>;

export const listRolesQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;

export const listUserRolesQuerySchema = z.object({
  userId: z.string().uuid(),
  pagination: paginationSchema,
});
export type ListUserRolesQuery = z.infer<typeof listUserRolesQuerySchema>;

// Permission checking
export const checkPermissionSchema = z.object({
  userId: z.string().uuid(),
  resource: z.string(),
  action: z.string(),
  resourceOwnerId: z.string().uuid().optional(), // ownスコープの場合に必要
});
export type CheckPermissionParams = z.infer<typeof checkPermissionSchema>;

// Common permission constants
export const RESOURCES = {
  USERS: "users",
  LEADS: "leads",
  CUSTOMERS: "customers",
  DEALS: "deals",
  ACTIVITIES: "activities",
  REPORTS: "reports",
  DOCUMENTS: "documents",
  NOTIFICATIONS: "notifications",
  SETTINGS: "settings",
} as const;

export const ACTIONS = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  MANAGE: "manage",
  EXPORT: "export",
  IMPORT: "import",
} as const;

export const SCOPES = {
  GLOBAL: "global",
  ORGANIZATION: "organization",
  OWN: "own",
} as const;
