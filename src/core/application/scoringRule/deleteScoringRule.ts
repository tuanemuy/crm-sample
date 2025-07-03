import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const deleteScoringRuleInputSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteScoringRuleInput = z.infer<
  typeof deleteScoringRuleInputSchema
>;

export async function deleteScoringRule(
  context: Context,
  input: DeleteScoringRuleInput,
): Promise<Result<void, ApplicationError>> {
  // Validate input
  const validationResult = validate(deleteScoringRuleInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for deleting scoring rule",
        validationResult.error,
      ),
    );
  }

  const { id } = validationResult.value;

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

  // Delete scoring rule
  const deleteResult = await context.scoringRuleRepository.delete(id);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete scoring rule", deleteResult.error),
    );
  }

  return ok(undefined);
}
