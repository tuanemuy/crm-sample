import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  createProposalSchema,
  Proposal,
} from "@/core/domain/proposal/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type CreateProposalInput = z.infer<typeof createProposalSchema>;

export async function createProposal(
  context: Context,
  input: CreateProposalInput,
): Promise<Result<Proposal, ApplicationError>> {
  const result = await context.proposalRepository.createProposal(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to create proposal", error);
  });
}
