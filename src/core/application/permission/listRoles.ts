import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  listRolesQuerySchema,
  Role,
} from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type ListRolesInput = z.infer<typeof listRolesQuerySchema>;

export async function listRoles(
  context: Context,
  input: ListRolesInput,
): Promise<Result<{ items: Role[]; count: number }, ApplicationError>> {
  const result = await context.permissionRepository.listRoles(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to list roles", error);
  });
}
