import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  listPermissionsQuerySchema,
  Permission,
} from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type ListPermissionsInput = z.infer<typeof listPermissionsQuerySchema>;

export async function listPermissions(
  context: Context,
  input: ListPermissionsInput,
): Promise<Result<{ items: Permission[]; count: number }, ApplicationError>> {
  const result = await context.permissionRepository.listPermissions(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to list permissions", error);
  });
}
