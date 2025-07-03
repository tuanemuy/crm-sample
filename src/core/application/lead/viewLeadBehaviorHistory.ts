import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { LeadBehavior } from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const viewLeadBehaviorHistoryInputSchema = z.object({
  leadId: z.string().uuid(),
});

export type ViewLeadBehaviorHistoryInput = z.infer<
  typeof viewLeadBehaviorHistoryInputSchema
>;

export async function viewLeadBehaviorHistory(
  context: Context,
  input: ViewLeadBehaviorHistoryInput,
): Promise<Result<LeadBehavior[], ApplicationError>> {
  // Validate input
  const validationResult = validate(viewLeadBehaviorHistoryInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for viewing lead behavior history",
        validationResult.error,
      ),
    );
  }

  const { leadId } = validationResult.value;

  // Check if lead exists
  const leadResult = await context.leadRepository.findById(leadId);
  if (leadResult.isErr()) {
    return err(new ApplicationError("Failed to find lead", leadResult.error));
  }

  if (!leadResult.value) {
    return err(new ApplicationError("Lead not found"));
  }

  // Get lead behavior history
  const behaviorResult =
    await context.leadRepository.getBehaviorByLeadId(leadId);
  if (behaviorResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get lead behavior history",
        behaviorResult.error,
      ),
    );
  }

  return ok(behaviorResult.value);
}
