import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import type { ActivateUserInput } from "./activateUser";
import { activateUser } from "./activateUser";

let db: Database;
let context: Context;

describe("activateUser", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("user not found", () => {
    it("should handle user not found when activating", async () => {
      const input: ActivateUserInput = {
        id: uuidv7(),
      };

      const result = await activateUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to activate user",
      );
    });
  });

  describe("successful activation", () => {
    it("should activate user successfully", async () => {
      // Create a deactivated user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ActivateUserInput = {
        id: user.id,
      };

      const result = await activateUser(context, input);

      expect(result.isOk()).toBe(true);
      const activatedUser = result._unsafeUnwrap();
      expect(activatedUser.id).toBe(user.id);
      expect(activatedUser.name).toBe("Test User");
      expect(activatedUser.email).toBe("test@example.com");
      expect(activatedUser.role).toBe("user");
      expect(activatedUser.isActive).toBe(true);
      expect(activatedUser).not.toHaveProperty("passwordHash");
    });

    it("should activate users with different roles", async () => {
      const testUsers = [
        { role: "user" as const },
        { role: "manager" as const },
        { role: "admin" as const },
      ];

      for (const userData of testUsers) {
        // Create a deactivated user first
        const userResult = await context.userRepository.create({
          name: `Test ${userData.role}`,
          email: `${userData.role}@example.com`,
          role: userData.role,
          isActive: false,
          passwordHash: "hashedpassword",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const input: ActivateUserInput = {
          id: user.id,
        };

        const result = await activateUser(context, input);

        expect(result.isOk()).toBe(true);
        const activatedUser = result._unsafeUnwrap();
        expect(activatedUser.isActive).toBe(true);
        expect(activatedUser.role).toBe(userData.role);
        expect(activatedUser.name).toBe(`Test ${userData.role}`);
        expect(activatedUser.email).toBe(`${userData.role}@example.com`);
      }
    });

    it("should activate user and preserve all other fields", async () => {
      // Create a deactivated user first
      const userResult = await context.userRepository.create({
        name: "John Doe",
        email: "john.doe@example.com",
        role: "manager",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ActivateUserInput = {
        id: user.id,
      };

      const result = await activateUser(context, input);

      expect(result.isOk()).toBe(true);
      const activatedResult = result._unsafeUnwrap();
      expect(activatedResult.id).toBe(user.id);
      expect(activatedResult.name).toBe("John Doe");
      expect(activatedResult.email).toBe("john.doe@example.com");
      expect(activatedResult.role).toBe("manager");
      expect(activatedResult.isActive).toBe(true);
      expect(activatedResult.createdAt).toBeDefined();
      expect(activatedResult.updatedAt).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle activation of already active user", async () => {
      // Create an active user first
      const userResult = await context.userRepository.create({
        name: "Active User",
        email: "active@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ActivateUserInput = {
        id: user.id,
      };

      const result = await activateUser(context, input);

      expect(result.isOk()).toBe(true);
      const activatedUser = result._unsafeUnwrap();
      expect(activatedUser.id).toBe(user.id);
      expect(activatedUser.name).toBe("Active User");
      expect(activatedUser.email).toBe("active@example.com");
      expect(activatedUser.isActive).toBe(true);
    });

    it("should handle multiple activation attempts", async () => {
      // Create a deactivated user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ActivateUserInput = {
        id: user.id,
      };

      const firstResult = await activateUser(context, input);
      expect(firstResult.isOk()).toBe(true);
      expect(firstResult._unsafeUnwrap().isActive).toBe(true);

      const secondResult = await activateUser(context, input);
      expect(secondResult.isOk()).toBe(true);
      expect(secondResult._unsafeUnwrap().isActive).toBe(true);
    });

    it("should handle activation with minimal user data", async () => {
      // Create a minimal user first
      const userResult = await context.userRepository.create({
        name: "Minimal User",
        email: "minimal@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ActivateUserInput = {
        id: user.id,
      };

      const result = await activateUser(context, input);

      expect(result.isOk()).toBe(true);
      const activatedUser = result._unsafeUnwrap();
      expect(activatedUser.name).toBe("Minimal User");
      expect(activatedUser.email).toBe("minimal@example.com");
      expect(activatedUser.isActive).toBe(true);
      expect(activatedUser.lastLoginAt).toBeNull();
    });

    it("should maintain data integrity during activation", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ActivateUserInput = {
        id: user.id,
      };

      const result = await activateUser(context, input);

      expect(result.isOk()).toBe(true);
      const activatedUser = result._unsafeUnwrap();

      // Verify that all required fields are present and valid
      expect(activatedUser.id).toBe(user.id);
      expect(activatedUser.name).toBeTruthy();
      expect(activatedUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(["admin", "manager", "user"]).toContain(activatedUser.role);
      expect(activatedUser.isActive).toBe(true);
      expect(activatedUser.createdAt).toBeInstanceOf(Date);
      expect(activatedUser.updatedAt).toBeInstanceOf(Date);
      expect(activatedUser).not.toHaveProperty("passwordHash");
    });
  });
});
