import { and, count, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { SecurityRepository } from "@/core/domain/security/ports/securityRepository";
import type {
  CreateSecurityEventParams,
  ListSecurityEventsQuery,
  SecurityAlert,
  SecurityEvent,
  SecuritySettings,
  SecurityStats,
  UpdateSecuritySettingsParams,
} from "@/core/domain/security/types";
import {
  securityAlertSchema,
  securityEventSchema,
  securitySettingsSchema,
  securityStatsSchema,
} from "@/core/domain/security/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import {
  passwordHistory,
  securityAlerts,
  securityEvents,
  securitySettings,
  users,
} from "./schema";

export class DrizzlePgliteSecurityRepository implements SecurityRepository {
  constructor(private readonly db: Database) {}

  async getSecuritySettings(
    organizationId: string,
  ): Promise<Result<SecuritySettings | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(securitySettingsSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid security settings data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get security settings", error));
    }
  }

  async updateSecuritySettings(
    organizationId: string,
    params: UpdateSecuritySettingsParams,
  ): Promise<Result<SecuritySettings, RepositoryError>> {
    try {
      const result = await this.db
        .update(securitySettings)
        .set(params)
        .where(eq(securitySettings.organizationId, organizationId))
        .returning();

      const settings = result[0];
      if (!settings) {
        return err(new RepositoryError("Security settings not found"));
      }

      return validate(securitySettingsSchema, settings).mapErr((error) => {
        return new RepositoryError("Invalid security settings data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update security settings", error),
      );
    }
  }

  async createDefaultSecuritySettings(
    organizationId: string,
  ): Promise<Result<SecuritySettings, RepositoryError>> {
    try {
      const result = await this.db
        .insert(securitySettings)
        .values({
          organizationId,
          // Default values are set in the schema
        })
        .returning();

      const settings = result[0];
      if (!settings) {
        return err(
          new RepositoryError("Failed to create default security settings"),
        );
      }

      return validate(securitySettingsSchema, settings).mapErr((error) => {
        return new RepositoryError("Invalid security settings data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError(
          "Failed to create default security settings",
          error,
        ),
      );
    }
  }

  async createSecurityEvent(
    params: CreateSecurityEventParams,
  ): Promise<Result<SecurityEvent, RepositoryError>> {
    try {
      const result = await this.db
        .insert(securityEvents)
        .values(params)
        .returning();

      const event = result[0];
      if (!event) {
        return err(new RepositoryError("Failed to create security event"));
      }

      return validate(securityEventSchema, event).mapErr((error) => {
        return new RepositoryError("Invalid security event data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create security event", error));
    }
  }

  async listSecurityEvents(
    organizationId: string,
    query: ListSecurityEventsQuery,
  ): Promise<
    Result<{ items: SecurityEvent[]; count: number }, RepositoryError>
  > {
    try {
      const {
        pagination,
        filter,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;
      const { page = 1, limit: pageSize = 20 } = pagination;
      const offset = (page - 1) * pageSize;

      // Build where conditions
      const conditions: SQL[] = [
        eq(securityEvents.organizationId, organizationId),
      ];

      if (filter) {
        if (filter.keyword) {
          conditions.push(
            ilike(securityEvents.description, `%${filter.keyword}%`),
          );
        }
        if (filter.eventType) {
          conditions.push(eq(securityEvents.eventType, filter.eventType));
        }
        if (filter.severity) {
          conditions.push(eq(securityEvents.severity, filter.severity));
        }
        if (filter.userId) {
          conditions.push(eq(securityEvents.userId, filter.userId));
        }
        if (filter.targetUserId) {
          conditions.push(eq(securityEvents.targetUserId, filter.targetUserId));
        }
        if (filter.success !== undefined) {
          conditions.push(eq(securityEvents.success, filter.success));
        }
        if (filter.ipAddress) {
          conditions.push(eq(securityEvents.ipAddress, filter.ipAddress));
        }
        if (filter.createdAfter) {
          conditions.push(gte(securityEvents.createdAt, filter.createdAfter));
        }
        if (filter.createdBefore) {
          conditions.push(lte(securityEvents.createdAt, filter.createdBefore));
        }
      }

      // Get total count
      const countResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(and(...conditions));

      const totalCount = countResult[0]?.count || 0;

      // Get items with pagination and sorting
      const orderBy =
        sortOrder === "desc"
          ? desc(securityEvents[sortBy])
          : securityEvents[sortBy];

      const result = await this.db
        .select()
        .from(securityEvents)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      const events = result.map((event) => ({
        ...event,
        metadata: event.metadata || {},
      }));

      // Validate each event
      const validatedEvents: SecurityEvent[] = [];
      for (const event of events) {
        const validation = validate(securityEventSchema, event);
        if (validation.isOk()) {
          validatedEvents.push(validation.value);
        }
      }

      return ok({ items: validatedEvents, count: totalCount });
    } catch (error) {
      return err(new RepositoryError("Failed to list security events", error));
    }
  }

  async findSecurityEventById(
    id: string,
  ): Promise<Result<SecurityEvent | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(securityEvents)
        .where(eq(securityEvents.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const event = {
        ...result[0],
        metadata: result[0].metadata || {},
      };

      return validate(securityEventSchema, event).mapErr((error) => {
        return new RepositoryError("Invalid security event data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find security event", error));
    }
  }

  async getSecurityStats(
    organizationId: string,
    days = 30,
  ): Promise<Result<SecurityStats, RepositoryError>> {
    try {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Get total events count
      const totalEventsResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(eq(securityEvents.organizationId, organizationId));

      // Get events today
      const eventsTodayResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, startOfToday),
          ),
        );

      // Get events this week
      const eventsThisWeekResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, startOfWeek),
          ),
        );

      // Get events this month
      const eventsThisMonthResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, startOfMonth),
          ),
        );

      // Get failed logins
      const failedLoginsResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            eq(securityEvents.eventType, "login_failed"),
            gte(securityEvents.createdAt, daysAgo),
          ),
        );

      // Get successful logins
      const successfulLoginsResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            eq(securityEvents.eventType, "login_success"),
            gte(securityEvents.createdAt, daysAgo),
          ),
        );

      // Get locked accounts
      const lockedAccountsResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            eq(securityEvents.eventType, "login_locked"),
            gte(securityEvents.createdAt, daysAgo),
          ),
        );

      // Get suspicious activities
      const suspiciousActivitiesResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            eq(securityEvents.eventType, "suspicious_activity"),
            gte(securityEvents.createdAt, daysAgo),
          ),
        );

      // Get critical events
      const criticalEventsResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            eq(securityEvents.severity, "critical"),
            gte(securityEvents.createdAt, daysAgo),
          ),
        );

      // Get events by type
      const eventsByTypeResult = await this.db
        .select({
          eventType: securityEvents.eventType,
          count: count(),
        })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, daysAgo),
          ),
        )
        .groupBy(securityEvents.eventType);

      // Get events by severity
      const eventsBySeverityResult = await this.db
        .select({
          severity: securityEvents.severity,
          count: count(),
        })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, daysAgo),
          ),
        )
        .groupBy(securityEvents.severity);

      // Get daily trend
      const dailyTrendResult = await this.db
        .select({
          date: sql<string>`DATE(${securityEvents.createdAt})`,
          events: count(),
          failedLogins: sql<number>`COUNT(CASE WHEN ${securityEvents.eventType} = 'login_failed' THEN 1 END)`,
          suspiciousActivities: sql<number>`COUNT(CASE WHEN ${securityEvents.eventType} = 'suspicious_activity' THEN 1 END)`,
        })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, daysAgo),
          ),
        )
        .groupBy(sql`DATE(${securityEvents.createdAt})`)
        .orderBy(sql`DATE(${securityEvents.createdAt}) DESC`)
        .limit(days);

      // Get top users by event count
      const topUsersResult = await this.db
        .select({
          userId: securityEvents.userId,
          userName: users.name,
          eventCount: count(),
          lastActivity: sql<Date>`MAX(${securityEvents.createdAt})`,
        })
        .from(securityEvents)
        .leftJoin(users, eq(securityEvents.userId, users.id))
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, daysAgo),
          ),
        )
        .groupBy(securityEvents.userId, users.name)
        .orderBy(desc(count()))
        .limit(10);

      // Get top IPs by event count
      const topIPsResult = await this.db
        .select({
          ipAddress: securityEvents.ipAddress,
          eventCount: count(),
          lastActivity: sql<Date>`MAX(${securityEvents.createdAt})`,
        })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            gte(securityEvents.createdAt, daysAgo),
          ),
        )
        .groupBy(securityEvents.ipAddress)
        .orderBy(desc(count()))
        .limit(10);

      // Get security settings for IP blacklist check
      const securitySettingsResult = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      const ipBlacklist =
        (securitySettingsResult[0]?.ipBlacklist as string[]) || [];

      const stats = {
        totalEvents: totalEventsResult[0]?.count || 0,
        eventsToday: eventsTodayResult[0]?.count || 0,
        eventsThisWeek: eventsThisWeekResult[0]?.count || 0,
        eventsThisMonth: eventsThisMonthResult[0]?.count || 0,
        failedLogins: failedLoginsResult[0]?.count || 0,
        successfulLogins: successfulLoginsResult[0]?.count || 0,
        lockedAccounts: lockedAccountsResult[0]?.count || 0,
        suspiciousActivities: suspiciousActivitiesResult[0]?.count || 0,
        criticalEvents: criticalEventsResult[0]?.count || 0,
        eventsByType: eventsByTypeResult.reduce(
          (acc, item) => {
            acc[item.eventType] = item.count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        eventsBySeverity: eventsBySeverityResult.reduce(
          (acc, item) => {
            acc[item.severity] = item.count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        dailyTrend: dailyTrendResult.map((item) => ({
          date: item.date,
          events: item.events,
          failedLogins: item.failedLogins,
          suspiciousActivities: item.suspiciousActivities,
        })),
        topUsers: topUsersResult
          .filter((item) => item.userId)
          .map((item) => ({
            userId: item.userId as string,
            userName: item.userName || "Unknown",
            eventCount: item.eventCount,
            lastActivity: item.lastActivity,
          })),
        topIPs: topIPsResult
          .filter((item) => item.ipAddress)
          .map((item) => ({
            ipAddress: item.ipAddress as string,
            eventCount: item.eventCount,
            lastActivity: item.lastActivity,
            isBlocked: ipBlacklist.includes(item.ipAddress as string),
          })),
      };

      return validate(securityStatsSchema, stats).mapErr((error) => {
        return new RepositoryError("Invalid security stats data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get security stats", error));
    }
  }

  async createSecurityAlert(
    organizationId: string,
    alertType: string,
    severity: string,
    title: string,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<Result<SecurityAlert, RepositoryError>> {
    try {
      const result = await this.db
        .insert(securityAlerts)
        .values({
          organizationId,
          alertType,
          severity,
          title,
          description,
          metadata: metadata || {},
        })
        .returning();

      const alert = result[0];
      if (!alert) {
        return err(new RepositoryError("Failed to create security alert"));
      }

      return validate(securityAlertSchema, alert).mapErr((error) => {
        return new RepositoryError("Invalid security alert data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create security alert", error));
    }
  }

  async listUnresolvedAlerts(
    organizationId: string,
  ): Promise<Result<SecurityAlert[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(securityAlerts)
        .where(
          and(
            eq(securityAlerts.organizationId, organizationId),
            eq(securityAlerts.isResolved, false),
          ),
        )
        .orderBy(desc(securityAlerts.createdAt));

      const alerts = result.map((alert) => ({
        ...alert,
        metadata: alert.metadata || {},
      }));

      // Validate each alert
      const validatedAlerts: SecurityAlert[] = [];
      for (const alert of alerts) {
        const validation = validate(securityAlertSchema, alert);
        if (validation.isOk()) {
          validatedAlerts.push(validation.value);
        }
      }

      return ok(validatedAlerts);
    } catch (error) {
      return err(
        new RepositoryError("Failed to list unresolved alerts", error),
      );
    }
  }

  async resolveSecurityAlert(
    id: string,
    resolvedBy: string,
    resolutionNotes?: string,
  ): Promise<Result<SecurityAlert, RepositoryError>> {
    try {
      const result = await this.db
        .update(securityAlerts)
        .set({
          isResolved: true,
          resolvedBy,
          resolvedAt: new Date(),
          resolutionNotes,
          updatedAt: new Date(),
        })
        .where(eq(securityAlerts.id, id))
        .returning();

      const alert = result[0];
      if (!alert) {
        return err(new RepositoryError("Security alert not found"));
      }

      const alertWithMetadata = {
        ...alert,
        metadata: alert.metadata || {},
      };

      return validate(securityAlertSchema, alertWithMetadata).mapErr(
        (error) => {
          return new RepositoryError("Invalid security alert data", error);
        },
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to resolve security alert", error),
      );
    }
  }

  async findFailedLoginsByUser(
    organizationId: string,
    userId: string,
    hours: number,
  ): Promise<Result<SecurityEvent[], RepositoryError>> {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

      const result = await this.db
        .select()
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            eq(securityEvents.userId, userId),
            eq(securityEvents.eventType, "login_failed"),
            gte(securityEvents.createdAt, hoursAgo),
          ),
        )
        .orderBy(desc(securityEvents.createdAt));

      const events = result.map((event) => ({
        ...event,
        metadata: event.metadata || {},
      }));

      // Validate each event
      const validatedEvents: SecurityEvent[] = [];
      for (const event of events) {
        const validation = validate(securityEventSchema, event);
        if (validation.isOk()) {
          validatedEvents.push(validation.value);
        }
      }

      return ok(validatedEvents);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find failed logins by user", error),
      );
    }
  }

  async findSuspiciousActivity(
    organizationId: string,
    hours: number,
  ): Promise<Result<SecurityEvent[], RepositoryError>> {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

      const result = await this.db
        .select()
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            eq(securityEvents.eventType, "suspicious_activity"),
            gte(securityEvents.createdAt, hoursAgo),
          ),
        )
        .orderBy(desc(securityEvents.createdAt));

      const events = result.map((event) => ({
        ...event,
        metadata: event.metadata || {},
      }));

      // Validate each event
      const validatedEvents: SecurityEvent[] = [];
      for (const event of events) {
        const validation = validate(securityEventSchema, event);
        if (validation.isOk()) {
          validatedEvents.push(validation.value);
        }
      }

      return ok(validatedEvents);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find suspicious activity", error),
      );
    }
  }

  async isIPBlocked(
    organizationId: string,
    ipAddress: string,
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      if (result.length === 0) {
        return ok(false);
      }

      const settings = result[0];
      const ipBlacklist = (settings.ipBlacklist as string[]) || [];

      return ok(ipBlacklist.includes(ipAddress));
    } catch (error) {
      return err(
        new RepositoryError("Failed to check IP blocked status", error),
      );
    }
  }

  async blockIP(
    organizationId: string,
    ipAddress: string,
    reason: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      // Get current settings
      const settingsResult = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      if (settingsResult.length === 0) {
        return err(new RepositoryError("Security settings not found"));
      }

      const settings = settingsResult[0];
      const currentBlacklist = (settings.ipBlacklist as string[]) || [];

      // Add IP to blacklist if not already present
      if (!currentBlacklist.includes(ipAddress)) {
        const updatedBlacklist = [...currentBlacklist, ipAddress];

        await this.db
          .update(securitySettings)
          .set({
            ipBlacklist: updatedBlacklist,
            updatedAt: new Date(),
          })
          .where(eq(securitySettings.organizationId, organizationId));
      }

      // Create security event for IP blocking
      await this.createSecurityEvent({
        organizationId,
        eventType: "suspicious_activity",
        severity: "medium",
        description: `IP address ${ipAddress} was blocked. Reason: ${reason}`,
        metadata: { ipAddress, reason, action: "ip_blocked" },
        ipAddress,
        success: true,
      });

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to block IP address", error));
    }
  }

  async unblockIP(
    organizationId: string,
    ipAddress: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      // Get current settings
      const settingsResult = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      if (settingsResult.length === 0) {
        return err(new RepositoryError("Security settings not found"));
      }

      const settings = settingsResult[0];
      const currentBlacklist = (settings.ipBlacklist as string[]) || [];

      // Remove IP from blacklist
      const updatedBlacklist = currentBlacklist.filter(
        (ip) => ip !== ipAddress,
      );

      await this.db
        .update(securitySettings)
        .set({
          ipBlacklist: updatedBlacklist,
          updatedAt: new Date(),
        })
        .where(eq(securitySettings.organizationId, organizationId));

      // Create security event for IP unblocking
      await this.createSecurityEvent({
        organizationId,
        eventType: "security_settings_changed",
        severity: "low",
        description: `IP address ${ipAddress} was unblocked`,
        metadata: { ipAddress, action: "ip_unblocked" },
        ipAddress,
        success: true,
      });

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to unblock IP address", error));
    }
  }

  async validatePasswordPolicy(
    organizationId: string,
    password: string,
  ): Promise<
    Result<{ isValid: boolean; violations: string[] }, RepositoryError>
  > {
    try {
      const settingsResult = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      if (settingsResult.length === 0) {
        return err(new RepositoryError("Security settings not found"));
      }

      const settings = settingsResult[0];
      const violations: string[] = [];

      // Check minimum length
      if (password.length < settings.passwordMinLength) {
        violations.push(
          `Password must be at least ${settings.passwordMinLength} characters long`,
        );
      }

      // Check uppercase requirement
      if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
        violations.push("Password must contain at least one uppercase letter");
      }

      // Check lowercase requirement
      if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
        violations.push("Password must contain at least one lowercase letter");
      }

      // Check numbers requirement
      if (settings.passwordRequireNumbers && !/[0-9]/.test(password)) {
        violations.push("Password must contain at least one number");
      }

      // Check special characters requirement
      if (
        settings.passwordRequireSpecialChars &&
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)
      ) {
        violations.push("Password must contain at least one special character");
      }

      return ok({
        isValid: violations.length === 0,
        violations,
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to validate password policy", error),
      );
    }
  }

  async checkPasswordHistory(
    userId: string,
    passwordHash: string,
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      // Get user's organization to check settings
      const userResult = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        return err(new RepositoryError("User not found"));
      }

      // Get recent password history
      const historyResult = await this.db
        .select()
        .from(passwordHistory)
        .where(eq(passwordHistory.userId, userId))
        .orderBy(desc(passwordHistory.createdAt))
        .limit(24); // Max history count

      // Check if password hash exists in history
      const isReused = historyResult.some(
        (entry) => entry.passwordHash === passwordHash,
      );

      return ok(isReused);
    } catch (error) {
      return err(
        new RepositoryError("Failed to check password history", error),
      );
    }
  }

  async savePasswordHistory(
    userId: string,
    passwordHash: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      // Save new password to history
      await this.db.insert(passwordHistory).values({
        userId,
        passwordHash,
      });

      // Clean up old password history beyond the limit
      // Get user's organization settings for history count
      const userResult = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length > 0) {
        // Get all password history for this user
        const historyResult = await this.db
          .select()
          .from(passwordHistory)
          .where(eq(passwordHistory.userId, userId))
          .orderBy(desc(passwordHistory.createdAt));

        // Keep only the most recent entries (default 5)
        const historyCountLimit = 5; // Could get from security settings
        if (historyResult.length > historyCountLimit) {
          const idsToDelete = historyResult
            .slice(historyCountLimit)
            .map((entry) => entry.id);

          for (const id of idsToDelete) {
            await this.db
              .delete(passwordHistory)
              .where(eq(passwordHistory.id, id));
          }
        }
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to save password history", error));
    }
  }

  async isSessionExpired(
    organizationId: string,
    lastActivity: Date,
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const settingsResult = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      if (settingsResult.length === 0) {
        return err(new RepositoryError("Security settings not found"));
      }

      const settings = settingsResult[0];
      const timeoutMinutes = settings.sessionTimeoutMinutes;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - lastActivity.getTime();

      return ok(timeSinceLastActivity > timeoutMs);
    } catch (error) {
      return err(
        new RepositoryError("Failed to check session expiration", error),
      );
    }
  }

  async cleanupOldEvents(
    organizationId: string,
  ): Promise<Result<number, RepositoryError>> {
    try {
      const settingsResult = await this.db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, organizationId))
        .limit(1);

      if (settingsResult.length === 0) {
        return err(new RepositoryError("Security settings not found"));
      }

      const settings = settingsResult[0];
      const retentionDays = settings.dataRetentionDays;
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000,
      );

      // Count events to be deleted
      const countResult = await this.db
        .select({ count: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.organizationId, organizationId),
            lte(securityEvents.createdAt, cutoffDate),
          ),
        );

      const deleteCount = countResult[0]?.count || 0;

      // Delete old events
      if (deleteCount > 0) {
        await this.db
          .delete(securityEvents)
          .where(
            and(
              eq(securityEvents.organizationId, organizationId),
              lte(securityEvents.createdAt, cutoffDate),
            ),
          );
      }

      return ok(deleteCount);
    } catch (error) {
      return err(new RepositoryError("Failed to cleanup old events", error));
    }
  }
}
