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

// Filter deals input schema
export const filterDealsInputSchema = z.object({
  filter: dealFilterSchema,
  pagination: paginationSchema.optional(),
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

export type FilterDealsInput = z.infer<typeof filterDealsInputSchema>;

export async function filterDeals(
  context: Context,
  input: FilterDealsInput,
): Promise<Result<{ items: Deal[]; count: number }, ApplicationError>> {
  // Validate input
  const validationResult = validate(filterDealsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for filtering deals",
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
      order: validInput.sortOrder,
      orderBy: validInput.sortBy || "createdAt",
    },
    filter: validInput.filter,
    sortBy: validInput.sortBy,
    sortOrder: validInput.sortOrder,
  };

  // Use existing listDeals functionality
  const listResult = await context.dealRepository.list(query);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to filter deals", listResult.error),
    );
  }

  return ok(listResult.value);
}
