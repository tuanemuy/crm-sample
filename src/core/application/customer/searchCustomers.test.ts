import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { Customer } from "@/core/domain/customer/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { type SearchCustomersInput, searchCustomers } from "./searchCustomers";

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

describe("searchCustomers", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject search with empty keyword", async () => {
      const input: SearchCustomersInput = {
        keyword: "",
        limit: 20,
      };

      const result = await searchCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Invalid input for customer search",
      );
    });

    it("should reject search with keyword too long", async () => {
      const input: SearchCustomersInput = {
        keyword: "a".repeat(256), // Too long
        limit: 20,
      };

      const result = await searchCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Invalid input for customer search",
      );
    });

    it("should reject search with invalid limit values", async () => {
      const invalidLimits = [0, -1, 101, 150];

      for (const limit of invalidLimits) {
        const input: SearchCustomersInput = {
          keyword: "test",
          limit,
        };

        const result = await searchCustomers(mockContext, input);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain(
          "Invalid input for customer search",
        );
      }
    });

    it("should use default limit when not provided", async () => {
      const input = {
        keyword: "test",
        // limit not provided, should default to 20
      } as SearchCustomersInput;

      const expectedCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith("test", 20);
    });

    it("should accept boundary limit values", async () => {
      const boundaryLimits = [1, 100];

      for (const limit of boundaryLimits) {
        const input: SearchCustomersInput = {
          keyword: "test",
          limit,
        };

        mockCustomerRepository.search.mockResolvedValue(ok([]));

        const result = await searchCustomers(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(mockCustomerRepository.search).toHaveBeenCalledWith(
          "test",
          limit,
        );
      }
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error during search", async () => {
      const input: SearchCustomersInput = {
        keyword: "test",
        limit: 20,
      };

      mockCustomerRepository.search.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await searchCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to search customers",
      );
    });

    it("should handle database connection error", async () => {
      const input: SearchCustomersInput = {
        keyword: "test",
        limit: 20,
      };

      mockCustomerRepository.search.mockResolvedValue(
        err(new RepositoryError("Database connection failed")),
      );

      const result = await searchCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to search customers",
      );
    });

    it("should handle search timeout error", async () => {
      const input: SearchCustomersInput = {
        keyword: "test",
        limit: 20,
      };

      mockCustomerRepository.search.mockResolvedValue(
        err(new RepositoryError("Search timeout")),
      );

      const result = await searchCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to search customers",
      );
    });
  });

  describe("successful search", () => {
    it("should return matching customers", async () => {
      const input: SearchCustomersInput = {
        keyword: "tech",
        limit: 10,
      };

      const expectedCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Tech Company A",
          industry: "Technology",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          name: "Advanced Tech Solutions",
          industry: "Technology",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith("tech", 10);
    });

    it("should return empty array when no matches found", async () => {
      const input: SearchCustomersInput = {
        keyword: "nonexistent",
        limit: 20,
      };

      mockCustomerRepository.search.mockResolvedValue(ok([]));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith(
        "nonexistent",
        20,
      );
    });

    it("should handle single character search", async () => {
      const input: SearchCustomersInput = {
        keyword: "A",
        limit: 5,
      };

      const expectedCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "ACME Corp",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith("A", 5);
    });

    it("should handle search with special characters", async () => {
      const specialKeywords = [
        "Company & Co",
        "Tech-Solutions",
        "Corp@2023",
        "Solutions_Inc",
        "Global (USA)",
      ];

      for (const keyword of specialKeywords) {
        const input: SearchCustomersInput = {
          keyword,
          limit: 20,
        };

        const expectedCustomers: Customer[] = [
          {
            id: uuidv7(),
            name: keyword,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

        const result = await searchCustomers(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
        expect(mockCustomerRepository.search).toHaveBeenCalledWith(keyword, 20);
      }
    });

    it("should handle customers with different statuses", async () => {
      const input: SearchCustomersInput = {
        keyword: "test",
        limit: 20,
      };

      const expectedCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Active",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          name: "Test Inactive",
          status: "inactive",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          name: "Test Prospect",
          status: "prospect",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          name: "Test Archived",
          status: "archived",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
      expect(result._unsafeUnwrap()).toHaveLength(4);
    });
  });

  describe("edge cases", () => {
    it("should handle search results at limit boundary", async () => {
      const input: SearchCustomersInput = {
        keyword: "company",
        limit: 3,
      };

      const expectedCustomers: Customer[] = Array.from(
        { length: 3 },
        (_, i) => ({
          id: uuidv7(),
          name: `Company ${i + 1}`,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(3);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith("company", 3);
    });

    it("should handle Unicode characters in search keyword", async () => {
      const unicodeKeywords = [
        "会社", // Japanese
        "企业", // Chinese
        "société", // French
        "công ty", // Vietnamese
        "компания", // Russian
      ];

      for (const keyword of unicodeKeywords) {
        const input: SearchCustomersInput = {
          keyword,
          limit: 20,
        };

        const expectedCustomers: Customer[] = [
          {
            id: uuidv7(),
            name: `${keyword} Ltd`,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

        const result = await searchCustomers(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
        expect(mockCustomerRepository.search).toHaveBeenCalledWith(keyword, 20);
      }
    });

    it("should handle search with maximum keyword length", async () => {
      const input: SearchCustomersInput = {
        keyword: "a".repeat(255), // Maximum allowed length
        limit: 20,
      };

      mockCustomerRepository.search.mockResolvedValue(ok([]));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith(
        "a".repeat(255),
        20,
      );
    });

    it("should handle customers with complete information", async () => {
      const input: SearchCustomersInput = {
        keyword: "complete",
        limit: 20,
      };

      const expectedCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Complete Solutions Inc",
          industry: "Technology",
          size: "large",
          location: "Tokyo, Japan",
          foundedYear: 2020,
          website: "https://complete.com",
          description: "A complete technology solutions company",
          status: "active",
          assignedUserId: uuidv7(),
          parentCustomerId: uuidv7(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
    });

    it("should handle whitespace in search keywords", async () => {
      const input: SearchCustomersInput = {
        keyword: "  tech company  ", // Leading and trailing spaces
        limit: 20,
      };

      const expectedCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Tech Company Solutions",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith(
        "  tech company  ",
        20,
      );
    });

    it("should handle case-sensitive search", async () => {
      const testCases = ["TECH", "tech", "Tech", "tEcH"];

      for (const keyword of testCases) {
        const input: SearchCustomersInput = {
          keyword,
          limit: 20,
        };

        const expectedCustomers: Customer[] = [
          {
            id: uuidv7(),
            name: `${keyword} Company`,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockCustomerRepository.search.mockResolvedValue(ok(expectedCustomers));

        const result = await searchCustomers(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedCustomers);
        expect(mockCustomerRepository.search).toHaveBeenCalledWith(keyword, 20);
      }
    });

    it("should handle large result sets efficiently", async () => {
      const input: SearchCustomersInput = {
        keyword: "company",
        limit: 100, // Maximum limit
      };

      const largeResultSet: Customer[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: uuidv7(),
          name: `Company ${i + 1}`,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      mockCustomerRepository.search.mockResolvedValue(ok(largeResultSet));

      const result = await searchCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(100);
      expect(mockCustomerRepository.search).toHaveBeenCalledWith(
        "company",
        100,
      );
    });
  });
});
