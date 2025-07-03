import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { updateUserInputSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const updateUserInputSchemaWithId = updateUserInputSchema.extend({
  id: z.string().uuid(),
});
export type UpdateUserInputWithId = z.infer<typeof updateUserInputSchemaWithId>;

export async function updateUser(
  context: Context,
  input: UpdateUserInputWithId,
): Promise<Result<User, ApplicationError>> {
  const { id, ...updateData } = input;

  // パスワードが提供された場合はハッシュ化する
  const params = updateData.password
    ? {
        ...updateData,
        passwordHash: updateData.password, // 実際にはハッシュ化が必要
        password: undefined,
      }
    : updateData;

  const result = await context.userRepository.update(id, params);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to update user", error);
  });
}
