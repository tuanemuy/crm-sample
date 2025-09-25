import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import type { DeactivateUserInput } from "./deactivateUser";
import { deactivateUser } from "./deactivateUser";

let db: Database;
let context: Context;

describe("deactivateUser", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("user not found", () => {
    it("should handle user not found when deactivating", async () => {
      const input: DeactivateUserInput = {
        id: uuidv7(),
      };

      const result = await deactivateUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to deactivate user",
      );
    });
  });

  describe("successful deactivation", () => {
    it("should deactivate user successfully", async () => {
      // Create an active user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: DeactivateUserInput = {
        id: user.id,
      };

      const result = await deactivateUser(context, input);

      expect(result.isOk()).toBe(true);
      const deactivatedUser = result._unsafeUnwrap();
      expect(deactivatedUser.id).toBe(user.id);
      expect(deactivatedUser.name).toBe("Test User");
      expect(deactivatedUser.email).toBe("test@example.com");
      expect(deactivatedUser.role).toBe("user");
      expect(deactivatedUser.isActive).toBe(false);
      expect(deactivatedUser).not.toHaveProperty("passwordHash");
    });

    it("should deactivate users with different roles", async () => {
      const testUsers = [
        { role: "user" as const },
        { role: "manager" as const },
        { role: "admin" as const },
      ];

      for (const userData of testUsers) {
        // Create an active user first
        const userResult = await context.userRepository.create({
          name: `Test ${userData.role}`,
          email: `${userData.role}@example.com`,
          role: userData.role,
          isActive: true,
          passwordHash: "hashedpassword",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const input: DeactivateUserInput = {
          id: user.id,
        };

        const result = await deactivateUser(context, input);

        expect(result.isOk()).toBe(true);
        const deactivatedUser = result._unsafeUnwrap();
        expect(deactivatedUser.isActive).toBe(false);
        expect(deactivatedUser.role).toBe(userData.role);
        expect(deactivatedUser.name).toBe(`Test ${userData.role}`);
        expect(deactivatedUser.email).toBe(`${userData.role}@example.com`);
      }
    });

    it("should deactivate user and preserve all other fields", async () => {
      // Create an active user first
      const userResult = await context.userRepository.create({
        name: "John Doe",
        email: "john.doe@example.com",
        role: "manager",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: DeactivateUserInput = {
        id: user.id,
      };

      const result = await deactivateUser(context, input);

      expect(result.isOk()).toBe(true);
      const deactivatedResult = result._unsafeUnwrap();
      expect(deactivatedResult.id).toBe(user.id);
      expect(deactivatedResult.name).toBe("John Doe");
      expect(deactivatedResult.email).toBe("john.doe@example.com");
      expect(deactivatedResult.role).toBe("manager");
      expect(deactivatedResult.isActive).toBe(false);
      expect(deactivatedResult.createdAt).toBeDefined();
      expect(deactivatedResult.updatedAt).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle deactivation of already inactive user", async () => {
      // Create an inactive user first
      const userResult = await context.userRepository.create({
        name: "Inactive User",
        email: "inactive@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: DeactivateUserInput = {
        id: user.id,
      };

      const result = await deactivateUser(context, input);

      expect(result.isOk()).toBe(true);
      const deactivatedUser = result._unsafeUnwrap();
      expect(deactivatedUser.id).toBe(user.id);
      expect(deactivatedUser.name).toBe("Inactive User");
      expect(deactivatedUser.email).toBe("inactive@example.com");
      expect(deactivatedUser.isActive).toBe(false);
    });

    it("should handle multiple deactivation attempts", async () => {
      // Create an active user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: DeactivateUserInput = {
        id: user.id,
      };

      const firstResult = await deactivateUser(context, input);
      expect(firstResult.isOk()).toBe(true);
      expect(firstResult._unsafeUnwrap().isActive).toBe(false);

      const secondResult = await deactivateUser(context, input);
      expect(secondResult.isOk()).toBe(true);
      expect(secondResult._unsafeUnwrap().isActive).toBe(false);
    });

    it("should handle deactivation with minimal user data", async () => {
      // Create a minimal user first
      const userResult = await context.userRepository.create({
        name: "Minimal User",
        email: "minimal@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: DeactivateUserInput = {
        id: user.id,
      };

      const result = await deactivateUser(context, input);

      expect(result.isOk()).toBe(true);
      const deactivatedUser = result._unsafeUnwrap();
      expect(deactivatedUser.name).toBe("Minimal User");
      expect(deactivatedUser.email).toBe("minimal@example.com");
      expect(deactivatedUser.isActive).toBe(false);
      expect(deactivatedUser.lastLoginAt).toBeNull();
    });

    it("should maintain data integrity during deactivation", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: DeactivateUserInput = {
        id: user.id,
      };

      const result = await deactivateUser(context, input);

      expect(result.isOk()).toBe(true);
      const deactivatedUser = result._unsafeUnwrap();

      // Verify that all required fields are present and valid
      expect(deactivatedUser.id).toBe(user.id);
      expect(deactivatedUser.name).toBeTruthy();
      expect(deactivatedUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(["admin", "manager", "user"]).toContain(deactivatedUser.role);
      expect(deactivatedUser.isActive).toBe(false);
      expect(deactivatedUser.createdAt).toBeInstanceOf(Date);
      expect(deactivatedUser.updatedAt).toBeInstanceOf(Date);
      expect(deactivatedUser).not.toHaveProperty("passwordHash");
    });
  });
});
