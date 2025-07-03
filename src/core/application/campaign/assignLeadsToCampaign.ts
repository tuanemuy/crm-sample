import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { CampaignLead } from "@/core/domain/campaign/types";
import { ApplicationError } from "@/lib/error";

export const assignLeadsToCampaignInputSchema = z.object({
  campaignId: z.string().uuid(),
  leadIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
  userId: z.string().uuid(),
});
export type AssignLeadsToCampaignInput = z.infer<
  typeof assignLeadsToCampaignInputSchema
>;

export async function assignLeadsToCampaign(
  context: Context,
  input: AssignLeadsToCampaignInput,
): Promise<Result<CampaignLead[], ApplicationError>> {
  // Verify campaign exists
  const campaignResult = await context.campaignRepository.findById(
    input.campaignId,
  );
  if (campaignResult.isErr()) {
    return err(
      new ApplicationError("Failed to find campaign", campaignResult.error),
    );
  }

  if (!campaignResult.value) {
    return err(new ApplicationError("Campaign not found"));
  }

  // Verify all leads exist
  const leadChecks = await Promise.all(
    input.leadIds.map(async (leadId) => {
      const leadResult = await context.leadRepository.findById(leadId);
      if (leadResult.isErr()) {
        return { leadId, exists: false, error: leadResult.error };
      }
      return { leadId, exists: !!leadResult.value, error: null };
    }),
  );

  const missingLeads = leadChecks.filter((check) => !check.exists);
  if (missingLeads.length > 0) {
    return err(
      new ApplicationError(
        `Leads not found: ${missingLeads.map((l) => l.leadId).join(", ")}`,
      ),
    );
  }

  const erroredLeads = leadChecks.filter((check) => check.error);
  if (erroredLeads.length > 0) {
    return err(new ApplicationError("Failed to verify leads existence"));
  }

  // Assign leads to campaign
  const assignResult = await context.campaignRepository.assignLeads({
    campaignId: input.campaignId,
    leadIds: input.leadIds,
    assignedBy: input.userId,
    notes: input.notes,
  });

  if (assignResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to assign leads to campaign",
        assignResult.error,
      ),
    );
  }

  return ok(assignResult.value);
}
