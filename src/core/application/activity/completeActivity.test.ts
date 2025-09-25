import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { CompleteActivityInput } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { completeActivity } from "./completeActivity";
import { createActivity } from "./createActivity";

let db: Database;
let context: Context;

describe("completeActivity", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("parameter validation", () => {
    it("should reject invalid activity ID", async () => {
      const input: CompleteActivityInput = {
        completedAt: new Date(),
        duration: 60,
        notes: "Activity completed successfully",
      };

      const result = await completeActivity(context, {
        id: "invalid-id",
        input,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid params for completing activity",
      );
    });

    it("should reject invalid duration", async () => {
      const input: CompleteActivityInput = {
        completedAt: new Date(),
        duration: 0,
        notes: "Activity completed successfully",
      };

      const result = await completeActivity(context, {
        id: "123e4567-e89b-12d3-a456-426614174000",
        input,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid params for completing activity",
      );
    });

    it("should reject notes exceeding maximum length", async () => {
      const input: CompleteActivityInput = {
        completedAt: new Date(),
        duration: 60,
        notes: "a".repeat(1001),
      };

      const result = await completeActivity(context, {
        id: "123e4567-e89b-12d3-a456-426614174000",
        input,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid params for completing activity",
      );
    });
  });

  describe("activity validation", () => {
    it("should reject completing non-existent activity", async () => {
      const input: CompleteActivityInput = {
        completedAt: new Date(),
        duration: 60,
        notes: "Activity completed successfully",
      };

      const result = await completeActivity(context, {
        id: "123e4567-e89b-12d3-a456-426614174000",
        input,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Activity not found");
    });

    it("should reject completing already completed activity", async () => {
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
          subject: "Test Call",
          description: "Test activity",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Complete the activity first
      const firstCompleteResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
          duration: 30,
          notes: "First completion",
        },
      });
      expect(firstCompleteResult.isOk()).toBe(true);

      // Try to complete it again
      const secondCompleteResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
          duration: 45,
          notes: "Second completion",
        },
      });

      expect(secondCompleteResult.isErr()).toBe(true);
      expect(secondCompleteResult._unsafeUnwrapErr()).toBeInstanceOf(
        ApplicationError,
      );
      expect(secondCompleteResult._unsafeUnwrapErr().message).toBe(
        "Activity is already completed",
      );
    });

    it("should reject completing cancelled activity", async () => {
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
          subject: "Test Meeting",
          description: "Test activity",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Cancel the activity
      const updateResult = await context.activityRepository.update(
        activity.id,
        {
          status: "cancelled",
        },
      );
      expect(updateResult.isOk()).toBe(true);

      // Try to complete the cancelled activity
      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
          duration: 60,
          notes: "Trying to complete cancelled activity",
        },
      });

      expect(completeResult.isErr()).toBe(true);
      expect(completeResult._unsafeUnwrapErr()).toBeInstanceOf(
        ApplicationError,
      );
      expect(completeResult._unsafeUnwrapErr().message).toBe(
        "Cannot complete cancelled activity",
      );
    });
  });

  describe("successful completion", () => {
    it("should complete a planned activity with all fields", async () => {
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

      const completedAt = new Date();
      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt,
          duration: 45,
          notes: "Call went well, client is interested",
        },
      });

      expect(completeResult.isOk()).toBe(true);
      const completedActivity = completeResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
      expect(completedActivity.completedAt).toEqual(completedAt);
      expect(completedActivity.duration).toBe(45);
    });

    it("should complete activity with default completedAt", async () => {
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
          subject: "Important Task",
          description: "Complete important task",
          priority: "urgent",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
        },
      });

      expect(completeResult.isOk()).toBe(true);
      const completedActivity = completeResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
      expect(completedActivity.completedAt).toBeDefined();
      expect(completedActivity.completedAt).toBeInstanceOf(Date);
    });

    it("should complete activity with only duration", async () => {
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
          description: "Send follow-up email",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
          duration: 15,
        },
      });

      expect(completeResult.isOk()).toBe(true);
      const completedActivity = completeResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
      expect(completedActivity.duration).toBe(15);
    });

    it("should complete in-progress activity", async () => {
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
          subject: "Team Meeting",
          description: "Weekly team meeting",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Set activity to in-progress
      const updateResult = await context.activityRepository.update(
        activity.id,
        {
          status: "in_progress",
        },
      );
      expect(updateResult.isOk()).toBe(true);

      // Complete the activity
      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
          duration: 60,
          notes: "Meeting completed successfully",
        },
      });

      expect(completeResult.isOk()).toBe(true);
      const completedActivity = completeResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
      expect(completedActivity.duration).toBe(60);
    });
  });

  describe("edge cases", () => {
    it("should handle activity with long notes", async () => {
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
          subject: "Detailed Note",
          description: "A detailed note",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const longNotes = "a".repeat(1000);
      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
          duration: 5,
          notes: longNotes,
        },
      });

      expect(completeResult.isOk()).toBe(true);
      const completedActivity = completeResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
    });

    it("should handle activity with minimum duration", async () => {
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
          subject: "Quick Call",
          description: "Very quick call",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: new Date(),
          duration: 1,
          notes: "Quick call completed",
        },
      });

      expect(completeResult.isOk()).toBe(true);
      const completedActivity = completeResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
      expect(completedActivity.duration).toBe(1);
    });

    it("should handle activity with future completion date", async () => {
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
          subject: "Future Task",
          description: "Task to be completed in future",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      const futureDate = new Date(Date.now() + 86400000); // 24 hours from now
      const completeResult = await completeActivity(context, {
        id: activity.id,
        input: {
          completedAt: futureDate,
          duration: 30,
          notes: "Task completed in future",
        },
      });

      expect(completeResult.isOk()).toBe(true);
      const completedActivity = completeResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
      expect(completedActivity.completedAt).toEqual(futureDate);
    });
  });
});
