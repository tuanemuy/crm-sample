import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateNotificationSettingsInput,
  createNotificationSettingsInputSchema,
  type NotificationSettings,
} from "@/core/domain/notification/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function getNotificationSettings(
  context: Context,
  userId: string,
): Promise<Result<NotificationSettings, ApplicationError>> {
  // Verify user exists
  const userResult = await context.userRepository.findById(userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to verify user", userResult.error));
  }
  if (userResult.value === null) {
    return err(new ApplicationError("User does not exist"));
  }

  // Get notification settings
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

  // If settings don't exist, create default settings
  if (settingsResult.value === null) {
    const defaultSettings: CreateNotificationSettingsInput = {
      emailNotifications: true,
      pushNotifications: true,
      reminderNotifications: true,
      dealNotifications: true,
      activityNotifications: true,
      leadNotifications: true,
    };

    const validationResult = validate(
      createNotificationSettingsInputSchema,
      defaultSettings,
    );
    if (validationResult.isErr()) {
      return err(
        new ApplicationError(
          "Invalid default notification settings",
          validationResult.error,
        ),
      );
    }

    const createResult =
      await context.notificationRepository.createNotificationSettings(
        userId,
        validationResult.value,
      );
    return createResult.mapErr(
      (error) =>
        new ApplicationError(
          "Failed to create default notification settings",
          error,
        ),
    );
  }

  return ok(settingsResult.value);
}
