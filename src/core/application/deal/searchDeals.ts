import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import {
  type Deal,
  dealFilterSchema,
  type ListDealsQuery,
} from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import { validate } from "@/lib/validation";

// Search deals input schema
export const searchDealsInputSchema = z.object({
  keyword: z.string().min(1).max(100),
  pagination: paginationSchema.optional(),
  filter: dealFilterSchema.omit({ keyword: true }).optional(),
  sortBy: z
    .enum([
      "title",
      "amount",
      "probability",
      "expectedCloseDate",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SearchDealsInput = z.infer<typeof searchDealsInputSchema>;

export async function searchDeals(
  context: Context,
  input: SearchDealsInput,
): Promise<Result<{ items: Deal[]; count: number }, ApplicationError>> {
  // Validate input
  const validationResult = validate(searchDealsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for searching deals",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Construct query for list deals
  const query: ListDealsQuery = {
    pagination: validInput.pagination || {
      page: 1,
      limit: 20,
      order: "desc",
      orderBy: validInput.sortBy || "createdAt",
    },
    filter: {
      ...validInput.filter,
      keyword: validInput.keyword,
    },
    sortBy: validInput.sortBy,
    sortOrder: validInput.sortOrder,
  };

  // Use existing listDeals functionality
  const listResult = await context.dealRepository.list(query);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to search deals", listResult.error),
    );
  }

  return ok(listResult.value);
}
