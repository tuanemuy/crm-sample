import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { DeactivateUserInput, User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { deactivateUser } from "./deactivateUser";

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

describe("deactivateUser", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("repository error handling", () => {
    it("should handle repository error when deactivating user", async () => {
      const input: DeactivateUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.deactivate.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await deactivateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to deactivate user",
      );
    });

    it("should handle user not found error", async () => {
      const input: DeactivateUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.deactivate.mockResolvedValue(
        err(new RepositoryError("User not found")),
      );

      const result = await deactivateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to deactivate user",
      );
    });

    it("should handle database connection error", async () => {
      const input: DeactivateUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.deactivate.mockResolvedValue(
        err(new RepositoryError("Database connection failed")),
      );

      const result = await deactivateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to deactivate user",
      );
    });

    it("should handle permission denied error", async () => {
      const input: DeactivateUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.deactivate.mockResolvedValue(
        err(new RepositoryError("Cannot deactivate: user is last admin")),
      );

      const result = await deactivateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to deactivate user",
      );
    });
  });

  describe("successful deactivation", () => {
    it("should deactivate user successfully", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const deactivatedUser: User = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: false, // Now inactive
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

      const result = await deactivateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(deactivatedUser);
      expect(result._unsafeUnwrap().isActive).toBe(false);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(1);
    });

    it("should deactivate users with different roles", async () => {
      const testUsers = [
        { id: uuidv7(), role: "user" as const },
        { id: uuidv7(), role: "manager" as const },
        { id: uuidv7(), role: "admin" as const },
      ];

      for (const user of testUsers) {
        const input: DeactivateUserInput = {
          id: user.id,
        };

        const deactivatedUser: User = {
          id: user.id,
          name: `Test ${user.role}`,
          email: `${user.role}@example.com`,
          role: user.role,
          isActive: false,
          passwordHash: "hashedpassword",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

        const result = await deactivateUser(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().isActive).toBe(false);
        expect(result._unsafeUnwrap().role).toBe(user.role);
        expect(mockUserRepository.deactivate).toHaveBeenCalledWith(user.id);
      }

      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(
        testUsers.length,
      );
    });

    it("should deactivate user and preserve all other fields", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const lastLoginAt = new Date("2023-01-01");
      const createdAt = new Date("2022-01-01");
      const updatedAt = new Date();

      const deactivatedUser: User = {
        id: userId,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "manager",
        isActive: false,
        passwordHash: "hashedpassword",
        lastLoginAt,
        createdAt,
        updatedAt,
      };

      mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

      const result = await deactivateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      const deactivatedResult = result._unsafeUnwrap();
      expect(deactivatedResult.id).toBe(userId);
      expect(deactivatedResult.name).toBe("John Doe");
      expect(deactivatedResult.email).toBe("john.doe@example.com");
      expect(deactivatedResult.role).toBe("manager");
      expect(deactivatedResult.isActive).toBe(false);
      expect(deactivatedResult.lastLoginAt).toEqual(lastLoginAt);
      expect(deactivatedResult.createdAt).toEqual(createdAt);
      expect(deactivatedResult.updatedAt).toEqual(updatedAt);
    });
  });

  describe("business logic considerations", () => {
    it("should handle deactivation of user with active sessions", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const deactivatedUser: User = {
        id: userId,
        name: "Active Session User",
        email: "activesession@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
        lastLoginAt: new Date(), // Recently logged in
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

      const result = await deactivateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().isActive).toBe(false);
      expect(result._unsafeUnwrap().lastLoginAt).toBeDefined();
    });

    it("should handle deactivation of user with assigned entities", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const deactivatedUser: User = {
        id: userId,
        name: "Assigned User",
        email: "assigned@example.com",
        role: "manager",
        isActive: false,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

      const result = await deactivateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().isActive).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle deactivation of already inactive user", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const alreadyInactiveUser: User = {
        id: userId,
        name: "Inactive User",
        email: "inactive@example.com",
        role: "user",
        isActive: false, // Already inactive
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.deactivate.mockResolvedValue(ok(alreadyInactiveUser));

      const result = await deactivateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(alreadyInactiveUser);
      expect(result._unsafeUnwrap().isActive).toBe(false);
    });

    it("should handle multiple deactivation attempts", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const deactivatedUser: User = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Multiple deactivation calls
      mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

      const firstResult = await deactivateUser(mockContext, input);
      expect(firstResult.isOk()).toBe(true);
      expect(firstResult._unsafeUnwrap().isActive).toBe(false);

      const secondResult = await deactivateUser(mockContext, input);
      expect(secondResult.isOk()).toBe(true);
      expect(secondResult._unsafeUnwrap().isActive).toBe(false);

      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(2);
    });

    it("should handle deactivation with various error scenarios", async () => {
      const input: DeactivateUserInput = {
        id: uuidv7(),
      };

      const errorScenarios = [
        "Validation failed",
        "Constraint violation",
        "Transaction timeout",
        "Cannot deactivate last admin",
        "User has pending transactions",
      ];

      for (const errorMessage of errorScenarios) {
        mockUserRepository.deactivate.mockResolvedValue(
          err(new RepositoryError(errorMessage)),
        );

        const result = await deactivateUser(mockContext, input);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain(
          "Failed to deactivate user",
        );
      }
    });

    it("should handle deactivation with missing optional fields", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const deactivatedUser: User = {
        id: userId,
        name: "Minimal User",
        email: "minimal@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
        // lastLoginAt is undefined
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

      const result = await deactivateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(deactivatedUser);
      expect(result._unsafeUnwrap().lastLoginAt).toBeUndefined();
    });

    it("should maintain data integrity during deactivation", async () => {
      const userId = uuidv7();
      const input: DeactivateUserInput = {
        id: userId,
      };

      const deactivatedUser: User = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: false,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.deactivate.mockResolvedValue(ok(deactivatedUser));

      const result = await deactivateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();

      // Verify that all required fields are present and valid
      expect(user.id).toBe(userId);
      expect(user.name).toBeTruthy();
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(["admin", "manager", "user"]).toContain(user.role);
      expect(user.isActive).toBe(false);
      expect(user.passwordHash).toBeTruthy();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle last admin protection scenario", async () => {
      const adminId = uuidv7();
      const input: DeactivateUserInput = {
        id: adminId,
      };

      // Simulate scenario where this is the last active admin
      mockUserRepository.deactivate.mockResolvedValue(
        err(
          new RepositoryError("Cannot deactivate the last active admin user"),
        ),
      );

      const result = await deactivateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to deactivate user",
      );
    });
  });
});
