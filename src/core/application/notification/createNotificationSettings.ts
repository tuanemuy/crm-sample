import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateNotificationSettingsInput,
  createNotificationSettingsInputSchema,
  type NotificationSettings,
} from "@/core/domain/notification/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createNotificationSettings(
  context: Context,
  userId: string,
  input: CreateNotificationSettingsInput,
): Promise<Result<NotificationSettings, ApplicationError>> {
  // Validate input
  const validationResult = validate(
    createNotificationSettingsInputSchema,
    input,
  );
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for notification settings creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Verify user exists
  const userResult = await context.userRepository.findById(userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to verify user", userResult.error));
  }
  if (userResult.value === null) {
    return err(new ApplicationError("User does not exist"));
  }

  // Check if notification settings already exist
  const existingSettingsResult =
    await context.notificationRepository.getNotificationSettings(userId);
  if (existingSettingsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check existing notification settings",
        existingSettingsResult.error,
      ),
    );
  }

  if (existingSettingsResult.value !== null) {
    return err(
      new ApplicationError("Notification settings already exist for this user"),
    );
  }

  // Create notification settings
  const createResult =
    await context.notificationRepository.createNotificationSettings(
      userId,
      validInput,
    );
  return createResult.mapErr(
    (error) =>
      new ApplicationError("Failed to create notification settings", error),
  );
}
