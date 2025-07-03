import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { UserRole } from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const setUserRolesInputSchema = z.object({
  userId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()),
  assignedBy: z.string().uuid(),
});
export type SetUserRolesInput = z.infer<typeof setUserRolesInputSchema>;

export async function setUserRoles(
  context: Context,
  input: SetUserRolesInput,
): Promise<Result<UserRole[], ApplicationError>> {
  const result = await context.permissionRepository.setUserRoles(
    input.userId,
    input.roleIds,
    input.assignedBy,
  );

  return result.mapErr((error) => {
    return new ApplicationError("Failed to set user roles", error);
  });
}
