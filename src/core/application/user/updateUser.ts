import bcrypt from "bcryptjs";
import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { UserWithoutPassword } from "@/core/domain/user/types";
import { updateUserInputSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const updateUserInputSchemaWithId = updateUserInputSchema.extend({
  id: z.string().uuid(),
});
export type UpdateUserInputWithId = z.infer<typeof updateUserInputSchemaWithId>;

export async function updateUser(
  context: Context,
  input: UpdateUserInputWithId,
): Promise<Result<UserWithoutPassword, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateUserInputSchemaWithId, input);
  if (validationResult.isErr()) {
    return err(new ApplicationError("Invalid input", validationResult.error));
  }

  const { id, ...updateData } = validationResult.value;

  // パスワードが提供された場合はハッシュ化する
  const params = updateData.password
    ? {
        ...updateData,
        passwordHash: await bcrypt.hash(updateData.password, 10),
        password: undefined,
      }
    : updateData;

  const result = await context.userRepository.update(id, params);

  return result
    .mapErr((error) => {
      return new ApplicationError("Failed to update user", error);
    })
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
    );
}
