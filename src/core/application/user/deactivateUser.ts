import type { Result } from "neverthrow";
import type { DeactivateUserInput, User } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export async function deactivateUser(
  context: Context,
  input: DeactivateUserInput,
): Promise<Result<User, ApplicationError>> {
  const result = await context.userRepository.deactivate(input.id);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to deactivate user", error);
  });
}
