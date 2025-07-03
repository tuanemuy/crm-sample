import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { DeleteUserInput } from "@/core/application/user/deleteUser";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { deleteUser } from "./deleteUser";

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

describe("deleteUser", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should handle valid UUID input", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockUserRepository.delete).toHaveBeenCalledWith(input.id);
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error when deleting user", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.delete.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await deleteUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete user",
      );
    });

    it("should handle user not found error", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.delete.mockResolvedValue(
        err(new RepositoryError("User not found")),
      );

      const result = await deleteUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete user",
      );
    });

    it("should handle constraint violation error", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.delete.mockResolvedValue(
        err(new RepositoryError("Cannot delete user: foreign key constraint")),
      );

      const result = await deleteUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete user",
      );
    });

    it("should handle database connection error", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.delete.mockResolvedValue(
        err(new RepositoryError("Database connection failed")),
      );

      const result = await deleteUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete user",
      );
    });
  });

  describe("successful deletion", () => {
    it("should delete user successfully", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      mockUserRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockUserRepository.delete).toHaveBeenCalledWith(input.id);
      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
    });

    it("should delete different users with different IDs", async () => {
      const userIds = [uuidv7(), uuidv7(), uuidv7()];

      for (const userId of userIds) {
        const input: DeleteUserInput = {
          id: userId,
        };

        mockUserRepository.delete.mockResolvedValue(ok(undefined));

        const result = await deleteUser(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
        expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
      }

      expect(mockUserRepository.delete).toHaveBeenCalledTimes(userIds.length);
    });
  });

  describe("edge cases", () => {
    it("should handle multiple deletion attempts for same user", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      // First deletion succeeds
      mockUserRepository.delete.mockResolvedValueOnce(ok(undefined));

      const firstResult = await deleteUser(mockContext, input);
      expect(firstResult.isOk()).toBe(true);

      // Second deletion fails because user no longer exists
      mockUserRepository.delete.mockResolvedValueOnce(
        err(new RepositoryError("User not found")),
      );

      const secondResult = await deleteUser(mockContext, input);
      expect(secondResult.isErr()).toBe(true);
      expect(secondResult._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should handle deletion of users with different roles", async () => {
      const testUsers = [
        { id: uuidv7(), role: "admin" },
        { id: uuidv7(), role: "manager" },
        { id: uuidv7(), role: "user" },
      ];

      for (const user of testUsers) {
        const input: DeleteUserInput = {
          id: user.id,
        };

        mockUserRepository.delete.mockResolvedValue(ok(undefined));

        const result = await deleteUser(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
        expect(mockUserRepository.delete).toHaveBeenCalledWith(user.id);
      }
    });

    it("should handle deletion when user has related data", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      // Simulate cascade deletion or proper cleanup
      mockUserRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockUserRepository.delete).toHaveBeenCalledWith(input.id);
    });

    it("should handle deletion with various error types", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      const errorTypes = [
        "Network timeout",
        "Permission denied",
        "Transaction rollback",
        "Disk full",
      ];

      for (const errorMessage of errorTypes) {
        mockUserRepository.delete.mockResolvedValue(
          err(new RepositoryError(errorMessage)),
        );

        const result = await deleteUser(mockContext, input);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain(
          "Failed to delete user",
        );
      }
    });

    it("should maintain referential integrity", async () => {
      const input: DeleteUserInput = {
        id: uuidv7(),
      };

      // Simulate that deletion is blocked due to referential integrity
      mockUserRepository.delete.mockResolvedValue(
        err(new RepositoryError("Cannot delete: user has associated records")),
      );

      const result = await deleteUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete user",
      );
    });
  });
});
