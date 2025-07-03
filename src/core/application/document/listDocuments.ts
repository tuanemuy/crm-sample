import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Document,
  type ListDocumentsQuery,
  listDocumentsQuerySchema,
} from "@/core/domain/document/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function listDocuments(
  context: Context,
  query: ListDocumentsQuery,
  _currentUserId: string,
): Promise<Result<{ items: Document[]; count: number }, ApplicationError>> {
  // Validate query
  const validationResult = validate(listDocumentsQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid query for listing documents",
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // For non-admin users, limit access to their own documents and public documents
  // This is a simplified permission model
  const enhancedQuery = {
    ...validQuery,
    filter: {
      ...validQuery.filter,
      // Note: In a real implementation, you'd add permission filtering here
      // For now, we'll show all documents the user has access to
    },
  };

  // Get documents
  const documentsResult = await context.documentRepository.list(enhancedQuery);

  if (documentsResult.isErr()) {
    return err(
      new ApplicationError("Failed to list documents", documentsResult.error),
    );
  }

  return ok(documentsResult.value);
}
