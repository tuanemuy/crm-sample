import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type ScoringRule,
  type UpdateScoringRuleInput,
  updateScoringRuleInputSchema,
} from "@/core/domain/scoringRule/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateScoringRule(
  context: Context,
  id: string,
  input: UpdateScoringRuleInput,
): Promise<Result<ScoringRule, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateScoringRuleInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for updating scoring rule",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if scoring rule exists
  const existingRuleResult = await context.scoringRuleRepository.findById(id);
  if (existingRuleResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to find scoring rule",
        existingRuleResult.error,
      ),
    );
  }

  if (!existingRuleResult.value) {
    return err(new ApplicationError("Scoring rule not found"));
  }

  // Update scoring rule
  const updateResult = await context.scoringRuleRepository.update(
    id,
    validInput,
  );
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update scoring rule", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
