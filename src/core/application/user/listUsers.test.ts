import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { ListUsersInput, User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { listUsers } from "./listUsers";

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

describe("listUsers", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("repository error handling", () => {
    it("should handle repository error when listing users", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10 },
      };

      mockUserRepository.list.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await listUsers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to list users",
      );
    });
  });

  describe("successful listing", () => {
    it("should list users with minimal input", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10 },
      };

      const users: User[] = [
        {
          id: uuidv7(),
          name: "John Doe",
          email: "john@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          name: "Jane Smith",
          email: "jane@example.com",
          role: "manager",
          isActive: true,
          passwordHash: "hashedpassword",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = { items: users, count: 2 };

      mockUserRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listUsers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
      expect(mockUserRepository.list).toHaveBeenCalledWith(input);
    });

    it("should list users with filters", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10 },
        filter: {
          keyword: "john",
          role: "user",
          isActive: true,
        },
        sortBy: "name",
        sortOrder: "asc",
      };

      const users: User[] = [
        {
          id: uuidv7(),
          name: "John Doe",
          email: "john@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = { items: users, count: 1 };

      mockUserRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listUsers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
      expect(mockUserRepository.list).toHaveBeenCalledWith(input);
    });

    it("should return empty list when no users found", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10 },
        filter: {
          keyword: "nonexistent",
        },
      };

      const expectedResult = { items: [], count: 0 };

      mockUserRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listUsers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle different pagination parameters", async () => {
      const input: ListUsersInput = {
        pagination: { page: 2, limit: 5 },
      };

      const users: User[] = [
        {
          id: uuidv7(),
          name: "User 6",
          email: "user6@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = { items: users, count: 10 };

      mockUserRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listUsers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
      expect(mockUserRepository.list).toHaveBeenCalledWith(input);
    });

    it("should handle all role types", async () => {
      const testCases: Array<"admin" | "manager" | "user"> = [
        "admin",
        "manager",
        "user",
      ];

      for (const role of testCases) {
        const input: ListUsersInput = {
          pagination: { page: 1, limit: 10 },
          filter: { role },
        };

        const users: User[] = [
          {
            id: uuidv7(),
            name: `${role} User`,
            email: `${role}@example.com`,
            role,
            isActive: true,
            passwordHash: "hashedpassword",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const expectedResult = { items: users, count: 1 };
        mockUserRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listUsers(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle sorting by different fields", async () => {
      const sortFields: Array<
        "name" | "email" | "role" | "createdAt" | "updatedAt" | "lastLoginAt"
      > = ["name", "email", "role", "createdAt", "updatedAt", "lastLoginAt"];

      for (const sortBy of sortFields) {
        const input: ListUsersInput = {
          pagination: { page: 1, limit: 10 },
          sortBy,
          sortOrder: "desc",
        };

        const expectedResult = { items: [], count: 0 };
        mockUserRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listUsers(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(mockUserRepository.list).toHaveBeenCalledWith(input);
      }
    });

    it("should handle users with optional lastLoginAt", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10 },
      };

      const users: User[] = [
        {
          id: uuidv7(),
          name: "User with login",
          email: "withlogin@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          name: "User without login",
          email: "withoutlogin@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hashedpassword",
          // lastLoginAt is undefined
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = { items: users, count: 2 };

      mockUserRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listUsers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle inactive users when filtered", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 10 },
        filter: { isActive: false },
      };

      const inactiveUsers: User[] = [
        {
          id: uuidv7(),
          name: "Inactive User",
          email: "inactive@example.com",
          role: "user",
          isActive: false,
          passwordHash: "hashedpassword",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = { items: inactiveUsers, count: 1 };

      mockUserRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listUsers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle boundary pagination values", async () => {
      const input: ListUsersInput = {
        pagination: { page: 1, limit: 1 },
      };

      const expectedResult = { items: [], count: 0 };

      mockUserRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listUsers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });
  });
});
