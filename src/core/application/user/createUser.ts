import bcrypt from "bcryptjs";
import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type {
  CreateUserInput,
  UserWithoutPassword,
} from "@/core/domain/user/types";
import { createUserInputSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createUser(
  context: Context,
  input: CreateUserInput,
): Promise<Result<UserWithoutPassword, ApplicationError>> {
  // Validate input
  const validationResult = validate(createUserInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        ERROR_MESSAGES.USER_INVALID_INPUT,
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Normalize email to lowercase for consistent comparison
  const normalizedEmail = validInput.email.toLowerCase();

  // Check if user with email already exists
  const existingUserResult =
    await context.userRepository.findByEmail(normalizedEmail);
  if (existingUserResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check existing user",
        existingUserResult.error,
      ),
    );
  }

  if (existingUserResult.value) {
    return err(new ApplicationError(ERROR_MESSAGES.USER_EMAIL_DUPLICATE));
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(validInput.password, 10);

  // Create user
  const createResult = await context.userRepository.create({
    email: normalizedEmail,
    name: validInput.name,
    passwordHash,
    role: validInput.role,
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
