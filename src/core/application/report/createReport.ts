import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { Report } from "@/core/domain/report/types";
import {
  reportCategorySchema,
  reportTypeSchema,
} from "@/core/domain/report/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const createReportInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: reportTypeSchema,
  category: reportCategorySchema,
  config: z.record(z.string(), z.unknown()).optional(),
  isTemplate: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(false),
  createdBy: z.string().uuid(),
});
export type CreateReportInput = z.infer<typeof createReportInputSchema>;

export async function createReport(
  context: Context,
  input: CreateReportInput,
): Promise<Result<Report, ApplicationError>> {
  const result = await context.reportRepository.create(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to create report", error);
  });
}
