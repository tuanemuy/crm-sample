import type { Result } from "neverthrow";
import type { ApplicationError } from "@/lib/error";
import type { DataType, Format, ImportExportJob } from "../types";

export interface ImportExportService {
  processImport(job: ImportExportJob): Promise<Result<void, ApplicationError>>;
  processExport(
    job: ImportExportJob,
  ): Promise<Result<string, ApplicationError>>;
  validateImportFile(
    filePath: string,
    format: Format,
  ): Promise<Result<boolean, ApplicationError>>;
  getSupportedFormats(): Format[];
  getSupportedDataTypes(): DataType[];
}
