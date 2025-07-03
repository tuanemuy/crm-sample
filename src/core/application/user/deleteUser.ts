import type { Result } from "neverthrow";
import { z } from "zod/v4";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const deleteUserInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export async function deleteUser(
  context: Context,
  input: DeleteUserInput,
): Promise<Result<void, ApplicationError>> {
  const result = await context.userRepository.delete(input.id);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to delete user", error);
  });
}
