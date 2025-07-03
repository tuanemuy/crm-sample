import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type { listUsersQuerySchema, User } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type ListUsersInput = z.infer<typeof listUsersQuerySchema>;

export async function listUsers(
  context: Context,
  input: ListUsersInput,
): Promise<Result<{ items: User[]; count: number }, ApplicationError>> {
  const result = await context.userRepository.list(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to list users", error);
  });
}
