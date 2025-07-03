import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { Report } from "@/core/domain/report/types";
import {
  reportCategorySchema,
  reportTypeSchema,
} from "@/core/domain/report/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import type { Context } from "../context";

export const listReportsInputSchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      type: reportTypeSchema.optional(),
      category: reportCategorySchema.optional(),
      isTemplate: z.boolean().optional(),
      isPublic: z.boolean().optional(),
      createdBy: z.string().uuid().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListReportsInput = z.infer<typeof listReportsInputSchema>;

export async function listReports(
  context: Context,
  input: ListReportsInput,
): Promise<Result<{ items: Report[]; count: number }, ApplicationError>> {
  const result = await context.reportRepository.list(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to list reports", error);
  });
}
