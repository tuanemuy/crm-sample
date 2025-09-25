import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { DeleteUserInput } from "@/core/application/user/deleteUser";
import { ApplicationError } from "@/lib/error";
import { deleteUser } from "./deleteUser";

let db: Database;
let context: Context;

describe("deleteUser", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("user not found", () => {
    it("should handle user not found when deleting", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      const result = await deleteUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete user",
      );
    });
  });

  describe("successful deletion", () => {
    it("should delete user successfully", async () => {
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

      const input: DeleteUserInput = {
        id: user.id,
      };

      const result = await deleteUser(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();

      // Verify user is deleted by trying to find it
      const findResult = await context.userRepository.findById(user.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete different users with different roles", async () => {
      const testUsers = [
        { role: "admin" as const },
        { role: "manager" as const },
        { role: "user" as const },
      ];

      for (const userData of testUsers) {
        // Create a user first
        const userResult = await context.userRepository.create({
          name: `Test ${userData.role}`,
          email: `${userData.role}@example.com`,
          role: userData.role,
          isActive: true,
          passwordHash: "hashedpassword",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const input: DeleteUserInput = {
          id: user.id,
        };

        const result = await deleteUser(context, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();

        // Verify user is deleted
        const findResult = await context.userRepository.findById(user.id);
        expect(findResult.isOk()).toBe(true);
        expect(findResult._unsafeUnwrap()).toBeNull();
      }
    });
  });

  describe("edge cases", () => {
    it("should handle multiple deletion attempts for same user", async () => {
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

      const input: DeleteUserInput = {
        id: user.id,
      };

      // First deletion succeeds
      const firstResult = await deleteUser(context, input);
      expect(firstResult.isOk()).toBe(true);

      // Second deletion fails because user no longer exists
      const secondResult = await deleteUser(context, input);
      expect(secondResult.isErr()).toBe(true);
      expect(secondResult._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should handle deletion of active and inactive users", async () => {
      // Create an active user
      const activeUserResult = await context.userRepository.create({
        name: "Active User",
        email: "active@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(activeUserResult.isOk()).toBe(true);
      const activeUser = activeUserResult._unsafeUnwrap();

      // Create an inactive user
      const inactiveUserResult = await context.userRepository.create({
        name: "Inactive User",
        email: "inactive@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
      });
      expect(inactiveUserResult.isOk()).toBe(true);
      const inactiveUser = inactiveUserResult._unsafeUnwrap();

      // Delete active user
      const activeDeleteInput: DeleteUserInput = {
        id: activeUser.id,
      };
      const activeDeleteResult = await deleteUser(context, activeDeleteInput);
      expect(activeDeleteResult.isOk()).toBe(true);

      // Delete inactive user
      const inactiveDeleteInput: DeleteUserInput = {
        id: inactiveUser.id,
      };
      const inactiveDeleteResult = await deleteUser(
        context,
        inactiveDeleteInput,
      );
      expect(inactiveDeleteResult.isOk()).toBe(true);

      // Verify both users are deleted
      const activeCheckResult = await context.userRepository.findById(
        activeUser.id,
      );
      expect(activeCheckResult.isOk()).toBe(true);
      expect(activeCheckResult._unsafeUnwrap()).toBeNull();

      const inactiveCheckResult = await context.userRepository.findById(
        inactiveUser.id,
      );
      expect(inactiveCheckResult.isOk()).toBe(true);
      expect(inactiveCheckResult._unsafeUnwrap()).toBeNull();
    });

    it("should handle deletion maintaining data integrity", async () => {
      // Create multiple users
      const user1Result = await context.userRepository.create({
        name: "User 1",
        email: "user1@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user1Result.isOk()).toBe(true);
      const user1 = user1Result._unsafeUnwrap();

      const user2Result = await context.userRepository.create({
        name: "User 2",
        email: "user2@example.com",
        role: "manager",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(user2Result.isOk()).toBe(true);
      const user2 = user2Result._unsafeUnwrap();

      // Delete one user
      const input: DeleteUserInput = {
        id: user1.id,
      };

      const result = await deleteUser(context, input);
      expect(result.isOk()).toBe(true);

      // Verify only the intended user is deleted
      const deletedUserResult = await context.userRepository.findById(user1.id);
      expect(deletedUserResult.isOk()).toBe(true);
      expect(deletedUserResult._unsafeUnwrap()).toBeNull();

      const remainingUserResult = await context.userRepository.findById(
        user2.id,
      );
      expect(remainingUserResult.isOk()).toBe(true);
      expect(remainingUserResult._unsafeUnwrap()).toBeDefined();
      expect(remainingUserResult._unsafeUnwrap()?.name).toBe("User 2");
    });
  });
});
