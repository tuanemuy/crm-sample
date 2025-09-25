import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  listUsersQuerySchema,
  UserWithoutPassword,
} from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type ListUsersInput = z.infer<typeof listUsersQuerySchema>;

export async function listUsers(
  context: Context,
  input: ListUsersInput,
): Promise<
  Result<{ items: UserWithoutPassword[]; count: number }, ApplicationError>
> {
  const result = await context.userRepository.list(input);

  return result
    .map((data) => ({
      items: data.items.map(
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
      ),
      count: data.count,
    }))
    .mapErr((error) => {
      return new ApplicationError("Failed to list users", error);
    });
}
