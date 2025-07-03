import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { DepartmentWithHierarchy } from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const getDepartmentHierarchyInputSchema = z.object({
  organizationId: z.string().uuid(),
});
export type GetDepartmentHierarchyInput = z.infer<
  typeof getDepartmentHierarchyInputSchema
>;

export async function getDepartmentHierarchy(
  context: Context,
  input: GetDepartmentHierarchyInput,
): Promise<Result<DepartmentWithHierarchy[], ApplicationError>> {
  const result = await context.organizationRepository.getDepartmentHierarchy(
    input.organizationId,
  );

  return result.mapErr((error) => {
    return new ApplicationError("Failed to get department hierarchy", error);
  });
}
