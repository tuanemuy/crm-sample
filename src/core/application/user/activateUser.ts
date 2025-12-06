import type { Result } from "neverthrow";
import type { ActivateUserInput, User } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export async function activateUser(
  context: Context,
  input: ActivateUserInput,
): Promise<Result<User, ApplicationError>> {
  const result = await context.userRepository.activate(input.id);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to activate user", error);
  });
}
