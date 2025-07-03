import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { EmailCampaign } from "@/core/domain/emailMarketing/types";
import { ApplicationError } from "@/lib/error";

export const createEmailCampaignInputSchema = z.object({
  campaignId: z.string().uuid(),
  templateId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  content: z.string().min(1),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  userId: z.string().uuid(),
});
export type CreateEmailCampaignInput = z.infer<
  typeof createEmailCampaignInputSchema
>;

export async function createEmailCampaign(
  context: Context,
  input: CreateEmailCampaignInput,
): Promise<Result<EmailCampaign, ApplicationError>> {
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

  // Verify template exists
  const templateResult =
    await context.emailMarketingRepository.findTemplateById(input.templateId);
  if (templateResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to find email template",
        templateResult.error,
      ),
    );
  }
  if (!templateResult.value) {
    return err(new ApplicationError("Email template not found"));
  }

  // Validate scheduled date is in the future
  if (input.scheduledAt && input.scheduledAt <= new Date()) {
    return err(new ApplicationError("Scheduled date must be in the future"));
  }

  const result = await context.emailMarketingRepository.createCampaign({
    campaignId: input.campaignId,
    templateId: input.templateId,
    subject: input.subject,
    content: input.content,
    scheduledAt: input.scheduledAt,
    metadata: input.metadata,
    createdBy: input.userId,
  });

  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to create email campaign", result.error),
    );
  }

  return ok(result.value);
}
