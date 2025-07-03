import bcrypt from "bcryptjs";
import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { User, UserWithoutPassword } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { type LoginInput, login } from "./login";

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

// biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
const mockBcryptCompare = bcrypt.compare as any;

// Mock repositories
const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findActiveUsers: vi.fn(),
  findByRole: vi.fn(),
  getProfile: vi.fn(),
  search: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  updateLastLogin: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
};

// Mock context with minimal required repositories
const mockContext: Context = {
  userRepository: mockUserRepository,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  customerRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactHistoryRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  leadRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  dealRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  activityRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  notificationRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  organizationRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  permissionRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  proposalRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  reportRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  scoringRuleRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  scoringService: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  documentRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  storageManager: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  campaignRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  emailMarketingRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  approvalRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  securityRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  displaySettingsRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  dashboardRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  integrationRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  integrationService: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  importExportRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  importExportService: {} as any,
};

describe("login", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.clearAllMocks();
  });

  describe("user not found", () => {
    it("should reject login when user does not exist", async () => {
      const input: LoginInput = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));

      const result = await login(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "nonexistent@example.com",
      );
    });

    it("should handle repository error when finding user by email", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };

      mockUserRepository.findByEmail.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await login(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to find user",
      );
    });
  });

  describe("user account status", () => {
    it("should reject login when user account is deactivated", async () => {
      const input: LoginInput = {
        email: "deactivated@example.com",
        password: "password123",
      };

      const deactivatedUser: User = {
        id: uuidv7(),
        name: "Deactivated User",
        email: "deactivated@example.com",
        role: "user",
        isActive: false, // Deactivated
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(deactivatedUser));

      const result = await login(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "User account is deactivated",
      );
    });
  });

  describe("password validation", () => {
    it("should reject login with invalid password", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "wrongpassword",
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockResolvedValue(false);

      const result = await login(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedpassword",
      );
    });

    it("should handle bcrypt error during password comparison", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockRejectedValue(new Error("Bcrypt error"));

      // The error should bubble up since bcrypt.compare throws
      await expect(login(mockContext, input)).rejects.toThrow("Bcrypt error");
    });
  });

  describe("successful login", () => {
    it("should login successfully with valid credentials", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue(ok(undefined));

      const result = await login(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedpassword",
      );
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith({
        userId: user.id,
        lastLoginAt: expect.any(Date),
      });
    });

    it("should login successfully even if updateLastLogin fails", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Mock console.error to verify it's called
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await login(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to update last login:",
        expect.any(RepositoryError),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("edge cases", () => {
    it("should handle user with admin role", async () => {
      const input: LoginInput = {
        email: "admin@example.com",
        password: "password123",
      };

      const adminUser: User = {
        id: uuidv7(),
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt,
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(adminUser));
      mockBcryptCompare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue(ok(undefined));

      const result = await login(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
    });

    it("should handle user with manager role", async () => {
      const input: LoginInput = {
        email: "manager@example.com",
        password: "password123",
      };

      const managerUser: User = {
        id: uuidv7(),
        name: "Manager User",
        email: "manager@example.com",
        role: "manager",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: managerUser.id,
        name: managerUser.name,
        email: managerUser.email,
        role: managerUser.role,
        isActive: managerUser.isActive,
        createdAt: managerUser.createdAt,
        updatedAt: managerUser.updatedAt,
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(managerUser));
      mockBcryptCompare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue(ok(undefined));

      const result = await login(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
    });

    it("should handle email case sensitivity correctly", async () => {
      const input: LoginInput = {
        email: "User@Example.COM",
        password: "password123",
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue(ok(undefined));

      const result = await login(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "User@Example.COM",
      );
    });

    it("should exclude password hash from returned user object", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        lastLoginAt: new Date("2023-01-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue(ok(undefined));

      const result = await login(mockContext, input);

      expect(result.isOk()).toBe(true);
      const returnedUser = result._unsafeUnwrap();
      expect(returnedUser).not.toHaveProperty("passwordHash");
      expect(returnedUser.lastLoginAt).toBeDefined();
    });

    it("should handle empty password", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "",
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockResolvedValue(false);

      const result = await login(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
      expect(bcrypt.compare).toHaveBeenCalledWith("", "hashedpassword");
    });

    it("should handle very long password", async () => {
      const input: LoginInput = {
        email: "user@example.com",
        password: "a".repeat(1000),
      };

      const user: User = {
        id: uuidv7(),
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(user));
      mockBcryptCompare.mockResolvedValue(false);

      const result = await login(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid email or password",
      );
    });
  });
});
