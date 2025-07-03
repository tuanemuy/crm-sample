import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import {
  type LeadWithUser,
  type ListLeadsQuery,
  leadFilterSchema,
} from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import { validate } from "@/lib/validation";

// Filter leads by score input schema
export const filterLeadsByScoreInputSchema = z
  .object({
    minScore: z.number().int().min(0).max(100).optional(),
    maxScore: z.number().int().min(0).max(100).optional(),
    pagination: paginationSchema.optional(),
    filter: leadFilterSchema
      .omit({ minScore: true, maxScore: true })
      .optional(),
    sortBy: z
      .enum([
        "firstName",
        "lastName",
        "company",
        "score",
        "createdAt",
        "updatedAt",
      ])
      .default("score"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    (data) => {
      // If both minScore and maxScore are provided, minScore should be <= maxScore
      if (data.minScore !== undefined && data.maxScore !== undefined) {
        return data.minScore <= data.maxScore;
      }
      // At least one of minScore or maxScore should be provided
      return data.minScore !== undefined || data.maxScore !== undefined;
    },
    {
      message:
        "Invalid score range: minScore must be less than or equal to maxScore, and at least one score limit must be provided",
    },
  );

export type FilterLeadsByScoreInput = z.infer<
  typeof filterLeadsByScoreInputSchema
>;

export async function filterLeadsByScore(
  context: Context,
  input: FilterLeadsByScoreInput,
): Promise<Result<{ items: LeadWithUser[]; count: number }, ApplicationError>> {
  // Validate input
  const validationResult = validate(filterLeadsByScoreInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for filtering leads by score",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Construct query for list leads
  const query: ListLeadsQuery = {
    pagination: validInput.pagination || {
      page: 1,
      limit: 20,
      order: validInput.sortOrder,
      orderBy: validInput.sortBy,
    },
    filter: {
      ...validInput.filter,
      minScore: validInput.minScore,
      maxScore: validInput.maxScore,
    },
    sortBy: validInput.sortBy,
    sortOrder: validInput.sortOrder,
  };

  // Use existing listLeads functionality
  const listResult = await context.leadRepository.list(query);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to filter leads by score", listResult.error),
    );
  }

  return ok(listResult.value);
}
