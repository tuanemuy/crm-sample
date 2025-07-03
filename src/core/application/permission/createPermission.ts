import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  createPermissionSchema,
  Permission,
} from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

export async function createPermission(
  context: Context,
  input: CreatePermissionInput,
): Promise<Result<Permission, ApplicationError>> {
  const result = await context.permissionRepository.createPermission(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to create permission", error);
  });
}
