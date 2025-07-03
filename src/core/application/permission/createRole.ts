import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type { createRoleSchema, Role } from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export async function createRole(
  context: Context,
  input: CreateRoleInput,
): Promise<Result<Role, ApplicationError>> {
  const result = await context.permissionRepository.createRole(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to create role", error);
  });
}
