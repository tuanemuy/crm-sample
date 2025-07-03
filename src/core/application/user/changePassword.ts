import bcrypt from "bcryptjs";
import { err, ok, type Result } from "neverthrow";
import type { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type {
  changePasswordInputSchema,
  UserWithoutPassword,
} from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export async function changePassword(
  context: Context,
  input: ChangePasswordInput,
): Promise<Result<UserWithoutPassword, ApplicationError>> {
  // Find user
  const userResult = await context.userRepository.findById(input.userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  const user = userResult.value;
  if (!user) {
    return err(new ApplicationError("User not found"));
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    return err(new ApplicationError("Current password is incorrect"));
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

  // Update user with new password
  const updateResult = await context.userRepository.update(user.id, {
    passwordHash: newPasswordHash,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update password", updateResult.error),
    );
  }

  const updatedUser = updateResult.value;

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = updatedUser;
  return ok(userWithoutPassword);
}
