import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { ReportData } from "@/core/domain/report/types";
import { reportFilterSchema } from "@/core/domain/report/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const generateReportInputSchema = z.object({
  reportId: z.string().uuid(),
  filter: reportFilterSchema.optional(),
});
export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;

export async function generateReport(
  context: Context,
  input: GenerateReportInput,
): Promise<Result<ReportData, ApplicationError>> {
  const result = await context.reportRepository.generate(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to generate report", error);
  });
}
