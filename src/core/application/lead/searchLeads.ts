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

// Search leads input schema
export const searchLeadsInputSchema = z.object({
  keyword: z.string().min(1).max(100),
  pagination: paginationSchema.optional(),
  filter: leadFilterSchema.omit({ keyword: true }).optional(),
  sortBy: z
    .enum([
      "firstName",
      "lastName",
      "company",
      "score",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SearchLeadsInput = z.infer<typeof searchLeadsInputSchema>;

export async function searchLeads(
  context: Context,
  input: SearchLeadsInput,
): Promise<Result<{ items: LeadWithUser[]; count: number }, ApplicationError>> {
  // Validate input
  const validationResult = validate(searchLeadsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for searching leads",
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
      order: "desc",
      orderBy: validInput.sortBy || "createdAt",
    },
    filter: {
      ...validInput.filter,
      keyword: validInput.keyword,
    },
    sortBy: validInput.sortBy,
    sortOrder: validInput.sortOrder,
  };

  // Use existing listLeads functionality
  const listResult = await context.leadRepository.list(query);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to search leads", listResult.error),
    );
  }

  return ok(listResult.value);
}
