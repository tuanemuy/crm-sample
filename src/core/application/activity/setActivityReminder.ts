import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Notification } from "@/core/domain/notification/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Input schema for setting activity reminder
export const setActivityReminderInputSchema = z.object({
  activityId: z.string().uuid(),
  reminderAt: z.date(),
  message: z.string().optional(),
});

export type SetActivityReminderInput = z.infer<
  typeof setActivityReminderInputSchema
>;

export async function setActivityReminder(
  context: Context,
  input: SetActivityReminderInput,
  userId: string,
): Promise<Result<Notification, ApplicationError>> {
  // Validate input
  const validationResult = validate(setActivityReminderInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for setting activity reminder",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Verify activity exists
  const activityResult = await context.activityRepository.findById(
    validInput.activityId,
  );
  if (activityResult.isErr()) {
    return err(
      new ApplicationError("Failed to get activity", activityResult.error),
    );
  }
  if (activityResult.value === null) {
    return err(new ApplicationError("Activity not found"));
  }

  const activity = activityResult.value;

  // Verify user exists
  const userResult = await context.userRepository.findById(userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to verify user", userResult.error));
  }
  if (userResult.value === null) {
    return err(new ApplicationError("User does not exist"));
  }

  // Create reminder notification
  const reminderTitle = `Activity Reminder: ${activity.subject}`;
  const reminderMessage =
    validInput.message ||
    `Reminder for your ${activity.type} activity: "${activity.subject}"`;

  const createNotificationInput = {
    userId: userId,
    type: "reminder" as const,
    title: reminderTitle,
    message: reminderMessage,
    metadata: {
      activityId: validInput.activityId,
      activityType: activity.type,
      activitySubject: activity.subject,
      reminderAt: validInput.reminderAt.toISOString(),
      scheduledAt: activity.scheduledAt?.toISOString(),
      dueDate: activity.dueDate?.toISOString(),
    },
  };

  const createResult = await context.notificationRepository.create({
    userId: createNotificationInput.userId,
    type: createNotificationInput.type,
    title: createNotificationInput.title,
    message: createNotificationInput.message,
    metadata: createNotificationInput.metadata,
    isRead: false,
  });

  return createResult.mapErr(
    (error) =>
      new ApplicationError("Failed to create activity reminder", error),
  );
}
