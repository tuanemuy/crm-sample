import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { LeadScoringEvaluation } from "@/core/domain/scoringRule/types";
import { ApplicationError, NotFoundError } from "@/lib/error";

export async function viewScoringDetail(
  context: Context,
  leadId: string,
): Promise<Result<LeadScoringEvaluation, ApplicationError | NotFoundError>> {
  // Verify lead exists
  const leadResult = await context.leadRepository.findById(leadId);
  if (leadResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get lead for scoring detail",
        leadResult.error,
      ),
    );
  }

  if (leadResult.value === null) {
    return err(new NotFoundError("Lead not found"));
  }

  // Get detailed scoring evaluation
  const evaluationResult =
    await context.scoringService.evaluateLeadScore(leadId);
  if (evaluationResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to evaluate lead scoring detail",
        evaluationResult.error,
      ),
    );
  }

  return ok(evaluationResult.value);
}
