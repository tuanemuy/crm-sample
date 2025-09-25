import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { changePasswordInputSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { type ChangePasswordInput, changePassword } from "./changePassword";

let db: Database;
let context: Context;

describe("changePassword", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate user ID format", async () => {
      const invalidInputs = [
        {
          userId: "invalid-uuid",
          currentPassword: "currentPass123",
          newPassword: "newPassword123",
        },
        {
          userId: "",
          currentPassword: "currentPass123",
          newPassword: "newPassword123",
        },
        {
          userId: uuidv7().substring(0, 30), // Truncated UUID
          currentPassword: "currentPass123",
          newPassword: "newPassword123",
        },
      ];

      for (const input of invalidInputs) {
        const validation = changePasswordInputSchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should validate new password requirements", async () => {
      const userId = uuidv7();
      const invalidInputs = [
        {
          userId,
          currentPassword: "currentPass123",
          newPassword: "short", // Too short
        },
        {
          userId,
          currentPassword: "currentPass123",
          newPassword: "", // Empty
        },
        {
          userId,
          currentPassword: "currentPass123",
          newPassword: "A".repeat(256), // Too long
        },
      ];

      for (const input of invalidInputs) {
        const validation = changePasswordInputSchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should accept valid input", async () => {
      const validInputs = [
        {
          userId: uuidv7(),
          currentPassword: "currentPass123",
          newPassword: "newPassword123",
        },
        {
          userId: uuidv7(),
          currentPassword: "old_password",
          newPassword: "new_password_123",
        },
        {
          userId: uuidv7(),
          currentPassword: "current123",
          newPassword: "A".repeat(255), // Maximum length
        },
      ];

      for (const input of validInputs) {
        const validation = changePasswordInputSchema.safeParse(input);
        expect(validation.success).toBe(true);
      }
    });
  });

  describe("user not found", () => {
    it("should return error when user does not exist", async () => {
      const nonExistentId = uuidv7();

      const input: ChangePasswordInput = {
        userId: nonExistentId,
        currentPassword: "currentPass123",
        newPassword: "newPassword123",
      };

      const result = await changePassword(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("User not found");
    });
  });

  describe("password verification", () => {
    it("should reject incorrect current password", async () => {
      const currentPassword = "correctPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword: "wrongPassword123", // Incorrect password
        newPassword: "newPassword123",
      };

      const result = await changePassword(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Current password is incorrect",
      );
    });

    it("should verify correct current password", async () => {
      const currentPassword = "correctPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword: "correctPassword123", // Correct password
        newPassword: "newPassword123",
      };

      const result = await changePassword(context, input);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("successful password change", () => {
    it("should change password successfully", async () => {
      const currentPassword = "oldPassword123";
      const newPassword = "newPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();

      // Verify user data is returned without password
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.name).toBe("Test User");
      expect(updatedUser.email).toBe("test@example.com");
      expect(updatedUser).not.toHaveProperty("passwordHash");

      // Verify password was actually changed in database
      const fetchedUserResult = await context.userRepository.findById(user.id);
      expect(fetchedUserResult.isOk()).toBe(true);
      const fetchedUser = fetchedUserResult._unsafeUnwrap();

      // Old password should no longer work
      const oldPasswordValid = await bcrypt.compare(
        currentPassword,
        fetchedUser?.passwordHash,
      );
      expect(oldPasswordValid).toBe(false);

      // New password should work
      const newPasswordValid = await bcrypt.compare(
        newPassword,
        fetchedUser?.passwordHash,
      );
      expect(newPasswordValid).toBe(true);
    });

    it("should change password for admin user", async () => {
      const currentPassword = "adminPassword123";
      const newPassword = "newAdminPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create an admin user
      const userResult = await context.userRepository.create({
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.role).toBe("admin");
      expect(updatedUser.name).toBe("Admin User");
    });

    it("should change password for manager user", async () => {
      const currentPassword = "managerPassword123";
      const newPassword = "newManagerPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a manager user
      const userResult = await context.userRepository.create({
        name: "Manager User",
        email: "manager@example.com",
        role: "manager",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.role).toBe("manager");
      expect(updatedUser.name).toBe("Manager User");
    });

    it("should change password for inactive user", async () => {
      const currentPassword = "inactivePassword123";
      const newPassword = "newInactivePassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create an inactive user
      const userResult = await context.userRepository.create({
        name: "Inactive User",
        email: "inactive@example.com",
        role: "user",
        isActive: false, // Inactive user
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);

      expect(result.isOk()).toBe(true);
      const updatedUser = result._unsafeUnwrap();
      expect(updatedUser.isActive).toBe(false);
      expect(updatedUser.name).toBe("Inactive User");
    });
  });

  describe("password security", () => {
    it("should hash new password with bcrypt", async () => {
      const currentPassword = "oldPassword123";
      const newPassword = "newPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);
      expect(result.isOk()).toBe(true);

      // Verify password is properly hashed
      const fetchedUserResult = await context.userRepository.findById(user.id);
      expect(fetchedUserResult.isOk()).toBe(true);
      const fetchedUser = fetchedUserResult._unsafeUnwrap();

      // New password hash should be different from plain text
      expect(fetchedUser?.passwordHash).not.toBe(newPassword);

      // Should be able to verify with bcrypt
      const isHashValid = await bcrypt.compare(
        newPassword,
        fetchedUser?.passwordHash,
      );
      expect(isHashValid).toBe(true);
    });

    it("should handle password with special characters", async () => {
      const currentPassword = "current@Password123!";
      const newPassword = "new#Password$456%";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);

      expect(result.isOk()).toBe(true);

      // Verify new password works
      const fetchedUserResult = await context.userRepository.findById(user.id);
      expect(fetchedUserResult.isOk()).toBe(true);
      const fetchedUser = fetchedUserResult._unsafeUnwrap();

      const newPasswordValid = await bcrypt.compare(
        newPassword,
        fetchedUser?.passwordHash,
      );
      expect(newPasswordValid).toBe(true);
    });

    it("should handle minimum length password", async () => {
      const currentPassword = "oldPassword123";
      const newPassword = "newPass1"; // Minimum 8 characters
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);
      expect(result.isOk()).toBe(true);
    });

    it("should handle maximum length password", async () => {
      const currentPassword = "oldPassword123";
      const newPassword = "A".repeat(255); // Maximum 255 characters
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);
      expect(result.isOk()).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle same current and new password", async () => {
      const password = "samePassword123";
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword: password,
        newPassword: password, // Same as current
      };

      const result = await changePassword(context, input);

      expect(result.isOk()).toBe(true);

      // Verify password still works
      const fetchedUserResult = await context.userRepository.findById(user.id);
      expect(fetchedUserResult.isOk()).toBe(true);
      const fetchedUser = fetchedUserResult._unsafeUnwrap();

      const passwordValid = await bcrypt.compare(
        password,
        fetchedUser?.passwordHash,
      );
      expect(passwordValid).toBe(true);
    });

    it("should handle unicode characters in password", async () => {
      const currentPassword = "currentパスワード123";
      const newPassword = "new密码456こんにちは";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);
      expect(result.isOk()).toBe(true);

      // Verify new password works
      const fetchedUserResult = await context.userRepository.findById(user.id);
      expect(fetchedUserResult.isOk()).toBe(true);
      const fetchedUser = fetchedUserResult._unsafeUnwrap();

      const newPasswordValid = await bcrypt.compare(
        newPassword,
        fetchedUser?.passwordHash,
      );
      expect(newPasswordValid).toBe(true);
    });

    it("should handle whitespace in passwords", async () => {
      const currentPassword = " current password with spaces ";
      const newPassword = " new password with spaces ";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword,
      };

      const result = await changePassword(context, input);
      expect(result.isOk()).toBe(true);
    });
  });

  describe("repository error handling", () => {
    it("should handle user find repository failure", async () => {
      const userId = uuidv7();

      // Mock the repository findById to return an error
      const originalFindById = context.userRepository.findById;
      context.userRepository.findById = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Database connection error"),
        } as any);
      };

      const input: ChangePasswordInput = {
        userId,
        currentPassword: "currentPassword123",
        newPassword: "newPassword123",
      };

      const result = await changePassword(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Failed to find user");

      // Restore original method
      context.userRepository.findById = originalFindById;
    });

    it("should handle user update repository failure", async () => {
      const currentPassword = "oldPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Mock the repository update to return an error
      const originalUpdate = context.userRepository.update;
      context.userRepository.update = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Database update error"),
        } as any);
      };

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword: "newPassword123",
      };

      const result = await changePassword(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Failed to update password",
      );

      // Restore original method
      context.userRepository.update = originalUpdate;
    });
  });

  describe("concurrent operations", () => {
    it("should handle multiple password changes for same user", async () => {
      const currentPassword = "oldPassword123";
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // First password change
      const firstInput: ChangePasswordInput = {
        userId: user.id,
        currentPassword,
        newPassword: "newPassword123",
      };

      const firstResult = await changePassword(context, firstInput);
      expect(firstResult.isOk()).toBe(true);

      // Second password change (using the new password as current)
      const secondInput: ChangePasswordInput = {
        userId: user.id,
        currentPassword: "newPassword123",
        newPassword: "newerPassword123",
      };

      const secondResult = await changePassword(context, secondInput);
      expect(secondResult.isOk()).toBe(true);

      // Verify final password
      const fetchedUserResult = await context.userRepository.findById(user.id);
      expect(fetchedUserResult.isOk()).toBe(true);
      const fetchedUser = fetchedUserResult._unsafeUnwrap();

      const finalPasswordValid = await bcrypt.compare(
        "newerPassword123",
        fetchedUser?.passwordHash,
      );
      expect(finalPasswordValid).toBe(true);
    });
  });
});
