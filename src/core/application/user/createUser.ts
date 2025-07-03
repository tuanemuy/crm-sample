import bcrypt from "bcryptjs";
import { err, ok, type Result } from "neverthrow";
import type { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type {
  createUserInputSchema,
  UserWithoutPassword,
} from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export async function createUser(
  context: Context,
  input: CreateUserInput,
): Promise<Result<UserWithoutPassword, ApplicationError>> {
  // Check if user with email already exists
  const existingUserResult = await context.userRepository.findByEmail(
    input.email,
  );
  if (existingUserResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check existing user",
        existingUserResult.error,
      ),
    );
  }

  if (existingUserResult.value) {
    return err(new ApplicationError("User with this email already exists"));
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(input.password, 10);

  // Create user
  const createResult = await context.userRepository.create({
    email: input.email,
    name: input.name,
    passwordHash,
    role: input.role,
    isActive: true,
  });

  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create user", createResult.error),
    );
  }

  const user = createResult.value;

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user;
  return ok(userWithoutPassword);
}
