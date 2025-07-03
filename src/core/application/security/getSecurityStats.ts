import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { SecurityStats } from "@/core/domain/security/types";
import { ApplicationError } from "@/lib/error";

export async function getSecurityStats(
  context: Context,
  userId: string,
  organizationId: string,
  days = 30,
): Promise<Result<SecurityStats, ApplicationError>> {
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
        "User does not have permission to view security statistics",
      ),
    );
  }

  // Get security statistics
  const stats = await context.securityRepository.getSecurityStats(
    organizationId,
    days,
  );
  if (stats.isErr()) {
    return err(
      new ApplicationError("Failed to get security statistics", stats.error),
    );
  }

  return ok(stats.value);
}
