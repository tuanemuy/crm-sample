import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { UserWithoutPassword } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const deactivateUserInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeactivateUserInput = z.infer<typeof deactivateUserInputSchema>;

export async function deactivateUser(
  context: Context,
  input: DeactivateUserInput,
): Promise<Result<UserWithoutPassword, ApplicationError>> {
  const result = await context.userRepository.deactivate(input.id);

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
      return new ApplicationError("Failed to deactivate user", error);
    });
}
