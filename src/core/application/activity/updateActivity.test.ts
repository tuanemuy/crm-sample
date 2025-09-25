import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { UpdateActivityInput } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { createActivity } from "./createActivity";
import { updateActivity } from "./updateActivity";

let db: Database;
let context: Context;

describe("updateActivity", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("parameter validation", () => {
    it("should validate activity update requirements", async () => {
      const invalidInputs = [
        { activityId: "invalid-id", input: { subject: "Updated Subject" } }, // Invalid UUID
        { activityId: "", input: { subject: "Updated Subject" } }, // Empty ID
        {
          activityId: "123e4567-e89b-12d3-a456-426614174000",
          input: { subject: "" },
        }, // Empty subject
        {
          activityId: "123e4567-e89b-12d3-a456-426614174000",
          input: { assignedUserId: "invalid-user-id" },
        }, // Invalid user ID
        {
          activityId: "123e4567-e89b-12d3-a456-426614174000",
          input: { duration: 0 },
        }, // Invalid duration
      ];

      for (const { activityId, input } of invalidInputs) {
        const result = await updateActivity(
          context,
          activityId,
          input as UpdateActivityInput,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      }
    });
  });

  describe("activity validation", () => {
    it("should reject updating non-existent activity", async () => {
      const input: UpdateActivityInput = {
        subject: "Updated Subject",
        description: "Updated description",
      };

      const result = await updateActivity(
        context,
        "123e4567-e89b-12d3-a456-426614174000",
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Activity not found");
    });
  });

  describe("successful updates", () => {
    it("should update activity subject", async () => {
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
          subject: "Original Subject",
          description: "Original description",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity
      const updateResult = await updateActivity(context, activity.id, {
        subject: "Updated Subject",
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.subject).toBe("Updated Subject");
      expect(updatedActivity.description).toBe("Original description");
      expect(updatedActivity.priority).toBe("medium");
    });

    it("should update activity description", async () => {
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
          subject: "Email Subject",
          description: "Original description",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity
      const updateResult = await updateActivity(context, activity.id, {
        description: "Updated description with more details",
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.subject).toBe("Email Subject");
      expect(updatedActivity.description).toBe(
        "Updated description with more details",
      );
    });

    it("should update activity priority", async () => {
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
          type: "meeting",
          subject: "Meeting Subject",
          description: "Meeting description",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity
      const updateResult = await updateActivity(context, activity.id, {
        priority: "urgent",
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.priority).toBe("urgent");
    });

    it("should update activity status", async () => {
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
          type: "task",
          subject: "Task Subject",
          description: "Task description",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity
      const updateResult = await updateActivity(context, activity.id, {
        status: "in_progress",
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.status).toBe("in_progress");
    });

    it("should update activity assigned user", async () => {
      // Create two users
      const user1Result = await context.userRepository.create({
        name: "User One",
        email: "user1@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(user1Result.isOk()).toBe(true);
      const user1 = user1Result._unsafeUnwrap();

      const user2Result = await context.userRepository.create({
        name: "User Two",
        email: "user2@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(user2Result.isOk()).toBe(true);
      const user2 = user2Result._unsafeUnwrap();

      // Create an activity assigned to user1
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Call Subject",
          description: "Call description",
          priority: "medium",
          assignedUserId: user1.id,
        },
        user1.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity to assign to user2
      const updateResult = await updateActivity(context, activity.id, {
        assignedUserId: user2.id,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.assignedUserId).toBe(user2.id);
    });

    it("should update activity scheduled date", async () => {
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
          type: "meeting",
          subject: "Meeting Subject",
          description: "Meeting description",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const newScheduledDate = new Date("2024-12-25T10:00:00Z");
      // Update activity
      const updateResult = await updateActivity(context, activity.id, {
        scheduledAt: newScheduledDate,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.scheduledAt).toEqual(newScheduledDate);
    });

    it("should update activity due date", async () => {
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
          type: "task",
          subject: "Task Subject",
          description: "Task description",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const newDueDate = new Date("2024-12-31T23:59:59Z");
      // Update activity
      const updateResult = await updateActivity(context, activity.id, {
        dueDate: newDueDate,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.dueDate).toEqual(newDueDate);
    });

    it("should update activity duration", async () => {
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
          subject: "Call Subject",
          description: "Call description",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity
      const updateResult = await updateActivity(context, activity.id, {
        duration: 45,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.duration).toBe(45);
    });

    it("should update multiple fields at once", async () => {
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
          subject: "Original Subject",
          description: "Original description",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update multiple fields
      const updateResult = await updateActivity(context, activity.id, {
        subject: "Updated Subject",
        description: "Updated description",
        priority: "urgent",
        status: "in_progress",
        duration: 30,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.subject).toBe("Updated Subject");
      expect(updatedActivity.description).toBe("Updated description");
      expect(updatedActivity.priority).toBe("urgent");
      expect(updatedActivity.status).toBe("in_progress");
      expect(updatedActivity.duration).toBe(30);
    });
  });

  describe("edge cases", () => {
    it("should handle updating activity with empty description", async () => {
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
          type: "note",
          subject: "Note Subject",
          description: "Original description",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity to remove description
      const updateResult = await updateActivity(context, activity.id, {
        description: undefined,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.description).toBeUndefined();
    });

    it("should handle updating activity with maximum duration", async () => {
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
          type: "meeting",
          subject: "Long Meeting",
          description: "Very long meeting",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Update activity with large duration
      const updateResult = await updateActivity(context, activity.id, {
        duration: 480, // 8 hours
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.duration).toBe(480);
    });

    it("should handle updating activity with completed status and completion date", async () => {
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
          type: "task",
          subject: "Task Subject",
          description: "Task description",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const completedDate = new Date("2024-12-20T14:30:00Z");
      // Update activity to completed
      const updateResult = await updateActivity(context, activity.id, {
        status: "completed",
        completedAt: completedDate,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.status).toBe("completed");
      expect(updatedActivity.completedAt).toEqual(completedDate);
    });

    it("should handle updating activity with past scheduled date", async () => {
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
          subject: "Call Subject",
          description: "Call description",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const pastDate = new Date("2023-01-01T10:00:00Z");
      // Update activity with past scheduled date
      const updateResult = await updateActivity(context, activity.id, {
        scheduledAt: pastDate,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.scheduledAt).toEqual(pastDate);
    });

    it("should handle updating activity with future due date", async () => {
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
          type: "task",
          subject: "Task Subject",
          description: "Task description",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const futureDate = new Date("2025-12-31T23:59:59Z");
      // Update activity with future due date
      const updateResult = await updateActivity(context, activity.id, {
        dueDate: futureDate,
      });

      expect(updateResult.isOk()).toBe(true);
      const updatedActivity = updateResult._unsafeUnwrap();
      expect(updatedActivity.id).toBe(activity.id);
      expect(updatedActivity.dueDate).toEqual(futureDate);
    });
  });
});
