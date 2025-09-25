import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { UpdateUserInputWithId } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { updateUser } from "./updateUser";

let db: Database;
let context: Context;

describe("updateUser", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate user update requirements", async () => {
      const invalidInputs = [
        { id: "invalid-uuid", name: "Updated Name" }, // Invalid UUID
      ];

      for (const input of invalidInputs) {
        const result = await updateUser(
          context,
          input as UpdateUserInputWithId,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });

    it("should handle empty update data", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Existing User",
        email: "existing@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("Existing User");
      expect(updatedUser.email).toBe("existing@example.com");
      expect(updatedUser.role).toBe("user");
      expect(updatedUser.isActive).toBe(true);
    });
  });

  describe("password handling", () => {
    it("should hash password when provided", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Original User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "originalhashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
        name: "Updated User",
        password: "newpassword123",
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("Updated User");
      expect(updatedUser.email).toBe("user@example.com");
      expect(updatedUser.role).toBe("user");
      expect(updatedUser.isActive).toBe(true);
      expect(updatedUser).not.toHaveProperty("passwordHash");

      // Verify the password was actually hashed by checking the database
      const userCheckResult = await context.userRepository.findById(user.id);
      expect(userCheckResult.isOk()).toBe(true);
      const userCheck = userCheckResult._unsafeUnwrap();
      expect(userCheck).toBeDefined();
      expect(userCheck?.passwordHash).toBeDefined();
      expect(userCheck?.passwordHash).not.toBe("newpassword123"); // Should be hashed
    });

    it("should not modify password when not provided", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Original User",
        email: "original@example.com",
        role: "user",
        isActive: true,
        passwordHash: "originalhashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
        name: "Updated User",
        email: "updated@example.com",
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("Updated User");
      expect(updatedUser.email).toBe("updated@example.com");
      expect(updatedUser.role).toBe("user");
      expect(updatedUser.isActive).toBe(true);

      // Verify the password was not changed
      const userCheckResult = await context.userRepository.findById(user.id);
      expect(userCheckResult.isOk()).toBe(true);
      const userCheck = userCheckResult._unsafeUnwrap();
      expect(userCheck).toBeDefined();
      expect(userCheck?.passwordHash).toBe("originalhashedpassword");
    });
  });

  describe("user not found", () => {
    it("should handle user not found when updating", async () => {
      const userId = uuidv7();
      const input: UpdateUserInputWithId = {
        id: userId,
        name: "Updated User",
      };

      const result = await updateUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to update user",
      );
    });
  });

  describe("successful updates", () => {
    it("should update user with basic information", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Original Name",
        email: "original@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
        name: "Updated Name",
        email: "updated@example.com",
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("Updated Name");
      expect(updatedUser.email).toBe("updated@example.com");
      expect(updatedUser.role).toBe("user");
      expect(updatedUser.isActive).toBe(true);
      expect(updatedUser.id).toBe(user.id);
    });

    it("should update user role", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "User Name",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
        role: "manager",
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("User Name");
      expect(updatedUser.email).toBe("user@example.com");
      expect(updatedUser.role).toBe("manager");
      expect(updatedUser.isActive).toBe(true);
      expect(updatedUser.id).toBe(user.id);
    });

    it("should update user active status", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "User Name",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
        isActive: false,
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("User Name");
      expect(updatedUser.email).toBe("user@example.com");
      expect(updatedUser.role).toBe("user");
      expect(updatedUser.isActive).toBe(false);
      expect(updatedUser.id).toBe(user.id);
    });

    it("should update all user fields at once", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Original Name",
        email: "original@example.com",
        role: "user",
        isActive: true,
        passwordHash: "originalhashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
        name: "New Name",
        email: "new@example.com",
        password: "newpassword123",
        role: "admin",
        isActive: false,
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("New Name");
      expect(updatedUser.email).toBe("new@example.com");
      expect(updatedUser.role).toBe("admin");
      expect(updatedUser.isActive).toBe(false);
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser).not.toHaveProperty("passwordHash");
    });
  });

  describe("edge cases", () => {
    it("should handle all role types", async () => {
      const testCases: Array<"admin" | "manager" | "user"> = [
        "admin",
        "manager",
        "user",
      ];

      for (const role of testCases) {
        // Create a user first
        const userResult = await context.userRepository.create({
          name: "User Name",
          email: `user-${role}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const input: UpdateUserInputWithId = {
          id: user.id,
          role,
        };

        const result = await updateUser(context, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().role).toBe(role);
      }
    });

    it("should handle boundary email addresses", async () => {
      const boundaryEmails = [
        "a@b.co", // Minimum valid email (using 2-char TLD)
        "very.long.email.address.that.is.still.valid@subdomain.example.com",
        "user+tag@example.com", // Email with plus sign
        "user.name@example-domain.com", // Email with dash in domain
      ];

      for (const email of boundaryEmails) {
        // Create a user first
        const userResult = await context.userRepository.create({
          name: "User Name",
          email: "original@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const input: UpdateUserInputWithId = {
          id: user.id,
          email,
        };

        const result = await updateUser(context, input);

        if (result.isErr()) {
          console.error(
            `Failed to update user with email ${email}:`,
            result._unsafeUnwrapErr(),
          );
        }
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().email).toBe(email);
      }
    });

    it("should handle user with lastLoginAt field", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "User Name",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Update lastLoginAt first
      const lastLoginAt = new Date();
      await context.userRepository.updateLastLogin({
        userId: user.id,
        lastLoginAt,
      });

      const input: UpdateUserInputWithId = {
        id: user.id,
        name: "Updated User",
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("Updated User");
      expect(updatedUser.lastLoginAt).toBeDefined();
    });

    it("should handle partial updates correctly", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Original Name",
        email: "original@example.com",
        role: "user",
        isActive: true,
        passwordHash: "originalhashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: UpdateUserInputWithId = {
        id: user.id,
        name: "Only Name Updated",
        // Other fields intentionally omitted
      };

      const result = await updateUser(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.name).toBe("Only Name Updated");
      expect(updatedUser.email).toBe("original@example.com"); // Unchanged
      expect(updatedUser.role).toBe("user"); // Unchanged
      expect(updatedUser.isActive).toBe(true); // Unchanged
    });
  });
});
