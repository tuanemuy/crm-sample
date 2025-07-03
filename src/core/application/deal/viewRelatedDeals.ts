import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Deal } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import { validate } from "@/lib/validation";
import { filterDeals } from "./filterDeals";

// View related deals input schema
export const viewRelatedDealsInputSchema = z.object({
  customerId: z.string().uuid(),
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
  includeClosedDeals: z.boolean().default(false),
});

export type ViewRelatedDealsInput = z.infer<typeof viewRelatedDealsInputSchema>;

export async function viewRelatedDeals(
  context: Context,
  input: ViewRelatedDealsInput,
): Promise<Result<{ items: Deal[]; count: number }, ApplicationError>> {
  // Validate input
  const validationResult = validate(viewRelatedDealsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for viewing related deals",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Build filter for the customer's deals
  const filter = {
    customerId: validInput.customerId,
  };

  // Note: We filter out closed deals after getting results if needed
  // since the filter doesn't need to exclude them at the repository level

  // Use the existing filterDeals functionality
  const filterResult = await filterDeals(context, {
    filter,
    pagination: validInput.pagination,
    sortBy: validInput.sortBy,
    sortOrder: validInput.sortOrder,
  });

  if (filterResult.isErr()) {
    return err(
      new ApplicationError("Failed to get related deals", filterResult.error),
    );
  }

  const { items, count } = filterResult.value;

  // Filter out closed deals if requested
  let filteredItems = items;
  let filteredCount = count;

  if (!validInput.includeClosedDeals) {
    filteredItems = items.filter(
      (deal) => !["closed_won", "closed_lost"].includes(deal.stage),
    );
    filteredCount = filteredItems.length;
  }

  return ok({
    items: filteredItems,
    count: filteredCount,
  });
}
