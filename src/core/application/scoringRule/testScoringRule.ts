import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type ScoringRuleTestResult,
  type TestScoringRuleInput,
  testScoringRuleInputSchema,
} from "@/core/domain/scoringRule/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function testScoringRule(
  context: Context,
  input: TestScoringRuleInput,
): Promise<Result<ScoringRuleTestResult, ApplicationError>> {
  // Validate input
  const validationResult = validate(testScoringRuleInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for testing scoring rule",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if scoring rule exists
  const existingRuleResult = await context.scoringRuleRepository.findById(
    validInput.ruleId,
  );
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

  // Test scoring rule
  const testResult = await context.scoringService.testRule(
    validInput.ruleId,
    validInput.testData,
  );
  if (testResult.isErr()) {
    return err(
      new ApplicationError("Failed to test scoring rule", testResult.error),
    );
  }

  return ok(testResult.value);
}
