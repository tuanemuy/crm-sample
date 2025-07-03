import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type ListScoringRulesQuery,
  listScoringRulesQuerySchema,
  type ScoringRule,
} from "@/core/domain/scoringRule/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function listScoringRules(
  context: Context,
  query: ListScoringRulesQuery,
): Promise<Result<{ items: ScoringRule[]; count: number }, ApplicationError>> {
  // Validate query
  const validationResult = validate(listScoringRulesQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid query for listing scoring rules",
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // List scoring rules
  const listResult = await context.scoringRuleRepository.list(validQuery);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to list scoring rules", listResult.error),
    );
  }
  return ok(listResult.value);
}
