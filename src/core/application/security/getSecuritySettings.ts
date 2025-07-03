import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { SecuritySettings } from "@/core/domain/security/types";
import { ApplicationError } from "@/lib/error";

export async function getSecuritySettings(
  context: Context,
  userId: string,
  organizationId: string,
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
      permission.name === "admin" || permission.name === "view_security",
  );

  if (!hasAdminPermission) {
    return err(
      new ApplicationError(
        "User does not have permission to view security settings",
      ),
    );
  }

  // Get security settings
  const settings =
    await context.securityRepository.getSecuritySettings(organizationId);
  if (settings.isErr()) {
    return err(
      new ApplicationError("Failed to get security settings", settings.error),
    );
  }

  if (!settings.value) {
    // Create default settings if they don't exist
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
    return ok(defaultSettings.value);
  }

  return ok(settings.value);
}
