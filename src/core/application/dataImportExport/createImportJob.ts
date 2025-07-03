import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { ImportExportJob } from "@/core/domain/dataImportExport/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const createImportJobInputSchema = z.object({
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
  filePath: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type CreateImportJobInput = z.infer<typeof createImportJobInputSchema>;

export async function createImportJob(
  context: Context,
  input: CreateImportJobInput,
): Promise<Result<ImportExportJob, ApplicationError>> {
  const validationResult = validate(createImportJobInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for import job creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  const fileValidation = await context.importExportService.validateImportFile(
    validInput.filePath,
    validInput.format,
  );
  if (fileValidation.isErr()) {
    return err(
      new ApplicationError("Invalid import file", fileValidation.error),
    );
  }

  const createResult =
    await context.importExportRepository.createImportJob(validInput);
  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create import job", createResult.error),
    );
  }

  return ok(createResult.value);
}
