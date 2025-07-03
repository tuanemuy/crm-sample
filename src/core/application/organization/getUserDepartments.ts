import type { Result } from "neverthrow";
import type { Department } from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export async function getUserDepartments(
  context: Context,
  userId: string,
): Promise<Result<Department[], ApplicationError>> {
  const result =
    await context.organizationRepository.getUserDepartments(userId);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to get user departments", error);
  });
}
