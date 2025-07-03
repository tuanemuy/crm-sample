import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// User entity schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
  role: z.enum(["admin", "manager", "user"]),
  isActive: z.boolean(),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// User without password (for API responses)
export const userWithoutPasswordSchema = userSchema.omit({
  passwordHash: true,
});
export type UserWithoutPassword = z.infer<typeof userWithoutPasswordSchema>;

// User creation input schema
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(255),
  role: z.enum(["admin", "manager", "user"]).default("user"),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// User update input schema
export const updateUserInputSchema = createUserInputSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// User filter schema
export const userFilterSchema = z.object({
  keyword: z.string().optional(),
  role: z.enum(["admin", "manager", "user"]).optional(),
  isActive: z.boolean().optional(),
});

export type UserFilter = z.infer<typeof userFilterSchema>;

// User list query schema
export const listUsersQuerySchema = z.object({
  pagination: paginationSchema,
  filter: userFilterSchema.optional(),
  sortBy: z
    .enum(["name", "email", "role", "createdAt", "updatedAt", "lastLoginAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// User repository params
export const createUserParamsSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
  role: z.enum(["admin", "manager", "user"]).default("user"),
  isActive: z.boolean().default(true),
});

export type CreateUserParams = z.infer<typeof createUserParamsSchema>;

export const updateUserParamsSchema = createUserParamsSchema.partial().extend({
  passwordHash: z.string().optional(),
});
export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;

// User profile
export const userProfileSchema = userSchema.extend({
  customerCount: z.number().optional(),
  leadCount: z.number().optional(),
  dealCount: z.number().optional(),
  activityCount: z.number().optional(),
  totalDealsValue: z.string().optional(),
  recentActivities: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.string(),
        subject: z.string(),
        createdAt: z.date(),
      }),
    )
    .optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Login tracking
export const updateLastLoginParamsSchema = z.object({
  userId: z.string().uuid(),
  lastLoginAt: z.date().default(() => new Date()),
});

export type UpdateLastLoginParams = z.infer<typeof updateLastLoginParamsSchema>;

// Authentication types
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authTokenSchema = z.object({
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
});

export type AuthToken = z.infer<typeof authTokenSchema>;

export const changePasswordInputSchema = z.object({
  userId: z.string().uuid(),
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(255),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
