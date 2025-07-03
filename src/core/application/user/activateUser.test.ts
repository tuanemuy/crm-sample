import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { ActivateUserInput, User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { activateUser } from "./activateUser";

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

describe("activateUser", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("repository error handling", () => {
    it("should handle repository error when activating user", async () => {
      const input: ActivateUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.activate.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await activateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to activate user",
      );
    });

    it("should handle user not found error", async () => {
      const input: ActivateUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.activate.mockResolvedValue(
        err(new RepositoryError("User not found")),
      );

      const result = await activateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to activate user",
      );
    });

    it("should handle database connection error", async () => {
      const input: ActivateUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.activate.mockResolvedValue(
        err(new RepositoryError("Database connection failed")),
      );

      const result = await activateUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to activate user",
      );
    });
  });

  describe("successful activation", () => {
    it("should activate user successfully", async () => {
      const userId = uuidv7();
      const input: ActivateUserInput = {
        id: userId,
      };

      const activatedUser: User = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true, // Now active
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.activate.mockResolvedValue(ok(activatedUser));

      const result = await activateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(activatedUser);
      expect(result._unsafeUnwrap().isActive).toBe(true);
      expect(mockUserRepository.activate).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.activate).toHaveBeenCalledTimes(1);
    });

    it("should activate users with different roles", async () => {
      const testUsers = [
        { id: uuidv7(), role: "user" as const },
        { id: uuidv7(), role: "manager" as const },
        { id: uuidv7(), role: "admin" as const },
      ];

      for (const user of testUsers) {
        const input: ActivateUserInput = {
          id: user.id,
        };

        const activatedUser: User = {
          id: user.id,
          name: `Test ${user.role}`,
          email: `${user.role}@example.com`,
          role: user.role,
          isActive: true,
          passwordHash: "hashedpassword",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockUserRepository.activate.mockResolvedValue(ok(activatedUser));

        const result = await activateUser(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().isActive).toBe(true);
        expect(result._unsafeUnwrap().role).toBe(user.role);
        expect(mockUserRepository.activate).toHaveBeenCalledWith(user.id);
      }

      expect(mockUserRepository.activate).toHaveBeenCalledTimes(
        testUsers.length,
      );
    });

    it("should activate user and preserve all other fields", async () => {
      const userId = uuidv7();
      const input: ActivateUserInput = {
        id: userId,
      };

      const lastLoginAt = new Date("2023-01-01");
      const createdAt = new Date("2022-01-01");
      const updatedAt = new Date();

      const activatedUser: User = {
        id: userId,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "manager",
        isActive: true,
        passwordHash: "hashedpassword",
        lastLoginAt,
        createdAt,
        updatedAt,
      };

      mockUserRepository.activate.mockResolvedValue(ok(activatedUser));

      const result = await activateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      const activatedResult = result._unsafeUnwrap();
      expect(activatedResult.id).toBe(userId);
      expect(activatedResult.name).toBe("John Doe");
      expect(activatedResult.email).toBe("john.doe@example.com");
      expect(activatedResult.role).toBe("manager");
      expect(activatedResult.isActive).toBe(true);
      expect(activatedResult.lastLoginAt).toEqual(lastLoginAt);
      expect(activatedResult.createdAt).toEqual(createdAt);
      expect(activatedResult.updatedAt).toEqual(updatedAt);
    });
  });

  describe("edge cases", () => {
    it("should handle activation of already active user", async () => {
      const userId = uuidv7();
      const input: ActivateUserInput = {
        id: userId,
      };

      const alreadyActiveUser: User = {
        id: userId,
        name: "Active User",
        email: "active@example.com",
        role: "user",
        isActive: true, // Already active
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.activate.mockResolvedValue(ok(alreadyActiveUser));

      const result = await activateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(alreadyActiveUser);
      expect(result._unsafeUnwrap().isActive).toBe(true);
    });

    it("should handle multiple activation attempts", async () => {
      const userId = uuidv7();
      const input: ActivateUserInput = {
        id: userId,
      };

      const activatedUser: User = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Multiple activation calls
      mockUserRepository.activate.mockResolvedValue(ok(activatedUser));

      const firstResult = await activateUser(mockContext, input);
      expect(firstResult.isOk()).toBe(true);
      expect(firstResult._unsafeUnwrap().isActive).toBe(true);

      const secondResult = await activateUser(mockContext, input);
      expect(secondResult.isOk()).toBe(true);
      expect(secondResult._unsafeUnwrap().isActive).toBe(true);

      expect(mockUserRepository.activate).toHaveBeenCalledTimes(2);
    });

    it("should handle activation with various error scenarios", async () => {
      const input: ActivateUserInput = {
        id: uuidv7(),
      };

      const errorScenarios = [
        "Validation failed",
        "Constraint violation",
        "Transaction timeout",
        "Permission denied",
      ];

      for (const errorMessage of errorScenarios) {
        mockUserRepository.activate.mockResolvedValue(
          err(new RepositoryError(errorMessage)),
        );

        const result = await activateUser(mockContext, input);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain(
          "Failed to activate user",
        );
      }
    });

    it("should handle activation with missing optional fields", async () => {
      const userId = uuidv7();
      const input: ActivateUserInput = {
        id: userId,
      };

      const activatedUser: User = {
        id: userId,
        name: "Minimal User",
        email: "minimal@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        // lastLoginAt is undefined
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.activate.mockResolvedValue(ok(activatedUser));

      const result = await activateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(activatedUser);
      expect(result._unsafeUnwrap().lastLoginAt).toBeUndefined();
    });

    it("should maintain data integrity during activation", async () => {
      const userId = uuidv7();
      const input: ActivateUserInput = {
        id: userId,
      };

      const activatedUser: User = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.activate.mockResolvedValue(ok(activatedUser));

      const result = await activateUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();

      // Verify that all required fields are present and valid
      expect(user.id).toBe(userId);
      expect(user.name).toBeTruthy();
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(["admin", "manager", "user"]).toContain(user.role);
      expect(user.isActive).toBe(true);
      expect(user.passwordHash).toBeTruthy();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
