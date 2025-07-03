import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type NotificationSettings,
  type UpdateNotificationSettingsInput,
  updateNotificationSettingsInputSchema,
} from "@/core/domain/notification/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateNotificationSettings(
  context: Context,
  userId: string,
  input: UpdateNotificationSettingsInput,
): Promise<Result<NotificationSettings, ApplicationError>> {
  // Validate input
  const validationResult = validate(
    updateNotificationSettingsInputSchema,
    input,
  );
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for notification settings update",
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

  // Check if notification settings exist
  const settingsResult =
    await context.notificationRepository.getNotificationSettings(userId);
  if (settingsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get notification settings",
        settingsResult.error,
      ),
    );
  }

  // If settings don't exist, return error (should be created first)
  if (settingsResult.value === null) {
    return err(
      new ApplicationError(
        "Notification settings not found. Please create settings first.",
      ),
    );
  }

  // Update notification settings
  const updateResult =
    await context.notificationRepository.updateNotificationSettings(
      userId,
      validInput,
    );
  return updateResult.mapErr(
    (error) =>
      new ApplicationError("Failed to update notification settings", error),
  );
}
