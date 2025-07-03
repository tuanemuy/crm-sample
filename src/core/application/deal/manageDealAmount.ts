import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Deal } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Manage deal amount input schema
export const manageDealAmountInputSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal")
    .optional(),
  probability: z.number().int().min(0).max(100).optional(),
  reason: z.string().optional(), // Reason for the change
  autoAdjustProbability: z.boolean().default(false), // Auto-adjust probability based on amount tier
});

export type ManageDealAmountInput = z.infer<typeof manageDealAmountInputSchema>;

// Amount tier configuration for probability suggestions
const AMOUNT_TIERS = [
  { min: 0, max: 10000, suggestedProbability: 20 },
  { min: 10000, max: 50000, suggestedProbability: 40 },
  { min: 50000, max: 100000, suggestedProbability: 60 },
  { min: 100000, max: 500000, suggestedProbability: 70 },
  { min: 500000, max: Number.MAX_SAFE_INTEGER, suggestedProbability: 80 },
];

// Stage-based probability validation
const STAGE_PROBABILITY_RANGES = {
  prospecting: { min: 0, max: 30 },
  qualification: { min: 10, max: 50 },
  proposal: { min: 30, max: 80 },
  negotiation: { min: 50, max: 95 },
  closed_won: { min: 100, max: 100 },
  closed_lost: { min: 0, max: 0 },
};

function getSuggestedProbabilityByAmount(amount: string): number {
  const numAmount = Number.parseFloat(amount);
  const tier = AMOUNT_TIERS.find(
    (t) => numAmount >= t.min && numAmount < t.max,
  );
  return tier?.suggestedProbability || 50;
}

function validateProbabilityForStage(
  stage: string,
  probability: number,
): boolean {
  const range =
    STAGE_PROBABILITY_RANGES[stage as keyof typeof STAGE_PROBABILITY_RANGES];
  if (!range) return true; // Allow any probability for unknown stages
  return probability >= range.min && probability <= range.max;
}

export async function manageDealAmount(
  context: Context,
  dealId: string,
  input: ManageDealAmountInput,
): Promise<Result<Deal, ApplicationError>> {
  // Validate input
  const validationResult = validate(manageDealAmountInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for managing deal amount",
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

  // Prepare update data
  const newAmount = validInput.amount || currentDeal.amount;
  let newProbability = validInput.probability ?? currentDeal.probability;

  // Auto-adjust probability based on amount if requested
  if (validInput.autoAdjustProbability && validInput.amount) {
    newProbability = getSuggestedProbabilityByAmount(validInput.amount);
  }

  // Validate probability against current stage
  if (!validateProbabilityForStage(currentDeal.stage, newProbability)) {
    const range =
      STAGE_PROBABILITY_RANGES[
        currentDeal.stage as keyof typeof STAGE_PROBABILITY_RANGES
      ];
    return err(
      new ApplicationError(
        `Probability ${newProbability}% is not valid for stage "${currentDeal.stage}". Expected range: ${range.min}-${range.max}%`,
      ),
    );
  }

  // Business rule: Large amount changes should require a reason
  if (validInput.amount) {
    const currentAmount = Number.parseFloat(currentDeal.amount);
    const newAmountNum = Number.parseFloat(newAmount);
    const changePercentage =
      Math.abs((newAmountNum - currentAmount) / currentAmount) * 100;

    if (changePercentage > 50 && !validInput.reason) {
      return err(
        new ApplicationError(
          "A reason is required for amount changes greater than 50%",
        ),
      );
    }
  }

  // Record activity for the change if reason is provided
  if (validInput.reason) {
    const activityResult = await context.activityRepository.create({
      customerId: currentDeal.customerId,
      contactId: currentDeal.contactId,
      assignedUserId: currentDeal.assignedUserId,
      createdByUserId: currentDeal.assignedUserId,
      type: "note",
      subject: `Deal amount/probability updated: ${validInput.reason}`,
      description: `Amount: ${currentDeal.amount} → ${newAmount}, Probability: ${currentDeal.probability}% → ${newProbability}%`,
      status: "completed",
      priority: "medium",
      scheduledAt: new Date(),
    });

    if (activityResult.isErr()) {
      // Log error but don't fail the main operation
      console.warn(
        "Failed to record activity for deal amount change:",
        activityResult.error,
      );
    }
  }

  // Update the deal
  const updateResult = await context.dealRepository.update(dealId, {
    amount: newAmount,
    probability: newProbability,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update deal amount", updateResult.error),
    );
  }

  return ok(updateResult.value);
}

// Helper function to get suggested probability based on amount
export async function getSuggestedDealProbability(
  amount: string,
  stage: string,
): Promise<Result<number, ApplicationError>> {
  try {
    const suggestedByAmount = getSuggestedProbabilityByAmount(amount);
    const stageRange =
      STAGE_PROBABILITY_RANGES[stage as keyof typeof STAGE_PROBABILITY_RANGES];

    if (!stageRange) {
      return ok(suggestedByAmount);
    }

    // Adjust suggestion to fit within stage range
    const adjustedSuggestion = Math.max(
      stageRange.min,
      Math.min(stageRange.max, suggestedByAmount),
    );

    return ok(adjustedSuggestion);
  } catch (_error) {
    return err(
      new ApplicationError("Failed to calculate suggested probability"),
    );
  }
}
