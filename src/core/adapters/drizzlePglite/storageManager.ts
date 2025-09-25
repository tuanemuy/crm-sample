import { promises as fs } from "node:fs";
import path from "node:path";
import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import type { StorageManager } from "@/core/domain/document/ports/storageManager";
import type {
  UploadFileParams,
  UploadFileResult,
} from "@/core/domain/document/types";
import { RepositoryError } from "@/lib/error";

export class LocalStorageManager implements StorageManager {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(baseDir = "./uploads", baseUrl = "/api/files") {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private generateUniqueFilename(originalFilename: string): string {
    const extension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, extension);
    const uniqueId = uuidv7();
    return `${baseName}_${uniqueId}${extension}`;
  }

  async uploadFile(
    params: UploadFileParams,
  ): Promise<Result<UploadFileResult, RepositoryError>> {
    try {
      await this.ensureDirectoryExists(this.baseDir);

      const filename = this.generateUniqueFilename(params.filename);
      const filePath = path.join(this.baseDir, filename);

      await fs.writeFile(filePath, params.buffer);

      const url = `${this.baseUrl}/${filename}`;

      return ok({
        url,
        filename,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to upload file", error));
    }
  }

  async deleteFile(filename: string): Promise<Result<void, RepositoryError>> {
    try {
      const filePath = path.join(this.baseDir, filename);
      await fs.unlink(filePath);
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete file", error));
    }
  }

  async getFileUrl(filename: string): Promise<Result<string, RepositoryError>> {
    try {
      const filePath = path.join(this.baseDir, filename);
      await fs.access(filePath);
      const url = `${this.baseUrl}/${filename}`;
      return ok(url);
    } catch (error) {
      return err(new RepositoryError("File not found", error));
    }
  }

  async getSignedUrl(
    filename: string,
    _expirationSeconds = 3600,
  ): Promise<Result<string, RepositoryError>> {
    // For local storage, we don't implement signed URLs
    // Just return the regular URL
    return this.getFileUrl(filename);
  }

  async copyFile(
    sourceFilename: string,
    destinationFilename: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      const sourcePath = path.join(this.baseDir, sourceFilename);
      const destPath = path.join(this.baseDir, destinationFilename);

      await fs.copyFile(sourcePath, destPath);
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to copy file", error));
    }
  }

  async fileExists(
    filename: string,
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const filePath = path.join(this.baseDir, filename);
      await fs.access(filePath);
      return ok(true);
    } catch {
      return ok(false);
    }
  }

  async getFileMetadata(
    filename: string,
  ): Promise<
    Result<
      { size: number; mimeType: string; lastModified: Date },
      RepositoryError
    >
  > {
    try {
      const filePath = path.join(this.baseDir, filename);
      const stats = await fs.stat(filePath);

      // Simple MIME type detection based on file extension
      const extension = path.extname(filename).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".ppt": "application/vnd.ms-powerpoint",
        ".pptx":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".avi": "video/avi",
        ".mov": "video/quicktime",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".zip": "application/zip",
        ".rar": "application/x-rar-compressed",
      };

      const mimeType = mimeTypeMap[extension] || "application/octet-stream";

      return ok({
        size: stats.size,
        mimeType,
        lastModified: stats.mtime,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get file metadata", error));
    }
  }
}
