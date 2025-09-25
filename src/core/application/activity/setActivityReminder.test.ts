import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { createActivity } from "./createActivity";
import type { SetActivityReminderInput } from "./setActivityReminder";
import { setActivityReminder } from "./setActivityReminder";

let db: Database;
let context: Context;

describe("setActivityReminder", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid activity ID", async () => {
      const input: SetActivityReminderInput = {
        activityId: "invalid-id",
        reminderAt: new Date(),
        message: "Test reminder",
      };

      const result = await setActivityReminder(
        context,
        input,
        "123e4567-e89b-12d3-a456-426614174000",
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for setting activity reminder",
      );
    });

    it("should reject invalid reminder date", async () => {
      const input = {
        activityId: "123e4567-e89b-12d3-a456-426614174000",
        reminderAt: "invalid-date" as unknown as Date,
        message: "Test reminder",
      };

      const result = await setActivityReminder(
        context,
        input,
        "123e4567-e89b-12d3-a456-426614174000",
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for setting activity reminder",
      );
    });

    it("should accept valid input without message", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Important Call",
          description: "Call with potential client",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: new Date(),
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("activity validation", () => {
    it("should reject reminder for non-existent activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: SetActivityReminderInput = {
        activityId: "123e4567-e89b-12d3-a456-426614174000",
        reminderAt: new Date(),
        message: "Test reminder",
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Activity not found");
    });
  });

  describe("user validation", () => {
    it("should reject reminder for non-existent user", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Important Call",
          description: "Call with potential client",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: new Date(),
        message: "Test reminder",
      };

      const result = await setActivityReminder(
        context,
        input,
        "123e4567-e89b-12d3-a456-426614174000",
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("User does not exist");
    });
  });

  describe("successful reminder creation", () => {
    it("should create reminder with custom message", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Important Call",
          description: "Call with potential client",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const reminderDate = new Date("2024-12-25T10:00:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: reminderDate,
        message: "Don't forget this important call!",
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.userId).toBe(user.id);
      expect(notification.type).toBe("reminder");
      expect(notification.title).toBe("Activity Reminder: Important Call");
      expect(notification.message).toBe("Don't forget this important call!");
      expect(notification.isRead).toBe(false);
      expect(notification.metadata).toBeDefined();
      expect(notification.metadata.activityId).toBe(activity.id);
      expect(notification.metadata.activityType).toBe("call");
      expect(notification.metadata.activitySubject).toBe("Important Call");
      expect(notification.metadata.reminderAt).toBe(reminderDate.toISOString());
    });

    it("should create reminder with default message", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "email",
          subject: "Follow-up Email",
          description: "Send follow-up email to client",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const reminderDate = new Date("2024-12-20T09:00:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: reminderDate,
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.userId).toBe(user.id);
      expect(notification.type).toBe("reminder");
      expect(notification.title).toBe("Activity Reminder: Follow-up Email");
      expect(notification.message).toBe(
        'Reminder for your email activity: "Follow-up Email"',
      );
      expect(notification.isRead).toBe(false);
      expect(notification.metadata).toBeDefined();
      expect(notification.metadata.activityId).toBe(activity.id);
      expect(notification.metadata.activityType).toBe("email");
      expect(notification.metadata.activitySubject).toBe("Follow-up Email");
    });

    it("should create reminder for meeting activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a meeting activity with scheduled date
      const scheduledDate = new Date("2024-12-30T14:00:00Z");
      const createResult = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Team Meeting",
          description: "Weekly team meeting",
          priority: "medium",
          scheduledAt: scheduledDate,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const reminderDate = new Date("2024-12-30T13:45:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: reminderDate,
        message: "Meeting starts in 15 minutes",
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.userId).toBe(user.id);
      expect(notification.type).toBe("reminder");
      expect(notification.title).toBe("Activity Reminder: Team Meeting");
      expect(notification.message).toBe("Meeting starts in 15 minutes");
      expect(notification.metadata.activityType).toBe("meeting");
      expect(notification.metadata.scheduledAt).toBe(
        scheduledDate.toISOString(),
      );
    });

    it("should create reminder for task activity with due date", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a task activity with due date
      const dueDate = new Date("2024-12-31T17:00:00Z");
      const createResult = await createActivity(
        context,
        {
          type: "task",
          subject: "Project Deadline",
          description: "Complete project by deadline",
          priority: "urgent",
          dueDate: dueDate,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const reminderDate = new Date("2024-12-31T12:00:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: reminderDate,
        message: "Deadline is approaching!",
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.userId).toBe(user.id);
      expect(notification.type).toBe("reminder");
      expect(notification.title).toBe("Activity Reminder: Project Deadline");
      expect(notification.message).toBe("Deadline is approaching!");
      expect(notification.metadata.activityType).toBe("task");
      expect(notification.metadata.dueDate).toBe(dueDate.toISOString());
    });

    it("should create reminder for note activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a note activity
      const createResult = await createActivity(
        context,
        {
          type: "note",
          subject: "Important Note",
          description: "Remember to review this note",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const reminderDate = new Date("2024-12-28T08:00:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: reminderDate,
        message: "Review this note",
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.userId).toBe(user.id);
      expect(notification.type).toBe("reminder");
      expect(notification.title).toBe("Activity Reminder: Important Note");
      expect(notification.message).toBe("Review this note");
      expect(notification.metadata.activityType).toBe("note");
    });
  });

  describe("edge cases", () => {
    it("should handle past reminder date", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Past Call",
          description: "Call that happened in the past",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const pastDate = new Date("2023-01-01T10:00:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: pastDate,
        message: "This reminder is for the past",
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.metadata.reminderAt).toBe(pastDate.toISOString());
    });

    it("should handle very long custom message", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "email",
          subject: "Email Activity",
          description: "Email with long reminder",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const longMessage =
        "This is a very long reminder message that contains a lot of details about what needs to be done, including specific instructions, deadlines, and important notes that should not be forgotten.";
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: new Date("2024-12-25T10:00:00Z"),
        message: longMessage,
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.message).toBe(longMessage);
    });

    it("should handle activity with all optional fields", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity with all optional fields
      const scheduledDate = new Date("2024-12-30T10:00:00Z");
      const dueDate = new Date("2024-12-30T17:00:00Z");
      const createResult = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Complete Meeting",
          description: "Meeting with all details",
          priority: "high",
          scheduledAt: scheduledDate,
          dueDate: dueDate,
          duration: 60,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const reminderDate = new Date("2024-12-30T09:45:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: reminderDate,
        message: "Complete meeting reminder",
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.metadata.scheduledAt).toBe(
        scheduledDate.toISOString(),
      );
      expect(notification.metadata.dueDate).toBe(dueDate.toISOString());
    });

    it("should handle activity with minimal fields", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity with minimal fields
      const createResult = await createActivity(
        context,
        {
          type: "note",
          subject: "Simple Note",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const reminderDate = new Date("2024-12-25T10:00:00Z");
      const input: SetActivityReminderInput = {
        activityId: activity.id,
        reminderAt: reminderDate,
      };

      const result = await setActivityReminder(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const notification = result._unsafeUnwrap();
      expect(notification.metadata.scheduledAt).toBeUndefined();
      expect(notification.metadata.dueDate).toBeUndefined();
      expect(notification.metadata.activitySubject).toBe("Simple Note");
    });
  });
});
