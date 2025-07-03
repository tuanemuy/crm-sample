import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type { checkPermissionSchema } from "@/core/domain/permission/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;

export async function checkPermission(
  context: Context,
  input: CheckPermissionInput,
): Promise<Result<boolean, ApplicationError>> {
  const result = await context.permissionRepository.checkPermission(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to check permission", error);
  });
}
