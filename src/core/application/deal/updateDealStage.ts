import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Deal,
  type UpdateDealStageInput,
  updateDealStageInputSchema,
} from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateDealStage(
  context: Context,
  dealId: string,
  input: UpdateDealStageInput,
): Promise<Result<Deal, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateDealStageInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for updating deal stage",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if deal exists
  const getResult = await context.dealRepository.findById(dealId);
  if (getResult.isErr()) {
    return err(new ApplicationError("Failed to get deal", getResult.error));
  }

  if (!getResult.value) {
    return err(new ApplicationError("Deal not found"));
  }

  const currentDeal = getResult.value;

  // Prepare update parameters
  const updateParams: {
    stage:
      | "prospecting"
      | "qualification"
      | "proposal"
      | "negotiation"
      | "closed_won"
      | "closed_lost";
    probability?: number;
    actualCloseDate?: Date;
  } = {
    stage: validInput.stage,
  };

  // Update probability if provided
  if (validInput.probability !== undefined) {
    updateParams.probability = validInput.probability;
  }

  // Handle closed stages
  if (validInput.stage === "closed_won" || validInput.stage === "closed_lost") {
    // Set actual close date if not already set
    if (!currentDeal.actualCloseDate) {
      updateParams.actualCloseDate = validInput.actualCloseDate || new Date();
    }

    // Set probability based on outcome
    if (validInput.stage === "closed_won") {
      updateParams.probability = 100;
    } else if (validInput.stage === "closed_lost") {
      updateParams.probability = 0;
    }
  }

  // Update deal
  const updateResult = await context.dealRepository.update(
    dealId,
    updateParams,
  );
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update deal stage", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
