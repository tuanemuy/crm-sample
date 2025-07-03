import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateLeadBehaviorParams,
  createLeadBehaviorParamsSchema,
  type LeadBehavior,
} from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function recordLeadBehavior(
  context: Context,
  params: CreateLeadBehaviorParams,
): Promise<Result<LeadBehavior, ApplicationError>> {
  // Validate params
  const validationResult = validate(createLeadBehaviorParamsSchema, params);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid params for recording lead behavior",
        validationResult.error,
      ),
    );
  }

  const validParams = validationResult.value;

  // Check if lead exists
  const leadResult = await context.leadRepository.findById(validParams.leadId);
  if (leadResult.isErr()) {
    return err(new ApplicationError("Failed to find lead", leadResult.error));
  }

  if (!leadResult.value) {
    return err(new ApplicationError("Lead not found"));
  }

  // Record lead behavior
  const behaviorResult =
    await context.leadRepository.createBehavior(validParams);
  if (behaviorResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to record lead behavior",
        behaviorResult.error,
      ),
    );
  }

  // Update lead score if behavior has score impact
  if (validParams.score && validParams.score !== 0) {
    const currentLead = leadResult.value;
    const newScore = Math.max(
      0,
      Math.min(100, currentLead.score + validParams.score),
    );

    const updateScoreResult = await context.leadRepository.updateScore(
      validParams.leadId,
      newScore,
    );
    if (updateScoreResult.isErr()) {
      // Log error but don't fail the behavior recording
      console.warn("Failed to update lead score after behavior recording");
    }
  }

  return ok(behaviorResult.value);
}
