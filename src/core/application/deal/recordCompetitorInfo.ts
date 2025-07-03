import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Deal } from "@/core/domain/deal/types";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Input schema for recording competitor information
export const recordCompetitorInfoInputSchema = z.object({
  dealId: z.string().uuid(),
  competitors: z.array(z.string().min(1)).min(0),
  action: z.enum(["add", "remove", "replace"]).default("replace"),
});

export type RecordCompetitorInfoInput = z.infer<
  typeof recordCompetitorInfoInputSchema
>;

export async function recordCompetitorInfo(
  context: Context,
  input: RecordCompetitorInfoInput,
): Promise<Result<Deal, ApplicationError | NotFoundError>> {
  // Validate input
  const validationResult = validate(recordCompetitorInfoInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for recording competitor information",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Get current deal
  const dealResult = await context.dealRepository.findById(validInput.dealId);
  if (dealResult.isErr()) {
    return err(new ApplicationError("Failed to get deal", dealResult.error));
  }

  if (dealResult.value === null) {
    return err(new NotFoundError("Deal not found"));
  }

  const currentDeal = dealResult.value;
  let updatedCompetitors: string[] = [];

  // Handle different actions
  switch (validInput.action) {
    case "add": {
      // Add new competitors to existing list, avoiding duplicates
      const existingSet = new Set(currentDeal.competitors);
      for (const competitor of validInput.competitors) {
        existingSet.add(competitor);
      }
      updatedCompetitors = Array.from(existingSet);
      break;
    }

    case "remove":
      // Remove specified competitors from existing list
      updatedCompetitors = currentDeal.competitors.filter(
        (competitor) => !validInput.competitors.includes(competitor),
      );
      break;
    default:
      // Replace entire competitors list
      updatedCompetitors = validInput.competitors;
      break;
  }

  // Update deal with new competitors list
  const updateResult = await context.dealRepository.update(validInput.dealId, {
    competitors: updatedCompetitors,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to update deal competitors",
        updateResult.error,
      ),
    );
  }

  return ok(updateResult.value);
}
