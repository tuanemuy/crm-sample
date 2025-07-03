import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { CampaignWithStats } from "@/core/domain/campaign/types";
import { ApplicationError } from "@/lib/error";

export const getCampaignDetailsInputSchema = z.object({
  campaignId: z.string().uuid(),
});
export type GetCampaignDetailsInput = z.infer<
  typeof getCampaignDetailsInputSchema
>;

export async function getCampaignDetails(
  context: Context,
  input: GetCampaignDetailsInput,
): Promise<Result<CampaignWithStats, ApplicationError>> {
  const result = await context.campaignRepository.findByIdWithStats(
    input.campaignId,
  );

  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to get campaign details", result.error),
    );
  }

  if (!result.value) {
    return err(new ApplicationError("Campaign not found"));
  }

  return ok(result.value);
}
