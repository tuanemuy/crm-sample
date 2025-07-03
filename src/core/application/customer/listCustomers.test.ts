import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type {
  Customer,
  ListCustomersQuery,
} from "@/core/domain/customer/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { listCustomers } from "./listCustomers";

// Mock repositories
const mockCustomerRepository = {
  create: vi.fn(),
  findByName: vi.fn(),
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  findByAssignedUser: vi.fn(),
  findChildren: vi.fn(),
  search: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getStats: vi.fn(),
};

// Mock context with minimal required repositories
const mockContext: Context = {
  customerRepository: mockCustomerRepository,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  userRepository: {} as any,
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

describe("listCustomers", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid pagination parameters", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 0, // Invalid page number
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid pagination limit", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 0, // Invalid limit
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should accept large pagination limit values", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 1001, // Large but valid positive integer
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const expectedResult = { items: [], count: 0 };
      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should reject invalid sort field", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
        sortBy: "invalid_field" as any,
        sortOrder: "desc",
      };

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid sort order", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
        sortOrder: "invalid_order" as any,
      };

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid filter size", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
          size: "invalid_size" as any,
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid filter status", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
          status: "invalid_status" as any,
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid UUID in filter", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          assignedUserId: "invalid-uuid",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error when listing customers", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      mockCustomerRepository.list.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await listCustomers(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to list customers",
      );
    });
  });

  describe("successful listing", () => {
    it("should list customers with minimal query parameters", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const customers: Customer[] = [
        {
          id: uuidv7(),
          name: "Company A",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          name: "Company B",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = {
        items: customers,
        count: 2,
      };

      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
      expect(mockCustomerRepository.list).toHaveBeenCalledWith({
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      });
    });

    it("should list customers with all query parameters", async () => {
      const assignedUserId = uuidv7();
      const parentCustomerId = uuidv7();

      const query: ListCustomersQuery = {
        pagination: {
          page: 2,
          limit: 25,
          order: "asc" as const,
          orderBy: "name",
        },
        filter: {
          keyword: "technology",
          industry: "Technology",
          size: "medium",
          status: "active",
          assignedUserId,
          parentCustomerId,
        },
        sortBy: "name",
        sortOrder: "asc",
      };

      const customers: Customer[] = [
        {
          id: uuidv7(),
          name: "Tech Company",
          industry: "Technology",
          size: "medium",
          status: "active",
          assignedUserId,
          parentCustomerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = {
        items: customers,
        count: 1,
      };

      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
      expect(mockCustomerRepository.list).toHaveBeenCalledWith(query);
    });

    it("should handle empty result", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const expectedResult = {
        items: [],
        count: 0,
      };

      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });
  });

  describe("edge cases", () => {
    it("should handle boundary pagination values", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 1, // Minimum limit
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const customers: Customer[] = [
        {
          id: uuidv7(),
          name: "Single Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = {
        items: customers,
        count: 1,
      };

      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle maximum pagination values", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 1000, // Maximum limit
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const expectedResult = {
        items: [],
        count: 0,
      };

      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle undefined filter", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: undefined,
        sortOrder: "desc",
      };

      const expectedResult = {
        items: [],
        count: 0,
      };

      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle partial filter", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          keyword: "search term",
          // Other filter fields are undefined
        },
        sortOrder: "desc",
      };

      const expectedResult = {
        items: [],
        count: 0,
      };

      mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listCustomers(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle all customer sizes", async () => {
      const testCases: Array<"small" | "medium" | "large" | "enterprise"> = [
        "small",
        "medium",
        "large",
        "enterprise",
      ];

      for (const size of testCases) {
        const query: ListCustomersQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: {
            size,
          },
          sortOrder: "desc",
        };

        const expectedResult = {
          items: [],
          count: 0,
        };

        mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listCustomers(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });

    it("should handle all customer statuses", async () => {
      const testCases: Array<"active" | "inactive" | "archived"> = [
        "active",
        "inactive",
        "archived",
      ];

      for (const status of testCases) {
        const query: ListCustomersQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: {
            status,
          },
          sortOrder: "desc",
        };

        const expectedResult = {
          items: [],
          count: 0,
        };

        mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listCustomers(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });

    it("should handle all sort fields", async () => {
      const testCases: Array<"name" | "createdAt" | "updatedAt" | "industry"> =
        ["name", "createdAt", "updatedAt", "industry"];

      for (const sortBy of testCases) {
        const query: ListCustomersQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          sortBy,
          sortOrder: "desc",
        };

        const expectedResult = {
          items: [],
          count: 0,
        };

        mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listCustomers(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });

    it("should handle both sort orders", async () => {
      const testCases: Array<"asc" | "desc"> = ["asc", "desc"];

      for (const sortOrder of testCases) {
        const query: ListCustomersQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          sortOrder,
        };

        const expectedResult = {
          items: [],
          count: 0,
        };

        mockCustomerRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listCustomers(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });
  });
});
