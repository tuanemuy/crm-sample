import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { Permission } from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const getUserPermissionsInputSchema = z.object({
  userId: z.string().uuid(),
});
export type GetUserPermissionsInput = z.infer<
  typeof getUserPermissionsInputSchema
>;

export async function getUserPermissions(
  context: Context,
  input: GetUserPermissionsInput,
): Promise<Result<Permission[], ApplicationError>> {
  const result = await context.permissionRepository.getUserPermissions(
    input.userId,
  );

  return result.mapErr((error) => {
    return new ApplicationError("Failed to get user permissions", error);
  });
}
