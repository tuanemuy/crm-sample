import type { Result } from "neverthrow";
import type { ProposalWithItems } from "@/core/domain/proposal/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export async function getProposalWithItems(
  context: Context,
  id: string,
): Promise<Result<ProposalWithItems | null, ApplicationError>> {
  const result = await context.proposalRepository.findProposalWithItems(id);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to get proposal with items", error);
  });
}
