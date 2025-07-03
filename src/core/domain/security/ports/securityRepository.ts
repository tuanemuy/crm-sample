import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateSecurityEventParams,
  ListSecurityEventsQuery,
  SecurityAlert,
  SecurityEvent,
  SecuritySettings,
  SecurityStats,
  UpdateSecuritySettingsParams,
} from "../types";

export interface SecurityRepository {
  // Security Settings
  getSecuritySettings(
    organizationId: string,
  ): Promise<Result<SecuritySettings | null, RepositoryError>>;

  updateSecuritySettings(
    organizationId: string,
    params: UpdateSecuritySettingsParams,
  ): Promise<Result<SecuritySettings, RepositoryError>>;

  createDefaultSecuritySettings(
    organizationId: string,
  ): Promise<Result<SecuritySettings, RepositoryError>>;

  // Security Events
  createSecurityEvent(
    params: CreateSecurityEventParams,
  ): Promise<Result<SecurityEvent, RepositoryError>>;

  listSecurityEvents(
    organizationId: string,
    query: ListSecurityEventsQuery,
  ): Promise<
    Result<{ items: SecurityEvent[]; count: number }, RepositoryError>
  >;

  findSecurityEventById(
    id: string,
  ): Promise<Result<SecurityEvent | null, RepositoryError>>;

  getSecurityStats(
    organizationId: string,
    days?: number,
  ): Promise<Result<SecurityStats, RepositoryError>>;

  // Security Alerts
  createSecurityAlert(
    organizationId: string,
    alertType: string,
    severity: string,
    title: string,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<Result<SecurityAlert, RepositoryError>>;

  listUnresolvedAlerts(
    organizationId: string,
  ): Promise<Result<SecurityAlert[], RepositoryError>>;

  resolveSecurityAlert(
    id: string,
    resolvedBy: string,
    resolutionNotes?: string,
  ): Promise<Result<SecurityAlert, RepositoryError>>;

  // Security Monitoring
  findFailedLoginsByUser(
    organizationId: string,
    userId: string,
    hours: number,
  ): Promise<Result<SecurityEvent[], RepositoryError>>;

  findSuspiciousActivity(
    organizationId: string,
    hours: number,
  ): Promise<Result<SecurityEvent[], RepositoryError>>;

  isIPBlocked(
    organizationId: string,
    ipAddress: string,
  ): Promise<Result<boolean, RepositoryError>>;

  blockIP(
    organizationId: string,
    ipAddress: string,
    reason: string,
  ): Promise<Result<void, RepositoryError>>;

  unblockIP(
    organizationId: string,
    ipAddress: string,
  ): Promise<Result<void, RepositoryError>>;

  // Password Security
  validatePasswordPolicy(
    organizationId: string,
    password: string,
  ): Promise<
    Result<{ isValid: boolean; violations: string[] }, RepositoryError>
  >;

  checkPasswordHistory(
    userId: string,
    passwordHash: string,
  ): Promise<Result<boolean, RepositoryError>>;

  savePasswordHistory(
    userId: string,
    passwordHash: string,
  ): Promise<Result<void, RepositoryError>>;

  // Session Management
  isSessionExpired(
    organizationId: string,
    lastActivity: Date,
  ): Promise<Result<boolean, RepositoryError>>;

  // Audit Logs
  cleanupOldEvents(
    organizationId: string,
  ): Promise<Result<number, RepositoryError>>;
}
