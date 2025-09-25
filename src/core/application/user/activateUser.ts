import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { UserWithoutPassword } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const activateUserInputSchema = z.object({
  id: z.string().uuid(),
});
export type ActivateUserInput = z.infer<typeof activateUserInputSchema>;

export async function activateUser(
  context: Context,
  input: ActivateUserInput,
): Promise<Result<UserWithoutPassword, ApplicationError>> {
  const result = await context.userRepository.activate(input.id);

  return result
    .map(
      (user) =>
        ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }) as UserWithoutPassword,
    )
    .mapErr((error) => {
      return new ApplicationError("Failed to activate user", error);
    });
}
