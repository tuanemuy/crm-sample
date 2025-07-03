import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type {
  SecuritySettings,
  UpdateSecuritySettingsInput,
} from "@/core/domain/security/types";
import { ApplicationError, type RepositoryError } from "@/lib/error";

export async function configureSecuritySettings(
  context: Context,
  userId: string,
  organizationId: string,
  input: UpdateSecuritySettingsInput,
): Promise<Result<SecuritySettings, ApplicationError>> {
  // Check if user has admin permissions
  const permissions =
    await context.permissionRepository.getUserPermissions(userId);
  if (permissions.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check user permissions",
        permissions.error,
      ),
    );
  }

  const hasAdminPermission = permissions.value.some(
    (permission) =>
      permission.name === "admin" || permission.name === "manage_security",
  );

  if (!hasAdminPermission) {
    return err(
      new ApplicationError(
        "User does not have permission to configure security settings",
      ),
    );
  }

  // Validate organization exists
  const organization =
    await context.organizationRepository.findOrganizationById(organizationId);
  if (organization.isErr()) {
    return err(
      new ApplicationError(
        "Failed to validate organization",
        organization.error,
      ),
    );
  }
  if (!organization.value) {
    return err(new ApplicationError("Organization not found"));
  }

  // Validate security settings input
  const validationResult = validateSecuritySettings(input);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  // Get current settings or create default if they don't exist
  const currentSettings =
    await context.securityRepository.getSecuritySettings(organizationId);
  if (currentSettings.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get current security settings",
        currentSettings.error,
      ),
    );
  }

  let updatedSettings: Result<SecuritySettings, RepositoryError>;

  if (!currentSettings.value) {
    // Create default settings first
    const defaultSettings =
      await context.securityRepository.createDefaultSecuritySettings(
        organizationId,
      );
    if (defaultSettings.isErr()) {
      return err(
        new ApplicationError(
          "Failed to create default security settings",
          defaultSettings.error,
        ),
      );
    }

    // Then update with provided input
    updatedSettings = await context.securityRepository.updateSecuritySettings(
      organizationId,
      input,
    );
  } else {
    // Update existing settings
    updatedSettings = await context.securityRepository.updateSecuritySettings(
      organizationId,
      input,
    );
  }

  if (updatedSettings.isErr()) {
    return err(
      new ApplicationError(
        "Failed to update security settings",
        updatedSettings.error,
      ),
    );
  }

  // Log security event
  const eventResult = await context.securityRepository.createSecurityEvent({
    organizationId,
    eventType: "security_settings_changed",
    severity: "medium",
    userId,
    description: `Security settings updated by user ${userId}`,
    metadata: {
      changedFields: Object.keys(input),
      previousSettings: currentSettings.value,
      newSettings: updatedSettings.value,
    },
    success: true,
  });

  if (eventResult.isErr()) {
    // Log the error but don't fail the settings update
    console.error("Failed to log security event:", eventResult.error);
  }

  // Send notification to other admins
  const adminUsers = await context.userRepository.findByRole("admin");
  if (adminUsers.isOk() && adminUsers.value.length > 0) {
    for (const admin of adminUsers.value) {
      if (admin.id !== userId) {
        await context.notificationRepository.create({
          userId: admin.id,
          type: "alert",
          title: "Security Settings Updated",
          message: `Security settings have been updated by ${userId}. Please review the changes.`,
          metadata: {
            entityType: "security_settings",
            entityId: organizationId,
            priority: "medium",
          },
          isRead: false,
        });
      }
    }
  }

  return ok(updatedSettings.value);
}

function validateSecuritySettings(
  input: UpdateSecuritySettingsInput,
): Result<void, ApplicationError> {
  // Validate password policy consistency
  if (input.passwordMinLength !== undefined && input.passwordMinLength < 4) {
    return err(
      new ApplicationError(
        "Password minimum length must be at least 4 characters",
      ),
    );
  }

  if (
    input.passwordExpirationDays !== undefined &&
    input.passwordExpirationDays === 0
  ) {
    return err(
      new ApplicationError(
        "Password expiration must be disabled (null) or at least 1 day",
      ),
    );
  }

  if (input.maxLoginAttempts !== undefined && input.maxLoginAttempts < 3) {
    return err(
      new ApplicationError("Maximum login attempts must be at least 3"),
    );
  }

  if (
    input.lockoutDurationMinutes !== undefined &&
    input.lockoutDurationMinutes < 5
  ) {
    return err(
      new ApplicationError("Lockout duration must be at least 5 minutes"),
    );
  }

  if (
    input.sessionTimeoutMinutes !== undefined &&
    input.sessionTimeoutMinutes < 15
  ) {
    return err(
      new ApplicationError("Session timeout must be at least 15 minutes"),
    );
  }

  if (input.dataRetentionDays !== undefined && input.dataRetentionDays < 30) {
    return err(new ApplicationError("Data retention must be at least 30 days"));
  }

  // Validate email domains format if provided
  if (input.allowedEmailDomains) {
    for (const domain of input.allowedEmailDomains) {
      if (!isValidDomain(domain)) {
        return err(
          new ApplicationError(`Invalid email domain format: ${domain}`),
        );
      }
    }
  }

  if (input.blockedEmailDomains) {
    for (const domain of input.blockedEmailDomains) {
      if (!isValidDomain(domain)) {
        return err(
          new ApplicationError(`Invalid email domain format: ${domain}`),
        );
      }
    }
  }

  // Validate IP addresses format if provided
  if (input.ipWhitelist) {
    for (const ip of input.ipWhitelist) {
      if (!isValidIPAddress(ip)) {
        return err(new ApplicationError(`Invalid IP address format: ${ip}`));
      }
    }
  }

  if (input.ipBlacklist) {
    for (const ip of input.ipBlacklist) {
      if (!isValidIPAddress(ip)) {
        return err(new ApplicationError(`Invalid IP address format: ${ip}`));
      }
    }
  }

  return ok(undefined);
}

function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
}

function isValidIPAddress(ip: string): boolean {
  // Simple IPv4 validation - could be enhanced for IPv6 and CIDR notation
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}
