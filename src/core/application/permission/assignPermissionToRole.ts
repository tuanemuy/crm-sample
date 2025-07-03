import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  assignPermissionToRoleSchema,
  RolePermission,
} from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type AssignPermissionToRoleInput = z.infer<
  typeof assignPermissionToRoleSchema
>;

export async function assignPermissionToRole(
  context: Context,
  input: AssignPermissionToRoleInput,
): Promise<Result<RolePermission, ApplicationError>> {
  const result =
    await context.permissionRepository.assignPermissionToRole(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to assign permission to role", error);
  });
}
