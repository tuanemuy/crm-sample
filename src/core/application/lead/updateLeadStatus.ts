import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Lead } from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Input schema for bulk status update
export const updateLeadStatusInputSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100), // Limit to 100 leads per batch
  status: z.enum(["new", "contacted", "qualified", "converted", "rejected"]),
});

export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusInputSchema>;

export async function updateLeadStatus(
  context: Context,
  input: UpdateLeadStatusInput,
): Promise<Result<Lead[], ApplicationError>> {
  // Validate input
  const validationResult = validate(updateLeadStatusInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for updating lead status",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Verify all leads exist first
  const leadCheckPromises = validInput.leadIds.map((leadId) =>
    context.leadRepository.findById(leadId),
  );

  const leadCheckResults = await Promise.all(leadCheckPromises);

  // Check for any errors or non-existent leads
  for (let i = 0; i < leadCheckResults.length; i++) {
    const result = leadCheckResults[i];
    if (result.isErr()) {
      return err(
        new ApplicationError(
          `Failed to verify lead ${validInput.leadIds[i]}`,
          result.error,
        ),
      );
    }

    if (!result.value) {
      return err(
        new ApplicationError(`Lead ${validInput.leadIds[i]} not found`),
      );
    }
  }

  // Update all leads in parallel
  const updatePromises = validInput.leadIds.map((leadId) =>
    context.leadRepository.update(leadId, { status: validInput.status }),
  );

  const updateResults = await Promise.all(updatePromises);

  // Collect successful updates and check for errors
  const updatedLeads: Lead[] = [];
  for (let i = 0; i < updateResults.length; i++) {
    const result = updateResults[i];
    if (result.isErr()) {
      return err(
        new ApplicationError(
          `Failed to update lead ${validInput.leadIds[i]}`,
          result.error,
        ),
      );
    }
    updatedLeads.push(result.value);
  }

  return ok(updatedLeads);
}
