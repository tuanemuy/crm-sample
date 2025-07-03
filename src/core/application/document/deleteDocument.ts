import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";

export async function deleteDocument(
  context: Context,
  id: string,
  currentUserId: string,
): Promise<Result<void, ApplicationError>> {
  // Check if document exists and user has permission
  const existingDocumentResult = await context.documentRepository.findById(id);
  if (existingDocumentResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to find document",
        existingDocumentResult.error,
      ),
    );
  }

  if (existingDocumentResult.value === null) {
    return err(new ApplicationError("Document not found"));
  }

  const existingDocument = existingDocumentResult.value;

  // Check permission - only the uploader can delete the document for now
  if (existingDocument.uploadedBy !== currentUserId) {
    return err(
      new ApplicationError(
        "Permission denied: You can only delete documents you uploaded",
      ),
    );
  }

  try {
    // Delete file from storage
    const deleteFileResult = await context.storageManager.deleteFile(
      existingDocument.filename,
    );
    if (deleteFileResult.isErr()) {
      // Log the error but continue with database deletion
      console.warn(
        "Failed to delete file from storage:",
        deleteFileResult.error,
      );
    }

    // Delete document record from database
    const deleteResult = await context.documentRepository.delete(id);
    return deleteResult.mapErr(
      (error) => new ApplicationError("Failed to delete document", error),
    );
  } catch (error) {
    return err(
      new ApplicationError("Unexpected error during document deletion", error),
    );
  }
}
