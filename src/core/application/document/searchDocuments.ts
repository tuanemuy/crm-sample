import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { Document } from "@/core/domain/document/types";
import { ApplicationError } from "@/lib/error";

export async function searchDocuments(
  context: Context,
  keyword: string,
  _currentUserId: string,
  limit = 20,
): Promise<Result<Document[], ApplicationError>> {
  // Validate input
  if (!keyword || keyword.trim().length === 0) {
    return err(new ApplicationError("Search keyword is required"));
  }

  if (keyword.trim().length < 2) {
    return err(
      new ApplicationError("Search keyword must be at least 2 characters long"),
    );
  }

  if (limit < 1 || limit > 100) {
    return err(new ApplicationError("Limit must be between 1 and 100"));
  }

  // Search documents
  const searchResult = await context.documentRepository.search(
    keyword.trim(),
    limit,
  );

  if (searchResult.isErr()) {
    return err(
      new ApplicationError("Failed to search documents", searchResult.error),
    );
  }

  // Filter documents based on user permissions
  // For simplicity, we'll show all documents for now
  // In a real implementation, you'd filter based on permissions

  return ok(searchResult.value);
}
