import type { Result } from "neverthrow";
import { z } from "zod/v4";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const removeFromFavoritesInputSchema = z.object({
  userId: z.string().uuid(),
  reportId: z.string().uuid(),
});
export type RemoveFromFavoritesInput = z.infer<
  typeof removeFromFavoritesInputSchema
>;

export async function removeFromFavorites(
  context: Context,
  input: RemoveFromFavoritesInput,
): Promise<Result<void, ApplicationError>> {
  const result = await context.reportRepository.removeFromFavorites(
    input.userId,
    input.reportId,
  );

  return result.mapErr((error) => {
    return new ApplicationError(
      "Failed to remove report from favorites",
      error,
    );
  });
}
