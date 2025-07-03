import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Campaign } from "@/core/domain/campaign/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";

export const listCampaignsInputSchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      keyword: z.string().optional(),
      type: z.enum(["email", "sms", "social", "event", "webinar"]).optional(),
      status: z
        .enum(["draft", "active", "paused", "completed", "cancelled"])
        .optional(),
      createdBy: z.string().uuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["name", "type", "status", "startDate", "createdAt"])
        .default("createdAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
export type ListCampaignsInput = z.infer<typeof listCampaignsInputSchema>;

export async function listCampaigns(
  context: Context,
  input: ListCampaignsInput,
): Promise<Result<{ items: Campaign[]; count: number }, ApplicationError>> {
  const result = await context.campaignRepository.list(input);

  if (result.isErr()) {
    return err(new ApplicationError("Failed to list campaigns", result.error));
  }

  return ok(result.value);
}
