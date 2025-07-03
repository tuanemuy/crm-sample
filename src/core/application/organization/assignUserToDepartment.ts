import type { Result } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export async function assignUserToDepartment(
  context: Context,
  userId: string,
  departmentId: string,
): Promise<Result<void, ApplicationError>> {
  const result = await context.organizationRepository.assignUserToDepartment(
    userId,
    departmentId,
  );

  return result.mapErr((error) => {
    return new ApplicationError("Failed to assign user to department", error);
  });
}
