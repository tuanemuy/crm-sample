import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { type LoginInput, login } from "./login";

let db: Database;
let context: Context;

describe("login", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("user not found", () => {
    it("should reject login when user does not exist", async () => {
      const input: LoginInput = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const result = await login(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
    });
  });

  describe("user account status", () => {
    it("should reject login when user account is deactivated", async () => {
      // Create a deactivated user first
      const userResult = await context.userRepository.create({
        name: "Deactivated User",
        email: "deactivated@example.com",
        role: "user",
        isActive: false,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);

      const input: LoginInput = {
        email: "deactivated@example.com",
        password: "password123",
      };

      const result = await login(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "User account is deactivated",
      );
    });
  });

  describe("password validation", () => {
    it("should reject login with invalid password", async () => {
      // Create a user with a hashed password
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: await bcrypt.hash("correctpassword", 10),
      });
      expect(userResult.isOk()).toBe(true);

      const input: LoginInput = {
        email: "user@example.com",
        password: "wrongpassword",
      };

      const result = await login(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
    });
  });

  describe("successful login", () => {
    it("should login successfully with valid credentials", async () => {
      // Create a user with a hashed password
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };

      const result = await login(context, input);

      expect(result.isOk()).toBe(true);
      const loggedInUser = result._unsafeUnwrap();
      expect(loggedInUser.id).toBe(user.id);
      expect(loggedInUser.name).toBe("Test User");
      expect(loggedInUser.email).toBe("user@example.com");
      expect(loggedInUser.role).toBe("user");
      expect(loggedInUser.isActive).toBe(true);
      expect(loggedInUser).not.toHaveProperty("passwordHash");
      expect(loggedInUser.lastLoginAt).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle user with admin role", async () => {
      // Create an admin user
      const userResult = await context.userRepository.create({
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        isActive: true,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: LoginInput = {
        email: "admin@example.com",
        password: "password123",
      };

      const result = await login(context, input);

      expect(result.isOk()).toBe(true);
      const loggedInUser = result._unsafeUnwrap();
      expect(loggedInUser.id).toBe(user.id);
      expect(loggedInUser.name).toBe("Admin User");
      expect(loggedInUser.email).toBe("admin@example.com");
      expect(loggedInUser.role).toBe("admin");
      expect(loggedInUser.isActive).toBe(true);
      expect(loggedInUser).not.toHaveProperty("passwordHash");
    });

    it("should handle user with manager role", async () => {
      // Create a manager user
      const userResult = await context.userRepository.create({
        name: "Manager User",
        email: "manager@example.com",
        role: "manager",
        isActive: true,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: LoginInput = {
        email: "manager@example.com",
        password: "password123",
      };

      const result = await login(context, input);

      expect(result.isOk()).toBe(true);
      const loggedInUser = result._unsafeUnwrap();
      expect(loggedInUser.id).toBe(user.id);
      expect(loggedInUser.name).toBe("Manager User");
      expect(loggedInUser.email).toBe("manager@example.com");
      expect(loggedInUser.role).toBe("manager");
      expect(loggedInUser.isActive).toBe(true);
      expect(loggedInUser).not.toHaveProperty("passwordHash");
    });

    it("should handle email case sensitivity correctly", async () => {
      // Create a user with lowercase email
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: LoginInput = {
        email: "User@Example.COM",
        password: "password123",
      };

      const result = await login(context, input);

      if (result.isErr()) {
        console.error("Login failed:", result._unsafeUnwrapErr());
      }
      expect(result.isOk()).toBe(true);
      const loggedInUser = result._unsafeUnwrap();
      expect(loggedInUser.id).toBe(user.id);
      expect(loggedInUser.name).toBe("Test User");
      expect(loggedInUser.email).toBe("user@example.com");
    });

    it("should exclude password hash from returned user object", async () => {
      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);
      const _user = userResult._unsafeUnwrap();

      const input: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };

      const result = await login(context, input);

      expect(result.isOk()).toBe(true);
      const returnedUser = result._unsafeUnwrap();
      expect(returnedUser).not.toHaveProperty("passwordHash");
      expect(returnedUser.lastLoginAt).toBeDefined();
    });

    it("should handle empty password", async () => {
      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);

      const input: LoginInput = {
        email: "user@example.com",
        password: "",
      };

      const result = await login(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
    });

    it("should handle very long password", async () => {
      // Create a user
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: await bcrypt.hash("password123", 10),
      });
      expect(userResult.isOk()).toBe(true);

      const input: LoginInput = {
        email: "user@example.com",
        password: "a".repeat(1000),
      };

      const result = await login(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
    });
  });
});
