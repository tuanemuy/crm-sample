import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const deactivateUserInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeactivateUserInput = z.infer<typeof deactivateUserInputSchema>;

export async function deactivateUser(
  context: Context,
  input: DeactivateUserInput,
): Promise<Result<User, ApplicationError>> {
  const result = await context.userRepository.deactivate(input.id);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to deactivate user", error);
  });
}
