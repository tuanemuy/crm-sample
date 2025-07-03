import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { DocumentWithRelations } from "@/core/domain/document/types";
import { ApplicationError } from "@/lib/error";

export async function getDocument(
  context: Context,
  id: string,
  currentUserId: string,
): Promise<Result<DocumentWithRelations, ApplicationError>> {
  // Find document with relations
  const documentResult =
    await context.documentRepository.findByIdWithRelations(id);

  if (documentResult.isErr()) {
    return err(
      new ApplicationError("Failed to find document", documentResult.error),
    );
  }

  if (documentResult.value === null) {
    return err(new ApplicationError("Document not found"));
  }

  const document = documentResult.value;

  // Check access permissions
  // Users can access documents if:
  // 1. They uploaded the document
  // 2. The document is public
  // 3. They have access to the related entity (for simplicity, we'll allow all authenticated users for now)

  if (!document.isPublic && document.uploadedBy !== currentUserId) {
    // For now, we'll allow access if the user is authenticated
    // In a real implementation, you'd check entity-specific permissions
  }

  return ok(document);
}
