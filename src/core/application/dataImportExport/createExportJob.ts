import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { ImportExportJob } from "@/core/domain/dataImportExport/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const createExportJobInputSchema = z.object({
  userId: z.string().uuid(),
  dataType: z.enum([
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
  ]),
  format: z.enum(["csv", "json", "xlsx", "xml"]),
  fileName: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type CreateExportJobInput = z.infer<typeof createExportJobInputSchema>;

export async function createExportJob(
  context: Context,
  input: CreateExportJobInput,
): Promise<Result<ImportExportJob, ApplicationError>> {
  const validationResult = validate(createExportJobInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for export job creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  const createResult =
    await context.importExportRepository.createExportJob(validInput);
  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create export job", createResult.error),
    );
  }

  return ok(createResult.value);
}
