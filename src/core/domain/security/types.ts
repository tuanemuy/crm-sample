import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Security Settings entity schema
export const securitySettingsSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  passwordMinLength: z.number().int().min(4).max(128),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireSpecialChars: z.boolean(),
  passwordExpirationDays: z.number().int().min(0).max(365).optional(),
  passwordHistoryCount: z.number().int().min(0).max(24),
  maxLoginAttempts: z.number().int().min(3).max(20),
  lockoutDurationMinutes: z.number().int().min(5).max(1440),
  sessionTimeoutMinutes: z.number().int().min(15).max(480),
  twoFactorRequired: z.boolean(),
  allowedEmailDomains: z.array(z.string()).optional(),
  blockedEmailDomains: z.array(z.string()).optional(),
  ipWhitelist: z.array(z.string()).optional(),
  ipBlacklist: z.array(z.string()).optional(),
  dataRetentionDays: z.number().int().min(30).max(2555), // 7 years max
  auditLogEnabled: z.boolean(),
  encryptionAtRest: z.boolean(),
  securityNotifications: z.boolean(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SecuritySettings = z.infer<typeof securitySettingsSchema>;

// Security configuration input schema
export const updateSecuritySettingsInputSchema = z.object({
  passwordMinLength: z.number().int().min(4).max(128).optional(),
  passwordRequireUppercase: z.boolean().optional(),
  passwordRequireLowercase: z.boolean().optional(),
  passwordRequireNumbers: z.boolean().optional(),
  passwordRequireSpecialChars: z.boolean().optional(),
  passwordExpirationDays: z.number().int().min(0).max(365).optional(),
  passwordHistoryCount: z.number().int().min(0).max(24).optional(),
  maxLoginAttempts: z.number().int().min(3).max(20).optional(),
  lockoutDurationMinutes: z.number().int().min(5).max(1440).optional(),
  sessionTimeoutMinutes: z.number().int().min(15).max(480).optional(),
  twoFactorRequired: z.boolean().optional(),
  allowedEmailDomains: z.array(z.string()).optional(),
  blockedEmailDomains: z.array(z.string()).optional(),
  ipWhitelist: z.array(z.string()).optional(),
  ipBlacklist: z.array(z.string()).optional(),
  dataRetentionDays: z.number().int().min(30).max(2555).optional(),
  auditLogEnabled: z.boolean().optional(),
  encryptionAtRest: z.boolean().optional(),
  securityNotifications: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
});

export type UpdateSecuritySettingsInput = z.infer<
  typeof updateSecuritySettingsInputSchema
>;

// Security Event entity schema
export const securityEventSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  eventType: z.enum([
    "login_success",
    "login_failed",
    "login_locked",
    "password_changed",
    "user_created",
    "user_deleted",
    "user_suspended",
    "user_activated",
    "permission_changed",
    "security_settings_changed",
    "suspicious_activity",
    "data_export",
    "data_import",
    "unauthorized_access_attempt",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  userId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  description: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.boolean(),
  createdAt: z.date(),
});

export type SecurityEvent = z.infer<typeof securityEventSchema>;

// Security Event creation params
export const createSecurityEventParamsSchema = z.object({
  organizationId: z.string().uuid(),
  eventType: z.enum([
    "login_success",
    "login_failed",
    "login_locked",
    "password_changed",
    "user_created",
    "user_deleted",
    "user_suspended",
    "user_activated",
    "permission_changed",
    "security_settings_changed",
    "suspicious_activity",
    "data_export",
    "data_import",
    "unauthorized_access_attempt",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  userId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  description: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.boolean(),
});

export type CreateSecurityEventParams = z.infer<
  typeof createSecurityEventParamsSchema
>;

// Security Event filter schema
export const securityEventFilterSchema = z.object({
  keyword: z.string().optional(),
  eventType: z
    .enum([
      "login_success",
      "login_failed",
      "login_locked",
      "password_changed",
      "user_created",
      "user_deleted",
      "user_suspended",
      "user_activated",
      "permission_changed",
      "security_settings_changed",
      "suspicious_activity",
      "data_export",
      "data_import",
      "unauthorized_access_attempt",
    ])
    .optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  userId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  success: z.boolean().optional(),
  ipAddress: z.string().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export type SecurityEventFilter = z.infer<typeof securityEventFilterSchema>;

// Security Event list query schema
export const listSecurityEventsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: securityEventFilterSchema.optional(),
  sortBy: z
    .enum(["eventType", "severity", "userId", "success", "createdAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListSecurityEventsQuery = z.infer<
  typeof listSecurityEventsQuerySchema
>;

// Password Policy validation
export const passwordPolicySchema = z.object({
  minLength: z.number().int().min(4).max(128),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  historyCount: z.number().int().min(0).max(24),
});

export type PasswordPolicy = z.infer<typeof passwordPolicySchema>;

// Security Statistics
export const securityStatsSchema = z.object({
  totalEvents: z.number(),
  eventsToday: z.number(),
  eventsThisWeek: z.number(),
  eventsThisMonth: z.number(),
  failedLogins: z.number(),
  successfulLogins: z.number(),
  lockedAccounts: z.number(),
  suspiciousActivities: z.number(),
  criticalEvents: z.number(),
  eventsByType: z.record(z.string(), z.number()),
  eventsBySeverity: z.record(z.string(), z.number()),
  dailyTrend: z.array(
    z.object({
      date: z.string(),
      events: z.number(),
      failedLogins: z.number(),
      suspiciousActivities: z.number(),
    }),
  ),
  topUsers: z.array(
    z.object({
      userId: z.string(),
      userName: z.string(),
      eventCount: z.number(),
      lastActivity: z.date(),
    }),
  ),
  topIPs: z.array(
    z.object({
      ipAddress: z.string(),
      eventCount: z.number(),
      lastActivity: z.date(),
      isBlocked: z.boolean(),
    }),
  ),
});

export type SecurityStats = z.infer<typeof securityStatsSchema>;

// Security Alert
export const securityAlertSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  alertType: z.enum([
    "multiple_failed_logins",
    "suspicious_login_location",
    "password_breach_attempt",
    "unusual_activity_pattern",
    "privileged_action",
    "data_access_anomaly",
    "security_settings_changed",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  title: z.string(),
  description: z.string(),
  userId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isResolved: z.boolean(),
  resolvedBy: z.string().uuid().optional(),
  resolvedAt: z.date().optional(),
  resolutionNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SecurityAlert = z.infer<typeof securityAlertSchema>;

// Security repository params
export const updateSecuritySettingsParamsSchema =
  updateSecuritySettingsInputSchema;
export type UpdateSecuritySettingsParams = z.infer<
  typeof updateSecuritySettingsParamsSchema
>;
