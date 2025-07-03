import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { FavoriteReport } from "@/core/domain/report/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const addToFavoritesInputSchema = z.object({
  userId: z.string().uuid(),
  reportId: z.string().uuid(),
});
export type AddToFavoritesInput = z.infer<typeof addToFavoritesInputSchema>;

export async function addToFavorites(
  context: Context,
  input: AddToFavoritesInput,
): Promise<Result<FavoriteReport, ApplicationError>> {
  const result = await context.reportRepository.addToFavorites(
    input.userId,
    input.reportId,
  );

  return result.mapErr((error) => {
    return new ApplicationError("Failed to add report to favorites", error);
  });
}
