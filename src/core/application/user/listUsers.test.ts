import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ListUsersInput } from "./listUsers";
import { listUsers } from "./listUsers";

let db: Database;
let context: Context;

describe("listUsers", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("successful listing", () => {
    it("should list users with minimal input", async () => {
      // Create test users first
      const user1Result = await context.userRepository.create({
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user1Result.isOk()).toBe(true);

      const user2Result = await context.userRepository.create({
        name: "Jane Smith",
        email: "jane@example.com",
        role: "manager",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user2Result.isOk()).toBe(true);

      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10, order: "asc", orderBy: "name" },
        sortOrder: "asc",
      };

      const result = await listUsers(context, input);

      expect(result.isOk()).toBe(true);
      const userList = result._unsafeUnwrap();
      expect(userList.items).toHaveLength(2);
      expect(userList.count).toBe(2);
      expect(userList.items[0]).not.toHaveProperty("passwordHash");
      expect(userList.items[1]).not.toHaveProperty("passwordHash");
    });

    it("should list users with filters", async () => {
      // Create test users first
      const user1Result = await context.userRepository.create({
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user1Result.isOk()).toBe(true);

      const user2Result = await context.userRepository.create({
        name: "Jane Smith",
        email: "jane@example.com",
        role: "manager",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user2Result.isOk()).toBe(true);

      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10, order: "asc", orderBy: "name" },
        filter: {
          keyword: "john",
          role: "user",
          isActive: true,
        },
        sortBy: "name",
        sortOrder: "asc",
      };

      const result = await listUsers(context, input);

      expect(result.isOk()).toBe(true);
      const userList = result._unsafeUnwrap();
      expect(userList.items).toHaveLength(1);
      expect(userList.count).toBe(1);
      expect(userList.items[0].name).toBe("John Doe");
      expect(userList.items[0].role).toBe("user");
    });

    it("should return empty list when no users found", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10, order: "asc", orderBy: "name" },
        filter: {
          keyword: "nonexistent",
        },
        sortOrder: "asc",
      };

      const result = await listUsers(context, input);

      expect(result.isOk()).toBe(true);
      const userList = result._unsafeUnwrap();
      expect(userList.items).toHaveLength(0);
      expect(userList.count).toBe(0);
    });

    it("should handle different pagination parameters", async () => {
      // Create multiple users for pagination test
      for (let i = 1; i <= 10; i++) {
        const userResult = await context.userRepository.create({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
        });
        expect(userResult.isOk()).toBe(true);
      }

      const input: ListUsersInput = {
        pagination: { page: 2, limit: 5, order: "asc", orderBy: "name" },
        sortOrder: "asc",
      };

      const result = await listUsers(context, input);

      expect(result.isOk()).toBe(true);
      const userList = result._unsafeUnwrap();
      expect(userList.items).toHaveLength(5);
      expect(userList.count).toBe(10);
    });

    it("should handle all role types", async () => {
      const testCases: Array<"admin" | "manager" | "user"> = [
        "admin",
        "manager",
        "user",
      ];

      // Create users with different roles
      for (const role of testCases) {
        const userResult = await context.userRepository.create({
          name: `${role} User`,
          email: `${role}@example.com`,
          role,
          isActive: true,
          passwordHash: "hashedpassword",
        });
        expect(userResult.isOk()).toBe(true);
      }

      // Test filtering by each role
      for (const role of testCases) {
        const input: ListUsersInput = {
          pagination: { page: 1, limit: 10, order: "asc", orderBy: "name" },
          filter: { role },
          sortOrder: "asc",
        };

        const result = await listUsers(context, input);

        expect(result.isOk()).toBe(true);
        const userList = result._unsafeUnwrap();
        expect(userList.items).toHaveLength(1);
        expect(userList.items[0].role).toBe(role);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle sorting by different fields", async () => {
      // Create test users
      const user1Result = await context.userRepository.create({
        name: "Alice",
        email: "alice@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user1Result.isOk()).toBe(true);

      const user2Result = await context.userRepository.create({
        name: "Bob",
        email: "bob@example.com",
        role: "admin",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user2Result.isOk()).toBe(true);

      const sortFields: Array<
        "name" | "email" | "role" | "createdAt" | "updatedAt" | "lastLoginAt"
      > = ["name", "email", "role", "createdAt", "updatedAt", "lastLoginAt"];

      for (const sortBy of sortFields) {
        const input: ListUsersInput = {
          pagination: { page: 1, limit: 10, order: "desc", orderBy: sortBy },
          sortBy,
          sortOrder: "desc",
        };

        const result = await listUsers(context, input);
        expect(result.isOk()).toBe(true);
        const userList = result._unsafeUnwrap();
        expect(userList.items).toHaveLength(2);
      }
    });

    it("should handle users with optional lastLoginAt", async () => {
      // Create user with login
      const user1Result = await context.userRepository.create({
        name: "User with login",
        email: "withlogin@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user1Result.isOk()).toBe(true);
      const user1 = user1Result._unsafeUnwrap();

      // Update last login time
      await context.userRepository.updateLastLogin({
        userId: user1.id,
        lastLoginAt: new Date(),
      });

      // Create user without login
      const user2Result = await context.userRepository.create({
        name: "User without login",
        email: "withoutlogin@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user2Result.isOk()).toBe(true);

      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10, order: "asc", orderBy: "name" },
        sortOrder: "asc",
      };

      const result = await listUsers(context, input);

      expect(result.isOk()).toBe(true);
      const userList = result._unsafeUnwrap();
      expect(userList.items).toHaveLength(2);
      expect(userList.count).toBe(2);
    });

    it("should handle inactive users when filtered", async () => {
      // Create inactive user
      const userResult = await context.userRepository.create({
        name: "Inactive User",
        email: "inactive@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);

      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10, order: "asc", orderBy: "name" },
        filter: { isActive: false },
        sortOrder: "asc",
      };

      const result = await listUsers(context, input);

      expect(result.isOk()).toBe(true);
      const userList = result._unsafeUnwrap();
      expect(userList.items).toHaveLength(1);
      expect(userList.items[0].name).toBe("Inactive User");
      expect(userList.items[0].isActive).toBe(false);
    });

    it("should handle boundary pagination values", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 1, order: "asc", orderBy: "name" },
        sortOrder: "asc",
      };

      const result = await listUsers(context, input);

      expect(result.isOk()).toBe(true);
      const userList = result._unsafeUnwrap();
      expect(userList.items).toHaveLength(0);
      expect(userList.count).toBe(0);
    });
  });
});
