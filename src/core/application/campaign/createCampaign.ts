import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Campaign } from "@/core/domain/campaign/types";
import { ApplicationError } from "@/lib/error";

export const createCampaignInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["email", "sms", "social", "event", "webinar"]),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.number().min(0).optional(),
  targetAudience: z.string().optional(),
  goal: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  userId: z.string().uuid(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;

export async function createCampaign(
  context: Context,
  input: CreateCampaignInput,
): Promise<Result<Campaign, ApplicationError>> {
  // Validate date range if both dates are provided
  if (input.startDate && input.endDate && input.startDate >= input.endDate) {
    return err(new ApplicationError("End date must be after start date"));
  }

  const result = await context.campaignRepository.create({
    name: input.name,
    description: input.description,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    budget: input.budget,
    targetAudience: input.targetAudience,
    goal: input.goal,
    metadata: input.metadata,
    createdBy: input.userId,
  });

  if (result.isErr()) {
    return err(new ApplicationError("Failed to create campaign", result.error));
  }

  return ok(result.value);
}
