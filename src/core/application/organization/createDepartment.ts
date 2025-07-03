import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  createDepartmentSchema,
  Department,
} from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export async function createDepartment(
  context: Context,
  input: CreateDepartmentInput,
): Promise<Result<Department, ApplicationError>> {
  const result = await context.organizationRepository.createDepartment(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to create department", error);
  });
}
