import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { Report } from "@/core/domain/report/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import type { Context } from "../context";

export const listFavoriteReportsInputSchema = z.object({
  userId: z.string().uuid(),
  pagination: paginationSchema,
});
export type ListFavoriteReportsInput = z.infer<
  typeof listFavoriteReportsInputSchema
>;

export async function listFavoriteReports(
  context: Context,
  input: ListFavoriteReportsInput,
): Promise<Result<{ items: Report[]; count: number }, ApplicationError>> {
  const result = await context.reportRepository.listFavorites(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to list favorite reports", error);
  });
}
