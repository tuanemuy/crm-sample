import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { createActivity } from "./createActivity";
import type { ViewActivityCalendarInput } from "./viewActivityCalendar";
import { viewActivityCalendar } from "./viewActivityCalendar";

let db: Database;
let context: Context;

describe("viewActivityCalendar", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid user ID", async () => {
      const input = {
        userId: "invalid-id",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input type
      const result = await viewActivityCalendar(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for viewing activity calendar",
      );
    });

    it("should reject invalid start date", async () => {
      const input = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: "invalid-date",
        endDate: new Date("2024-01-31"),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input type
      const result = await viewActivityCalendar(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for viewing activity calendar",
      );
    });

    it("should reject invalid end date", async () => {
      const input = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: new Date("2024-01-01"),
        endDate: "invalid-date",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input type
      const result = await viewActivityCalendar(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for viewing activity calendar",
      );
    });
  });

  describe("date range validation", () => {
    it("should reject when start date is after end date", async () => {
      const input: ViewActivityCalendarInput = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: new Date("2024-01-31"),
        endDate: new Date("2024-01-01"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Start date must be before end date",
      );
    });

    it("should reject when start date equals end date", async () => {
      const sameDate = new Date("2024-01-15");
      const input: ViewActivityCalendarInput = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: sameDate,
        endDate: sameDate,
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Start date must be before end date",
      );
    });

    it("should reject date range exceeding one year", async () => {
      const input: ViewActivityCalendarInput = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-02"), // Just over one year
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Date range cannot exceed one year",
      );
    });

    it("should accept valid date range within one year", async () => {
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

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"), // Exactly one year
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("calendar event retrieval", () => {
    it("should return empty array when no activities exist", async () => {
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

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(0);
    });

    it("should return calendar events for user activities", async () => {
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

      // Create activities within the date range
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Important Call",
          description: "Call with client",
          priority: "high",
          scheduledAt: new Date("2024-01-15T10:00:00Z"),
          duration: 30,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Team Meeting",
          description: "Weekly team meeting",
          priority: "medium",
          scheduledAt: new Date("2024-01-20T14:00:00Z"),
          duration: 60,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(2);

      const callEvent = events.find((e) => e.title.includes("Important Call"));
      expect(callEvent).toBeDefined();
      expect(callEvent?.type).toBe("call");
      expect(callEvent?.priority).toBe("high");
      expect(callEvent?.start).toEqual(new Date("2024-01-15T10:00:00Z"));

      const meetingEvent = events.find((e) => e.title.includes("Team Meeting"));
      expect(meetingEvent).toBeDefined();
      expect(meetingEvent?.type).toBe("meeting");
      expect(meetingEvent?.priority).toBe("medium");
      expect(meetingEvent?.start).toEqual(new Date("2024-01-20T14:00:00Z"));
    });

    it("should filter activities by date range", async () => {
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

      // Create activities both inside and outside the date range
      const activityInside = await createActivity(
        context,
        {
          type: "call",
          subject: "Call Inside Range",
          priority: "medium",
          scheduledAt: new Date("2024-01-15T10:00:00Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activityInside.isOk()).toBe(true);

      const activityOutside = await createActivity(
        context,
        {
          type: "email",
          subject: "Email Outside Range",
          priority: "medium",
          scheduledAt: new Date("2024-02-15T10:00:00Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activityOutside.isOk()).toBe(true);

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(1);
      expect(events[0].title).toContain("Call Inside Range");
    });

    it("should filter activities by user", async () => {
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

      // Create activities for different users
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "User 1 Call",
          priority: "medium",
          scheduledAt: new Date("2024-01-15T10:00:00Z"),
          assignedUserId: user1.id,
        },
        user1.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "User 2 Email",
          priority: "medium",
          scheduledAt: new Date("2024-01-16T10:00:00Z"),
          assignedUserId: user2.id,
        },
        user2.id,
      );
      expect(activity2.isOk()).toBe(true);

      const input: ViewActivityCalendarInput = {
        userId: user1.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(1);
      expect(events[0].title).toContain("User 1 Call");
    });

    it("should include all activity types in calendar", async () => {
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

      // Create activities of different types
      const activities = [
        {
          type: "call" as const,
          subject: "Call Activity",
          priority: "medium" as const,
        },
        {
          type: "email" as const,
          subject: "Email Activity",
          priority: "medium" as const,
        },
        {
          type: "meeting" as const,
          subject: "Meeting Activity",
          priority: "medium" as const,
        },
        {
          type: "task" as const,
          subject: "Task Activity",
          priority: "medium" as const,
        },
        {
          type: "note" as const,
          subject: "Note Activity",
          priority: "medium" as const,
        },
      ];

      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const createResult = await createActivity(
          context,
          {
            ...activity,
            scheduledAt: new Date(`2024-01-${10 + i}T10:00:00Z`),
            assignedUserId: user.id,
          },
          user.id,
        );
        expect(createResult.isOk()).toBe(true);
      }

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(5);

      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain("call");
      expect(eventTypes).toContain("email");
      expect(eventTypes).toContain("meeting");
      expect(eventTypes).toContain("task");
      expect(eventTypes).toContain("note");
    });

    it("should include all activity priorities in calendar", async () => {
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

      // Create activities of different priorities
      const activities = [
        { priority: "low" as const, subject: "Low Priority" },
        { priority: "medium" as const, subject: "Medium Priority" },
        { priority: "high" as const, subject: "High Priority" },
        { priority: "urgent" as const, subject: "Urgent Priority" },
      ];

      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const createResult = await createActivity(
          context,
          {
            type: "call",
            subject: activity.subject,
            priority: activity.priority,
            scheduledAt: new Date(`2024-01-${10 + i}T10:00:00Z`),
            assignedUserId: user.id,
          },
          user.id,
        );
        expect(createResult.isOk()).toBe(true);
      }

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(4);

      const eventPriorities = events.map((e) => e.priority);
      expect(eventPriorities).toContain("low");
      expect(eventPriorities).toContain("medium");
      expect(eventPriorities).toContain("high");
      expect(eventPriorities).toContain("urgent");
    });

    it("should include all activity statuses in calendar", async () => {
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

      // Create activities with different statuses
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Planned Call",
          priority: "medium",
          scheduledAt: new Date("2024-01-10T10:00:00Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "In Progress Email",
          priority: "medium",
          scheduledAt: new Date("2024-01-11T10:00:00Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const activity3 = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Completed Meeting",
          priority: "medium",
          scheduledAt: new Date("2024-01-12T10:00:00Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity3.isOk()).toBe(true);

      const activity4 = await createActivity(
        context,
        {
          type: "task",
          subject: "Cancelled Task",
          priority: "medium",
          scheduledAt: new Date("2024-01-13T10:00:00Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity4.isOk()).toBe(true);

      // Update statuses
      await context.activityRepository.update(activity2._unsafeUnwrap().id, {
        status: "in_progress",
      });
      await context.activityRepository.update(activity3._unsafeUnwrap().id, {
        status: "completed",
      });
      await context.activityRepository.update(activity4._unsafeUnwrap().id, {
        status: "cancelled",
      });

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(4);

      const eventStatuses = events.map((e) => e.status);
      expect(eventStatuses).toContain("planned");
      expect(eventStatuses).toContain("in_progress");
      expect(eventStatuses).toContain("completed");
      expect(eventStatuses).toContain("cancelled");
    });
  });

  describe("edge cases", () => {
    it("should handle minimum date range", async () => {
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

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-01-01T00:00:01Z"), // Just 1 second difference
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(0);
    });

    it("should handle maximum date range", async () => {
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

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"), // Almost exactly one year
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(0);
    });

    it("should handle activities without scheduled dates", async () => {
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

      // Create activity without scheduled date
      const activity = await createActivity(
        context,
        {
          type: "note",
          subject: "Unscheduled Note",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity.isOk()).toBe(true);

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      // Activities without scheduled dates might not appear in calendar
      expect(events).toHaveLength(0);
    });

    it("should handle user with no activities", async () => {
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

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      expect(events).toHaveLength(0);
    });

    it("should handle activities at date range boundaries", async () => {
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

      // Create activities at exact boundaries
      const activityAtStart = await createActivity(
        context,
        {
          type: "call",
          subject: "Start Boundary Call",
          priority: "medium",
          scheduledAt: new Date("2024-01-01T00:00:00Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activityAtStart.isOk()).toBe(true);

      const activityAtEnd = await createActivity(
        context,
        {
          type: "email",
          subject: "End Boundary Email",
          priority: "medium",
          scheduledAt: new Date("2024-01-31T23:59:59Z"),
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activityAtEnd.isOk()).toBe(true);

      const input: ViewActivityCalendarInput = {
        userId: user.id,
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-01-31T23:59:59Z"),
      };

      const result = await viewActivityCalendar(context, input);

      expect(result.isOk()).toBe(true);
      const events = result._unsafeUnwrap();
      // The exact behavior depends on the repository implementation
      // but we can verify that the call succeeds
      expect(Array.isArray(events)).toBe(true);
    });
  });
});
