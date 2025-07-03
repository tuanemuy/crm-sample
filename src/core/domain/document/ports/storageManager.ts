import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type { UploadFileParams, UploadFileResult } from "../types";

export interface StorageManager {
  uploadFile(
    params: UploadFileParams,
  ): Promise<Result<UploadFileResult, RepositoryError>>;

  deleteFile(filename: string): Promise<Result<void, RepositoryError>>;

  getFileUrl(filename: string): Promise<Result<string, RepositoryError>>;

  getSignedUrl(
    filename: string,
    expirationSeconds?: number,
  ): Promise<Result<string, RepositoryError>>;

  copyFile(
    sourceFilename: string,
    destinationFilename: string,
  ): Promise<Result<void, RepositoryError>>;

  fileExists(filename: string): Promise<Result<boolean, RepositoryError>>;

  getFileMetadata(
    filename: string,
  ): Promise<
    Result<
      { size: number; mimeType: string; lastModified: Date },
      RepositoryError
    >
  >;
}
