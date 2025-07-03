import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { Document } from "@/core/domain/document/types";
import { ApplicationError, type RepositoryError } from "@/lib/error";

export async function getDocumentsByEntity(
  context: Context,
  entityType: string,
  entityId: string,
  _currentUserId: string,
): Promise<Result<Document[], ApplicationError>> {
  // Validate entity type
  const validEntityTypes = [
    "customer",
    "contact",
    "deal",
    "lead",
    "activity",
    "general",
  ];
  if (!validEntityTypes.includes(entityType)) {
    return err(new ApplicationError(`Invalid entity type: ${entityType}`));
  }

  // Validate that the entity exists
  const entityValidationResult = await validateEntityExists(
    context,
    entityType,
    entityId,
  );
  if (entityValidationResult.isErr()) {
    return err(entityValidationResult.error);
  }

  // Get documents for the entity
  const documentsResult = await context.documentRepository.findByEntity(
    entityType,
    entityId,
  );

  if (documentsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get documents by entity",
        documentsResult.error,
      ),
    );
  }

  // Filter documents based on user permissions
  // For simplicity, we'll show all documents for now
  // In a real implementation, you'd filter based on permissions

  return ok(documentsResult.value);
}

async function validateEntityExists(
  context: Context,
  entityType: string,
  entityId: string,
): Promise<Result<void, ApplicationError>> {
  try {
    let result: Result<unknown, RepositoryError> | undefined;

    switch (entityType) {
      case "customer":
        result = await context.customerRepository.findById(entityId);
        break;
      case "contact":
        result = await context.contactRepository.findById(entityId);
        break;
      case "deal":
        result = await context.dealRepository.findById(entityId);
        break;
      case "lead":
        result = await context.leadRepository.findById(entityId);
        break;
      case "activity":
        result = await context.activityRepository.findById(entityId);
        break;
      case "general":
        // General documents don't need entity validation
        return ok(undefined);
      default:
        return err(new ApplicationError(`Invalid entity type: ${entityType}`));
    }

    if (result.isErr()) {
      return err(
        new ApplicationError(
          `Failed to verify ${entityType} exists`,
          result.error,
        ),
      );
    }

    if (result.value === null) {
      return err(
        new ApplicationError(
          `${entityType} with ID ${entityId} does not exist`,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new ApplicationError("Unexpected error during entity validation", error),
    );
  }
}
