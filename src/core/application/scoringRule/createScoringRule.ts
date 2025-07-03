import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateScoringRuleInput,
  createScoringRuleInputSchema,
  type ScoringRule,
} from "@/core/domain/scoringRule/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createScoringRule(
  context: Context,
  input: CreateScoringRuleInput,
): Promise<Result<ScoringRule, ApplicationError>> {
  // Validate input
  const validationResult = validate(createScoringRuleInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for creating scoring rule",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Create scoring rule params
  const params = {
    name: validInput.name,
    description: validInput.description,
    condition: validInput.condition,
    score: validInput.score,
    priority: validInput.priority,
    createdByUserId: validInput.createdByUserId,
    isActive: true,
  };

  // Create scoring rule
  const createResult = await context.scoringRuleRepository.create(params);
  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create scoring rule", createResult.error),
    );
  }

  return ok(createResult.value);
}
