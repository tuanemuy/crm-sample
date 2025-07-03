import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  createProposalItemSchema,
  ProposalItem,
} from "@/core/domain/proposal/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type CreateProposalItemInput = z.infer<typeof createProposalItemSchema>;

export async function createProposalItem(
  context: Context,
  input: CreateProposalItemInput,
): Promise<Result<ProposalItem, ApplicationError>> {
  const result = await context.proposalRepository.createProposalItem(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to create proposal item", error);
  });
}
