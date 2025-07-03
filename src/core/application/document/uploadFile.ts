import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateDocumentInput,
  type Document,
  type UploadFileInput,
  uploadFileInputSchema,
} from "@/core/domain/document/types";
import { ApplicationError, type RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function uploadFile(
  context: Context,
  input: UploadFileInput,
  currentUserId: string,
): Promise<Result<Document, ApplicationError>> {
  // Validate input
  const validationResult = validate(uploadFileInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for file upload",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Validate file
  if (!validInput.file) {
    return err(new ApplicationError("No file provided"));
  }

  // Extract file information
  const buffer = validInput.file.buffer || Buffer.from(validInput.file);
  const filename =
    validInput.file.originalname || validInput.file.name || "unnamed_file";
  const mimeType =
    validInput.file.mimetype ||
    validInput.file.type ||
    "application/octet-stream";
  const size = validInput.file.size || buffer.length;

  // Validate file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (size > maxSize) {
    return err(
      new ApplicationError("File size exceeds maximum limit of 100MB"),
    );
  }

  // Validate entity if provided
  if (validInput.entityId) {
    const entityValidationResult = await validateEntityExists(
      context,
      validInput.entityType,
      validInput.entityId,
    );
    if (entityValidationResult.isErr()) {
      return err(entityValidationResult.error);
    }
  }

  try {
    // Upload file to storage
    const uploadResult = await context.storageManager.uploadFile({
      buffer,
      filename,
      mimeType,
      size,
    });

    if (uploadResult.isErr()) {
      return err(
        new ApplicationError("Failed to upload file", uploadResult.error),
      );
    }

    const uploadedFile = uploadResult.value;

    // Create document record
    const createDocumentInput: CreateDocumentInput = {
      filename: uploadedFile.filename,
      originalFilename: filename,
      mimeType,
      size,
      url: uploadedFile.url,
      description: validInput.description,
      tags: validInput.tags || [],
      entityType: validInput.entityType,
      entityId: validInput.entityId,
      isPublic: validInput.isPublic || false,
    };

    const createParams = {
      ...createDocumentInput,
      uploadedBy: currentUserId,
    };

    const createResult = await context.documentRepository.create(createParams);
    return createResult.mapErr(
      (error) =>
        new ApplicationError("Failed to create document record", error),
    );
  } catch (error) {
    return err(
      new ApplicationError("Unexpected error during file upload", error),
    );
  }
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
