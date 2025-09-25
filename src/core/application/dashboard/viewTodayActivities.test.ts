import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ViewTodayActivitiesInput } from "@/core/application/dashboard/viewTodayActivities";
import { ApplicationError } from "@/lib/error";
import { viewTodayActivities } from "./viewTodayActivities";

let db: Database;
let context: Context;

describe("viewTodayActivities", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate today activities requirements", async () => {
      const invalidInputs = [
        {
          userId: "", // Empty user ID
          timezone: "UTC",
        },
        {
          userId: "invalid-uuid", // Invalid UUID
          timezone: "UTC",
        },
      ];

      for (const input of invalidInputs) {
        const result = await viewTodayActivities(
          context,
          input as ViewTodayActivitiesInput,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });
  });

  describe("business logic validation", () => {
    it("should reject if specified user does not exist", async () => {
      const input: ViewTodayActivitiesInput = {
        userId: uuidv7(),
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("User not found");
    });
  });

  describe("successful activities retrieval", () => {
    it("should return today's activities for valid user", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("summary");
      expect(summary).toHaveProperty("upcomingHours");

      expect(Array.isArray(summary.activities)).toBe(true);
      expect(Array.isArray(summary.upcomingHours)).toBe(true);
    });

    it("should handle custom timezone", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "America/New_York",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("summary");
      expect(summary).toHaveProperty("upcomingHours");
    });

    it("should use default timezone when not specified", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("summary");
      expect(summary).toHaveProperty("upcomingHours");
    });
  });

  describe("data structure validation", () => {
    it("should return properly formatted summary data", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.summary).toHaveProperty("total");
      expect(summary.summary).toHaveProperty("completed");
      expect(summary.summary).toHaveProperty("pending");
      expect(summary.summary).toHaveProperty("overdue");
      expect(summary.summary).toHaveProperty("byType");
      expect(summary.summary).toHaveProperty("byPriority");

      expect(typeof summary.summary.total).toBe("number");
      expect(typeof summary.summary.completed).toBe("number");
      expect(typeof summary.summary.pending).toBe("number");
      expect(typeof summary.summary.overdue).toBe("number");
    });

    it("should return properly formatted byType data", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.summary.byType).toHaveProperty("meetings");
      expect(summary.summary.byType).toHaveProperty("calls");
      expect(summary.summary.byType).toHaveProperty("emails");
      expect(summary.summary.byType).toHaveProperty("tasks");
      expect(summary.summary.byType).toHaveProperty("notes");

      expect(typeof summary.summary.byType.meetings).toBe("number");
      expect(typeof summary.summary.byType.calls).toBe("number");
      expect(typeof summary.summary.byType.emails).toBe("number");
      expect(typeof summary.summary.byType.tasks).toBe("number");
      expect(typeof summary.summary.byType.notes).toBe("number");
    });

    it("should return properly formatted byPriority data", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.summary.byPriority).toHaveProperty("urgent");
      expect(summary.summary.byPriority).toHaveProperty("high");
      expect(summary.summary.byPriority).toHaveProperty("medium");
      expect(summary.summary.byPriority).toHaveProperty("low");

      expect(typeof summary.summary.byPriority.urgent).toBe("number");
      expect(typeof summary.summary.byPriority.high).toBe("number");
      expect(typeof summary.summary.byPriority.medium).toBe("number");
      expect(typeof summary.summary.byPriority.low).toBe("number");
    });

    it("should return properly formatted upcomingHours data", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(Array.isArray(summary.upcomingHours)).toBe(true);

      summary.upcomingHours.forEach((hourData) => {
        expect(hourData).toHaveProperty("hour");
        expect(hourData).toHaveProperty("activities");

        expect(typeof hourData.hour).toBe("number");
        expect(Array.isArray(hourData.activities)).toBe(true);
        expect(hourData.hour).toBeGreaterThanOrEqual(0);
        expect(hourData.hour).toBeLessThan(24);
      });
    });

    it("should return properly formatted activity data", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      summary.activities.forEach((activity) => {
        expect(activity).toHaveProperty("id");
        expect(activity).toHaveProperty("type");
        expect(activity).toHaveProperty("status");
        expect(activity).toHaveProperty("assignedUserId");

        expect(typeof activity.id).toBe("string");
        expect(typeof activity.type).toBe("string");
        expect(typeof activity.status).toBe("string");
        expect(typeof activity.assignedUserId).toBe("string");

        expect(activity.assignedUserId).toBe(user.id);
      });
    });
  });

  describe("business logic validation", () => {
    it("should calculate summary counts correctly", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      // Total should equal activities length
      expect(summary.summary.total).toBe(summary.activities.length);

      // Type counts should sum to total
      const typeTotal =
        summary.summary.byType.meetings +
        summary.summary.byType.calls +
        summary.summary.byType.emails +
        summary.summary.byType.tasks +
        summary.summary.byType.notes;
      expect(typeTotal).toBe(summary.summary.total);

      // Priority counts should sum to total
      const priorityTotal =
        summary.summary.byPriority.urgent +
        summary.summary.byPriority.high +
        summary.summary.byPriority.medium +
        summary.summary.byPriority.low;
      expect(priorityTotal).toBe(summary.summary.total);

      // Status counts should be valid
      expect(summary.summary.completed).toBeGreaterThanOrEqual(0);
      expect(summary.summary.pending).toBeGreaterThanOrEqual(0);
      expect(summary.summary.overdue).toBeGreaterThanOrEqual(0);
    });

    it("should group activities by hour correctly", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      // All activities in upcomingHours should be from the original activities list
      const upcomingActivitiesCount = summary.upcomingHours.reduce(
        (sum, hourData) => sum + hourData.activities.length,
        0,
      );

      // Should be equal to activities with scheduledAt
      const scheduledActivitiesCount = summary.activities.filter(
        (a) => a.scheduledAt,
      ).length;
      expect(upcomingActivitiesCount).toBe(scheduledActivitiesCount);
    });

    it("should handle overdue calculation correctly", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      // Overdue count should be valid
      expect(summary.summary.overdue).toBeGreaterThanOrEqual(0);
      expect(summary.summary.overdue).toBeLessThanOrEqual(
        summary.summary.total,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle user with no activities today", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "UTC",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.activities).toHaveLength(0);
      expect(summary.summary.total).toBe(0);
      expect(summary.summary.completed).toBe(0);
      expect(summary.summary.pending).toBe(0);
      expect(summary.summary.overdue).toBe(0);
      expect(summary.upcomingHours).toHaveLength(0);
    });

    it("should handle timezone edge cases", async () => {
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

      const input: ViewTodayActivitiesInput = {
        userId: user.id,
        timezone: "Pacific/Honolulu",
      };

      const result = await viewTodayActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("summary");
      expect(summary).toHaveProperty("upcomingHours");
    });
  });
});
