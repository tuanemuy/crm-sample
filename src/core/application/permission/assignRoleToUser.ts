import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  assignRoleToUserSchema,
  UserRole,
} from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type AssignRoleToUserInput = z.infer<typeof assignRoleToUserSchema>;

export async function assignRoleToUser(
  context: Context,
  input: AssignRoleToUserInput,
): Promise<Result<UserRole, ApplicationError>> {
  const result = await context.permissionRepository.assignRoleToUser(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to assign role to user", error);
  });
}
