import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Document,
  type UpdateDocumentInput,
  updateDocumentInputSchema,
} from "@/core/domain/document/types";
import { ApplicationError, type RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateDocument(
  context: Context,
  id: string,
  input: UpdateDocumentInput,
  currentUserId: string,
): Promise<Result<Document, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateDocumentInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for document update",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

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

  // Check permission - only the uploader can update the document for now
  if (existingDocument.uploadedBy !== currentUserId) {
    return err(
      new ApplicationError(
        "Permission denied: You can only update documents you uploaded",
      ),
    );
  }

  // Validate entity if provided
  if (validInput.entityId && validInput.entityType) {
    const entityValidationResult = await validateEntityExists(
      context,
      validInput.entityType,
      validInput.entityId,
    );
    if (entityValidationResult.isErr()) {
      return err(entityValidationResult.error);
    }
  }

  // Update document
  const updateResult = await context.documentRepository.update(id, validInput);
  return updateResult.mapErr(
    (error) => new ApplicationError("Failed to update document", error),
  );
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
