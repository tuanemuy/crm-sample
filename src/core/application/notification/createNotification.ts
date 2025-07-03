import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateNotificationInput,
  createNotificationInputSchema,
  type Notification,
} from "@/core/domain/notification/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createNotification(
  context: Context,
  input: CreateNotificationInput,
): Promise<Result<Notification, ApplicationError>> {
  // Validate input
  const validationResult = validate(createNotificationInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for notification creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Verify user exists
  const userResult = await context.userRepository.findById(validInput.userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to verify user", userResult.error));
  }
  if (userResult.value === null) {
    return err(new ApplicationError("User does not exist"));
  }

  // Create notification
  const createParams = {
    userId: validInput.userId,
    type: validInput.type,
    title: validInput.title,
    message: validInput.message,
    metadata: validInput.metadata,
    isRead: false,
  };

  const createResult =
    await context.notificationRepository.create(createParams);
  return createResult.mapErr(
    (error) => new ApplicationError("Failed to create notification", error),
  );
}
