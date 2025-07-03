import bcrypt from "bcryptjs";
import { err, ok, type Result } from "neverthrow";
import type { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type {
  loginInputSchema,
  UserWithoutPassword,
} from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";

export type LoginInput = z.infer<typeof loginInputSchema>;

export async function login(
  context: Context,
  input: LoginInput,
): Promise<Result<UserWithoutPassword, ApplicationError>> {
  const userResult = await context.userRepository.findByEmail(input.email);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  const user = userResult.value;
  if (!user) {
    return err(new ApplicationError("Invalid email or password"));
  }

  if (!user.isActive) {
    return err(new ApplicationError("User account is deactivated"));
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    return err(new ApplicationError("Invalid email or password"));
  }

  // Update last login timestamp
  const updateResult = await context.userRepository.updateLastLogin({
    userId: user.id,
    lastLoginAt: new Date(),
  });

  if (updateResult.isErr()) {
    // Log error but don't fail the login
    console.error("Failed to update last login:", updateResult.error);
  }

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user;
  return ok(userWithoutPassword);
}
