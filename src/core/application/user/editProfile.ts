import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { UserWithoutPassword } from "@/core/domain/user/types";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Profile edit input schema
export const editProfileInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
});

export type EditProfileInput = z.infer<typeof editProfileInputSchema>;

export async function editProfile(
  context: Context,
  userId: string,
  input: EditProfileInput,
): Promise<Result<UserWithoutPassword, ApplicationError | NotFoundError>> {
  // Validate input
  const validationResult = validate(editProfileInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for profile edit",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if any fields to update are provided
  if (!validInput.name && !validInput.email) {
    return err(
      new ApplicationError("At least one field must be provided for update"),
    );
  }

  // Verify user exists
  const userResult = await context.userRepository.findById(userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to get user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new NotFoundError("User not found"));
  }

  const currentUser = userResult.value;

  // Check if email is being changed and if it's already in use
  if (validInput.email && validInput.email !== currentUser.email) {
    const emailCheckResult = await context.userRepository.findByEmail(
      validInput.email,
    );
    if (emailCheckResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to check email availability",
          emailCheckResult.error,
        ),
      );
    }

    if (emailCheckResult.value !== null) {
      return err(new ApplicationError("Email address is already in use"));
    }
  }

  // Prepare update parameters
  const updateParams = {
    name: validInput.name,
    email: validInput.email,
  };

  // Update user profile
  const updateResult = await context.userRepository.update(
    userId,
    updateParams,
  );
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update user profile", updateResult.error),
    );
  }

  // Return user without password
  const updatedUser = updateResult.value;
  const userWithoutPassword: UserWithoutPassword = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
    lastLoginAt: updatedUser.lastLoginAt,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };

  return ok(userWithoutPassword);
}
