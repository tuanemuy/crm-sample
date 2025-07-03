import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  Department,
  listDepartmentsQuerySchema,
} from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type ListDepartmentsInput = z.infer<typeof listDepartmentsQuerySchema>;

export async function listDepartments(
  context: Context,
  input: ListDepartmentsInput,
): Promise<Result<{ items: Department[]; count: number }, ApplicationError>> {
  const result = await context.organizationRepository.listDepartments(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to list departments", error);
  });
}
