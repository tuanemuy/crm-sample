import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  Department,
  updateDepartmentSchema,
} from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export async function updateDepartment(
  context: Context,
  input: UpdateDepartmentInput,
): Promise<Result<Department, ApplicationError>> {
  const result = await context.organizationRepository.updateDepartment(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to update department", error);
  });
}
