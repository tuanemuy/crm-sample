import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { ImportExportJob } from "@/core/domain/dataImportExport/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const listJobsInputSchema = z.object({
  userId: z.string().uuid(),
  operationType: z.enum(["import", "export"]).optional(),
  dataType: z
    .enum([
      "customers",
      "contacts",
      "leads",
      "deals",
      "activities",
      "users",
      "organizations",
      "proposals",
      "documents",
      "all",
    ])
    .optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
});

export type ListJobsInput = z.infer<typeof listJobsInputSchema>;

export async function listJobs(
  context: Context,
  input: ListJobsInput,
): Promise<Result<ImportExportJob[], ApplicationError>> {
  const validationResult = validate(listJobsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for listing jobs",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  const result = await context.importExportRepository.list(validInput);
  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to list import/export jobs", result.error),
    );
  }

  return ok(result.value);
}
