import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { DocumentStats } from "@/core/domain/document/types";
import { ApplicationError } from "@/lib/error";

export async function getDocumentStats(
  context: Context,
  _currentUserId: string,
): Promise<Result<DocumentStats, ApplicationError>> {
  // Get document statistics
  const statsResult = await context.documentRepository.getStats();

  if (statsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get document statistics",
        statsResult.error,
      ),
    );
  }

  // In a real implementation, you might filter stats based on user permissions
  // For now, we'll return all stats for authenticated users

  return ok(statsResult.value);
}
