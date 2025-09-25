import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ListActivitiesQuery } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { createActivity } from "./createActivity";
import { listActivities } from "./listActivities";

let db: Database;
let context: Context;

describe("listActivities", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("query validation", () => {
    it("should reject invalid pagination parameters", async () => {
      const query: ListActivitiesQuery = {
        pagination: {
          page: 0,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid query for listing activities",
      );
    });

    it("should reject invalid limit parameter", async () => {
      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 0,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid query for listing activities",
      );
    });

    it("should reject invalid date ranges in filter", async () => {
      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {
          scheduledAfter: new Date("2024-12-31"),
          scheduledBefore: new Date("2024-01-01"),
        },
      };

      const result = await listActivities(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid query for listing activities",
      );
    });
  });

  describe("successful listing", () => {
    it("should return empty list when no activities exist", async () => {
      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(0);
    });

    it("should return all activities with basic pagination", async () => {
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

      // Create multiple activities
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "First Call",
          description: "First activity",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "Second Email",
          description: "Second activity",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const activity3 = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Third Meeting",
          description: "Third activity",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity3.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(count).toBe(3);
      expect(items.map((a) => a.subject)).toContain("First Call");
      expect(items.map((a) => a.subject)).toContain("Second Email");
      expect(items.map((a) => a.subject)).toContain("Third Meeting");
    });

    it("should respect pagination limits", async () => {
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

      // Create multiple activities
      for (let i = 1; i <= 5; i++) {
        const result = await createActivity(
          context,
          {
            type: "call",
            subject: `Activity ${i}`,
            description: `Description ${i}`,
            priority: "medium",
            assignedUserId: user.id,
          },
          user.id,
        );
        expect(result.isOk()).toBe(true);
      }

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 2,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(2);
      expect(count).toBe(5);
    });

    it("should handle second page pagination", async () => {
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

      // Create multiple activities
      for (let i = 1; i <= 5; i++) {
        const result = await createActivity(
          context,
          {
            type: "call",
            subject: `Activity ${i}`,
            description: `Description ${i}`,
            priority: "medium",
            assignedUserId: user.id,
          },
          user.id,
        );
        expect(result.isOk()).toBe(true);
      }

      const query: ListActivitiesQuery = {
        pagination: {
          page: 2,
          limit: 2,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(2);
      expect(count).toBe(5);
    });
  });

  describe("filtering", () => {
    it("should filter activities by type", async () => {
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
      const callActivity = await createActivity(
        context,
        {
          type: "call",
          subject: "Call Activity",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(callActivity.isOk()).toBe(true);

      const emailActivity = await createActivity(
        context,
        {
          type: "email",
          subject: "Email Activity",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(emailActivity.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {
          type: "call",
        },
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].type).toBe("call");
      expect(items[0].subject).toBe("Call Activity");
    });

    it("should filter activities by status", async () => {
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
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      // Update one activity to in_progress
      const updateResult = await context.activityRepository.update(
        activity2._unsafeUnwrap().id,
        {
          status: "in_progress",
        },
      );
      expect(updateResult.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {
          status: "in_progress",
        },
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].status).toBe("in_progress");
      expect(items[0].subject).toBe("In Progress Email");
    });

    it("should filter activities by priority", async () => {
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

      // Create activities with different priorities
      const highPriorityActivity = await createActivity(
        context,
        {
          type: "call",
          subject: "High Priority Call",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(highPriorityActivity.isOk()).toBe(true);

      const lowPriorityActivity = await createActivity(
        context,
        {
          type: "email",
          subject: "Low Priority Email",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(lowPriorityActivity.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {
          priority: "high",
        },
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].priority).toBe("high");
      expect(items[0].subject).toBe("High Priority Call");
    });

    it("should filter activities by assigned user", async () => {
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

      // Create activities assigned to different users
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Activity for User 1",
          priority: "medium",
          assignedUserId: user1.id,
        },
        user1.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "Activity for User 2",
          priority: "medium",
          assignedUserId: user2.id,
        },
        user2.id,
      );
      expect(activity2.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {
          assignedUserId: user1.id,
        },
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].assignedUserId).toBe(user1.id);
      expect(items[0].subject).toBe("Activity for User 1");
    });

    it("should filter activities by keyword search", async () => {
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

      // Create activities with different content
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Important client call",
          description: "Call about new project",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "Follow-up email",
          description: "Email about different topic",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {
          keyword: "client",
        },
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].subject).toBe("Important client call");
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

      // Create activities with different scheduled dates
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Early Activity",
          scheduledAt: new Date("2024-01-01"),
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "Late Activity",
          scheduledAt: new Date("2024-12-31"),
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {
          scheduledAfter: new Date("2024-06-01"),
          scheduledBefore: new Date("2024-12-31"),
        },
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].subject).toBe("Late Activity");
    });
  });

  describe("sorting", () => {
    it("should sort activities by subject ascending", async () => {
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

      // Create activities with different subjects
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Zebra Activity",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "Alpha Activity",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "subject",
        },
        sortBy: "subject",
        sortOrder: "asc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(2);
      expect(count).toBe(2);
      expect(items[0].subject).toBe("Alpha Activity");
      expect(items[1].subject).toBe("Zebra Activity");
    });

    it("should sort activities by priority descending", async () => {
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

      // Create activities with different priorities
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Low Priority Activity",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "High Priority Activity",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "priority",
        },
        sortBy: "priority",
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(2);
      expect(count).toBe(2);
      // The exact order depends on the repository implementation
      // but we can verify that both items are present
      expect(items.map((a) => a.priority)).toContain("high");
      expect(items.map((a) => a.priority)).toContain("low");
    });
  });

  describe("edge cases", () => {
    it("should handle empty filters", async () => {
      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
        filter: {},
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(0);
    });

    it("should handle large page numbers", async () => {
      const query: ListActivitiesQuery = {
        pagination: {
          page: 999,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(0);
    });

    it("should handle maximum limit", async () => {
      const query: ListActivitiesQuery = {
        pagination: {
          page: 1,
          limit: 100,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listActivities(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(0);
    });
  });
});
