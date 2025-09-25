import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ViewRecentActivitiesInput } from "@/core/application/dashboard/viewRecentActivities";
import { ApplicationError } from "@/lib/error";
import { viewRecentActivities } from "./viewRecentActivities";

let db: Database;
let context: Context;

describe("viewRecentActivities", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate dashboard query requirements", async () => {
      const invalidInputs = [
        {
          userId: "invalid-uuid", // Invalid UUID
          daysBack: 7,
          pagination: {
            page: 1,
            limit: 20,
            order: "desc",
            orderBy: "updatedAt",
          },
          includeCompleted: true,
        },
        {
          daysBack: -1, // Negative daysBack
          pagination: {
            page: 1,
            limit: 20,
            order: "desc",
            orderBy: "updatedAt",
          },
          includeCompleted: true,
        },
        {
          daysBack: 0, // Zero daysBack
          pagination: {
            page: 1,
            limit: 20,
            order: "desc",
            orderBy: "updatedAt",
          },
          includeCompleted: true,
        },
        {
          types: ["invalid-type"], // Invalid activity type
        },
      ];

      for (const input of invalidInputs) {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        const result = await viewRecentActivities(context, input as any);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      }
    });
  });

  describe("business logic validation", () => {
    it("should reject if specified user does not exist", async () => {
      const input: ViewRecentActivitiesInput = {
        userId: uuidv7(),
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("User not found");
    });
  });

  describe("successful activities retrieval", () => {
    it("should return recent activities for all users when no userId specified", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");

      expect(Array.isArray(summary.activities)).toBe(true);
    });

    it("should return recent activities for specific user", async () => {
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

      const input: ViewRecentActivitiesInput = {
        userId: user.id,
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");
    });

    it("should use default values when optional parameters not provided", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");
    });

    it("should handle different activity types filter", async () => {
      const types = ["email", "call", "meeting", "task", "note"] as const;

      for (const type of types) {
        const input: ViewRecentActivitiesInput = {
          types: [type],
          daysBack: 7,
          pagination: {
            page: 1,
            limit: 20,
            order: "desc",
            orderBy: "updatedAt",
          },
          includeCompleted: true,
        };

        const result = await viewRecentActivities(context, input);

        expect(result.isOk()).toBe(true);
        const summary = result._unsafeUnwrap();

        expect(summary).toHaveProperty("activities");
        expect(summary).toHaveProperty("pagination");
        expect(summary).toHaveProperty("stats");
      }
    });

    it("should handle multiple activity types filter", async () => {
      const input: ViewRecentActivitiesInput = {
        types: ["email", "call", "meeting"],
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");
    });

    it("should handle includeCompleted parameter", async () => {
      const input: ViewRecentActivitiesInput = {
        includeCompleted: false,
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");
    });

    it("should handle custom pagination", async () => {
      const input: ViewRecentActivitiesInput = {
        pagination: {
          page: 2,
          limit: 10,
          order: "asc",
          orderBy: "createdAt",
        },
        daysBack: 7,
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");
      expect(summary.pagination.page).toBe(2);
      expect(summary.pagination.limit).toBe(10);
    });

    it("should handle custom daysBack parameter", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 30,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");
    });
  });

  describe("data structure validation", () => {
    it("should return properly formatted activity data", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      summary.activities.forEach((activityItem) => {
        expect(activityItem).toHaveProperty("activity");
        expect(activityItem.activity).toHaveProperty("id");
        expect(activityItem.activity).toHaveProperty("type");
        expect(activityItem.activity).toHaveProperty("status");
        expect(activityItem.activity).toHaveProperty("assignedUserId");

        if (activityItem.customer) {
          expect(activityItem.customer).toHaveProperty("id");
          expect(activityItem.customer).toHaveProperty("name");
          expect(typeof activityItem.customer.id).toBe("string");
          expect(typeof activityItem.customer.name).toBe("string");
        }

        if (activityItem.contact) {
          expect(activityItem.contact).toHaveProperty("id");
          expect(activityItem.contact).toHaveProperty("name");
          expect(typeof activityItem.contact.id).toBe("string");
          expect(typeof activityItem.contact.name).toBe("string");
        }

        if (activityItem.deal) {
          expect(activityItem.deal).toHaveProperty("id");
          expect(activityItem.deal).toHaveProperty("title");
          expect(activityItem.deal).toHaveProperty("stage");
          expect(typeof activityItem.deal.id).toBe("string");
          expect(typeof activityItem.deal.title).toBe("string");
          expect(typeof activityItem.deal.stage).toBe("string");
        }

        if (activityItem.lead) {
          expect(activityItem.lead).toHaveProperty("id");
          expect(activityItem.lead).toHaveProperty("name");
          expect(activityItem.lead).toHaveProperty("status");
          expect(typeof activityItem.lead.id).toBe("string");
          expect(typeof activityItem.lead.name).toBe("string");
          expect(typeof activityItem.lead.status).toBe("string");
        }
      });
    });

    it("should return properly formatted pagination data", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.pagination).toHaveProperty("page");
      expect(summary.pagination).toHaveProperty("limit");
      expect(summary.pagination).toHaveProperty("totalPages");
      expect(summary.pagination).toHaveProperty("totalItems");

      expect(typeof summary.pagination.page).toBe("number");
      expect(typeof summary.pagination.limit).toBe("number");
      expect(typeof summary.pagination.totalPages).toBe("number");
      expect(typeof summary.pagination.totalItems).toBe("number");
    });

    it("should return properly formatted stats data", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.stats).toHaveProperty("totalActivities");
      expect(summary.stats).toHaveProperty("completedActivities");
      expect(summary.stats).toHaveProperty("byType");
      expect(summary.stats).toHaveProperty("byUser");

      expect(typeof summary.stats.totalActivities).toBe("number");
      expect(typeof summary.stats.completedActivities).toBe("number");
      expect(typeof summary.stats.byType).toBe("object");
      expect(Array.isArray(summary.stats.byUser)).toBe(true);

      summary.stats.byUser.forEach((userStat) => {
        expect(userStat).toHaveProperty("userId");
        expect(userStat).toHaveProperty("userName");
        expect(userStat).toHaveProperty("activityCount");

        expect(typeof userStat.userId).toBe("string");
        expect(typeof userStat.userName).toBe("string");
        expect(typeof userStat.activityCount).toBe("number");
      });
    });
  });

  describe("business logic validation", () => {
    it("should calculate completed activities correctly", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        includeCompleted: true,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.stats.completedActivities).toBeGreaterThanOrEqual(0);
      expect(summary.stats.completedActivities).toBeLessThanOrEqual(
        summary.stats.totalActivities,
      );
    });

    it("should calculate activity type counts correctly", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      const totalByType = Object.values(summary.stats.byType).reduce(
        (sum, count) => sum + count,
        0,
      );
      expect(totalByType).toBe(summary.stats.totalActivities);
    });

    it("should calculate user activity counts correctly", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      const totalByUser = summary.stats.byUser.reduce(
        (sum, userStat) => sum + userStat.activityCount,
        0,
      );
      expect(totalByUser).toBe(summary.stats.totalActivities);
    });
  });

  describe("edge cases", () => {
    it("should handle empty activities list gracefully", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 7,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.activities).toHaveLength(0);
      expect(summary.stats.totalActivities).toBe(0);
      expect(summary.stats.completedActivities).toBe(0);
      expect(Object.keys(summary.stats.byType)).toHaveLength(0);
      expect(summary.stats.byUser).toHaveLength(0);
    });

    it("should handle very large daysBack parameter", async () => {
      const input: ViewRecentActivitiesInput = {
        daysBack: 365,
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "updatedAt" },
        includeCompleted: true,
      };

      const result = await viewRecentActivities(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("activities");
      expect(summary).toHaveProperty("pagination");
      expect(summary).toHaveProperty("stats");
    });
  });
});
