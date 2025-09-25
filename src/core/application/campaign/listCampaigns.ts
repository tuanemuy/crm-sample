import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type {
  Campaign,
  ListCampaignsQuery,
} from "@/core/domain/campaign/types";
import { ApplicationError } from "@/lib/error";

export type ListCampaignsInput = ListCampaignsQuery;

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
