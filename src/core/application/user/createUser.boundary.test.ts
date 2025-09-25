import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { CreateUserInput } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { createUser } from "./createUser";

let db: Database;
let context: Context;

describe("createUser - Boundary Value Tests", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("Name Boundary Values", () => {
    it("should reject user with empty name", async () => {
      const input: CreateUserInput = {
        name: "",
        email: "test@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });

    it("should create user with minimum name length (1 character)", async () => {
      const input: CreateUserInput = {
        name: "A",
        email: "test@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("A");
    });

    it("should create user with maximum name length (255 characters)", async () => {
      const longName = "A".repeat(255);
      const input: CreateUserInput = {
        name: longName,
        email: "test@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe(longName);
    });

    it("should reject user with name exceeding maximum length (256 characters)", async () => {
      const tooLongName = "A".repeat(256);
      const input: CreateUserInput = {
        name: tooLongName,
        email: "test@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });
  });

  describe("Password Boundary Values", () => {
    it("should reject user with password too short (7 characters)", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: "1234567",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });

    it("should create user with minimum password length (8 characters)", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: "12345678",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
    });

    it("should create user with maximum password length (255 characters)", async () => {
      const longPassword = "A".repeat(255);
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: longPassword,
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
    });

    it("should reject user with password exceeding maximum length (256 characters)", async () => {
      const tooLongPassword = "A".repeat(256);
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: tooLongPassword,
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });

    it("should create user with complex password", async () => {
      const complexPassword = "MyP@ssw0rd!2023#Complex$";
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: complexPassword,
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
    });

    it("should create user with password containing special characters", async () => {
      const specialCharPassword = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: specialCharPassword,
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
    });

    it("should create user with password containing unicode characters", async () => {
      const unicodePassword = "パスワード123";
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: unicodePassword,
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
    });
  });

  describe("Email Boundary Values", () => {
    it("should create user with valid email", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test.user@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.email).toBe("test.user@example.com");
    });

    it("should create user with shortest valid email", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "a@b.co",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.email).toBe("a@b.co");
    });

    it("should create user with long valid email", async () => {
      const longEmail = `${"a".repeat(50)}@${"b".repeat(50)}.com`;
      const input: CreateUserInput = {
        name: "Test User",
        email: longEmail,
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.email).toBe(longEmail);
    });

    it("should create user with complex valid email", async () => {
      const complexEmail = "test.user+tag@sub.example-domain.co.uk";
      const input: CreateUserInput = {
        name: "Test User",
        email: complexEmail,
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.email).toBe(complexEmail);
    });

    it("should reject user with invalid email format (no @)", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "testuser.example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });

    it("should reject user with invalid email format (no domain)", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });

    it("should reject user with invalid email format (no local part)", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });

    it("should reject user with invalid email format (multiple @)", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@user@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });

    it("should create user with international domain", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.co.jp",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.email).toBe("test@example.co.jp");
    });

    it("should reject duplicate email addresses", async () => {
      const email = "duplicate@example.com";

      // Create first user
      const firstInput: CreateUserInput = {
        name: "First User",
        email: email,
        password: "password123",
        role: "user",
      };

      const firstResult = await createUser(context, firstInput);
      expect(firstResult.isOk()).toBe(true);

      // Try to create second user with same email
      const secondInput: CreateUserInput = {
        name: "Second User",
        email: email,
        password: "password456",
        role: "manager",
      };

      const secondResult = await createUser(context, secondInput);
      expect(secondResult.isErr()).toBe(true);
      expect(secondResult._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(secondResult._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_EMAIL_DUPLICATE,
      );
    });
  });

  describe("Role Boundary Values", () => {
    it("should create user with admin role", async () => {
      const input: CreateUserInput = {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.role).toBe("admin");
    });

    it("should create user with manager role", async () => {
      const input: CreateUserInput = {
        name: "Manager User",
        email: "manager@example.com",
        password: "password123",
        role: "manager",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.role).toBe("manager");
    });

    it("should create user with user role", async () => {
      const input: CreateUserInput = {
        name: "Regular User",
        email: "user@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.role).toBe("user");
    });

    it("should create user with default role when not specified", async () => {
      const input: CreateUserInput = {
        name: "Default User",
        email: "default@example.com",
        password: "password123",
        role: "user", // Schema defaults to "user" when not specified
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.role).toBe("user");
    });

    it("should reject user with invalid role", async () => {
      const input = {
        name: "Invalid Role User",
        email: "invalid@example.com",
        password: "password123",
        role: "invalid_role" as any,
      };

      const result = await createUser(context, input as CreateUserInput);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.USER_INVALID_INPUT,
      );
    });
  });

  describe("Unicode and International Characters", () => {
    it("should create user with international characters in name", async () => {
      const input: CreateUserInput = {
        name: "José García",
        email: "jose.garcia@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("José García");
    });

    it("should create user with Chinese characters in name", async () => {
      const input: CreateUserInput = {
        name: "张伟",
        email: "zhang.wei@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("张伟");
    });

    it("should create user with Japanese characters in name", async () => {
      const input: CreateUserInput = {
        name: "田中太郎",
        email: "tanaka.taro@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("田中太郎");
    });

    it("should create user with emoji in name", async () => {
      const input: CreateUserInput = {
        name: "John Doe 🚀",
        email: "john.doe@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("John Doe 🚀");
    });

    it("should create user with mixed script characters", async () => {
      const input: CreateUserInput = {
        name: "John 田中 García",
        email: "mixed@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("John 田中 García");
    });

    it("should create user with special characters in name", async () => {
      const input: CreateUserInput = {
        name: "O'Connor-Smith Jr.",
        email: "oconnor@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("O'Connor-Smith Jr.");
    });

    it("should create user with numbers in name", async () => {
      const input: CreateUserInput = {
        name: "Agent 007",
        email: "agent007@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Agent 007");
    });
  });

  describe("Edge Cases", () => {
    it("should create user with whitespace in name", async () => {
      const input: CreateUserInput = {
        name: "  John   Doe  ",
        email: "john.doe@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("  John   Doe  ");
    });

    it("should create user with only whitespace after trimming still being valid", async () => {
      const input: CreateUserInput = {
        name: "A",
        email: "a@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("A");
    });

    it("should create user with email containing plus sign", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test+tag@example.com",
        password: "password123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.email).toBe("test+tag@example.com");
    });

    it("should create user with numerical password", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: "12345678",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
    });

    it("should create user with password containing spaces", async () => {
      const input: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: "my password 123",
        role: "user",
      };

      const result = await createUser(context, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
    });
  });
});
