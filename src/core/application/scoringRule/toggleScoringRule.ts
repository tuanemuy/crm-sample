import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { ScoringRule } from "@/core/domain/scoringRule/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const toggleScoringRuleInputSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

export type ToggleScoringRuleInput = z.infer<
  typeof toggleScoringRuleInputSchema
>;

export async function toggleScoringRule(
  context: Context,
  input: ToggleScoringRuleInput,
): Promise<Result<ScoringRule, ApplicationError>> {
  // Validate input
  const validationResult = validate(toggleScoringRuleInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for toggling scoring rule",
        validationResult.error,
      ),
    );
  }

  const { id, isActive } = validationResult.value;

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

  // Toggle scoring rule active status
  const toggleResult = isActive
    ? await context.scoringRuleRepository.activate(id)
    : await context.scoringRuleRepository.deactivate(id);

  if (toggleResult.isErr()) {
    return err(
      new ApplicationError(
        `Failed to ${isActive ? "activate" : "deactivate"} scoring rule`,
        toggleResult.error,
      ),
    );
  }

  return ok(toggleResult.value);
}
