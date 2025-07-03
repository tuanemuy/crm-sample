import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const processJobInputSchema = z.object({
  id: z.string().uuid(),
});

export type ProcessJobInput = z.infer<typeof processJobInputSchema>;

export async function processJob(
  context: Context,
  input: ProcessJobInput,
): Promise<Result<void, ApplicationError | NotFoundError>> {
  const validationResult = validate(processJobInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for job processing",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  const jobResult = await context.importExportRepository.findById(
    validInput.id,
  );
  if (jobResult.isErr()) {
    return err(new ApplicationError("Failed to get job", jobResult.error));
  }

  if (!jobResult.value) {
    return err(new NotFoundError("Job not found"));
  }

  const job = jobResult.value;

  await context.importExportRepository.update(job.id, {
    status: "processing",
    startedAt: new Date(),
  });

  try {
    if (job.operationType === "import") {
      const importResult = await context.importExportService.processImport(job);
      if (importResult.isErr()) {
        await context.importExportRepository.update(job.id, {
          status: "failed",
          errorMessage: importResult.error.message,
          completedAt: new Date(),
        });
        return err(new ApplicationError("Import failed", importResult.error));
      }
    } else {
      const exportResult = await context.importExportService.processExport(job);
      if (exportResult.isErr()) {
        await context.importExportRepository.update(job.id, {
          status: "failed",
          errorMessage: exportResult.error.message,
          completedAt: new Date(),
        });
        return err(new ApplicationError("Export failed", exportResult.error));
      }

      await context.importExportRepository.update(job.id, {
        filePath: exportResult.value,
      });
    }

    await context.importExportRepository.update(job.id, {
      status: "completed",
      completedAt: new Date(),
    });

    return ok(undefined);
  } catch (error) {
    await context.importExportRepository.update(job.id, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      completedAt: new Date(),
    });
    return err(new ApplicationError("Job processing failed", error));
  }
}
