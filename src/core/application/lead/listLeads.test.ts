import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { Lead, ListLeadsQuery } from "@/core/domain/lead/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { listLeads } from "./listLeads";

// Mock repositories
const mockLeadRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByIdWithUser: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByEmail: vi.fn(),
  findByAssignedUser: vi.fn(),
  search: vi.fn(),
  updateScore: vi.fn(),
  updateStatus: vi.fn(),
  convert: vi.fn(),
  getStats: vi.fn(),
  createBehavior: vi.fn(),
  getBehaviorByLeadId: vi.fn(),
};

// Mock context with minimal required repositories
const mockContext: Context = {
  leadRepository: mockLeadRepository,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  customerRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactHistoryRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  dealRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  activityRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  userRepository: {} as any,
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

describe("listLeads", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid pagination parameters", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 0, // Invalid page number
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid pagination limit", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 0, // Invalid limit
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should accept large pagination limit values", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 1001, // Large but valid positive integer
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const expectedResult = { items: [], count: 0 };
      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should reject invalid sort field", async () => {
      const query: ListLeadsQuery = {
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

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid sort order", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
        sortOrder: "invalid_order" as any,
      };

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid filter status", async () => {
      const query: ListLeadsQuery = {
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

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid UUID in filter", async () => {
      const query: ListLeadsQuery = {
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

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid score range", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          minScore: -1, // Invalid score
        },
        sortOrder: "desc",
      };

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });

    it("should reject invalid score range too high", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          maxScore: 101, // Invalid score
        },
        sortOrder: "desc",
      };

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid query");
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error when listing leads", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      mockLeadRepository.list.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await listLeads(mockContext, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to list leads",
      );
    });
  });

  describe("successful listing", () => {
    it("should list leads with minimal query parameters", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const leads: Lead[] = [
        {
          id: uuidv7(),
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          status: "new",
          score: 75,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          status: "qualified",
          score: 85,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = {
        items: leads,
        count: 2,
      };

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
      expect(mockLeadRepository.list).toHaveBeenCalledWith({
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      });
    });

    it("should list leads with all query parameters", async () => {
      const assignedUserId = uuidv7();

      const query: ListLeadsQuery = {
        pagination: {
          page: 2,
          limit: 25,
          order: "asc" as const,
          orderBy: "firstName",
        },
        filter: {
          keyword: "tech",
          status: "qualified",
          source: "Website",
          industry: "Technology",
          assignedUserId,
          minScore: 50,
          maxScore: 90,
          tags: ["hot", "enterprise"],
          createdAfter: new Date("2024-01-01"),
          createdBefore: new Date("2024-12-31"),
        },
        sortBy: "firstName",
        sortOrder: "asc",
      };

      const leads: Lead[] = [
        {
          id: uuidv7(),
          firstName: "Alice",
          lastName: "Johnson",
          email: "alice@tech.com",
          company: "Tech Corp",
          industry: "Technology",
          source: "Website",
          status: "qualified",
          score: 75,
          tags: ["hot", "enterprise"],
          assignedUserId,
          createdAt: new Date("2024-06-01"),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = {
        items: leads,
        count: 1,
      };

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
      expect(mockLeadRepository.list).toHaveBeenCalledWith(query);
    });

    it("should handle empty result", async () => {
      const query: ListLeadsQuery = {
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

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });
  });

  describe("edge cases", () => {
    it("should handle boundary pagination values", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 1, // Minimum limit
          order: "desc" as const,
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const leads: Lead[] = [
        {
          id: uuidv7(),
          firstName: "Single",
          lastName: "Lead",
          status: "new",
          score: 0,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = {
        items: leads,
        count: 1,
      };

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle maximum pagination values", async () => {
      const query: ListLeadsQuery = {
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

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle undefined filter", async () => {
      const query: ListLeadsQuery = {
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

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle partial filter", async () => {
      const query: ListLeadsQuery = {
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

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle all lead statuses", async () => {
      const testCases: Array<
        "new" | "contacted" | "qualified" | "converted" | "rejected"
      > = ["new", "contacted", "qualified", "converted", "rejected"];

      for (const status of testCases) {
        const query: ListLeadsQuery = {
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

        mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listLeads(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });

    it("should handle all sort fields", async () => {
      const testCases: Array<
        | "firstName"
        | "lastName"
        | "company"
        | "score"
        | "createdAt"
        | "updatedAt"
      > = [
        "firstName",
        "lastName",
        "company",
        "score",
        "createdAt",
        "updatedAt",
      ];

      for (const sortBy of testCases) {
        const query: ListLeadsQuery = {
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

        mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listLeads(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });

    it("should handle both sort orders", async () => {
      const testCases: Array<"asc" | "desc"> = ["asc", "desc"];

      for (const sortOrder of testCases) {
        const query: ListLeadsQuery = {
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

        mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listLeads(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });

    it("should handle boundary score values", async () => {
      const testCases = [
        { minScore: 0, maxScore: 100 },
        { minScore: 50, maxScore: 75 },
        { minScore: 0 },
        { maxScore: 100 },
      ];

      for (const scoreFilter of testCases) {
        const query: ListLeadsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: scoreFilter,
          sortOrder: "desc",
        };

        const expectedResult = {
          items: [],
          count: 0,
        };

        mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

        const result = await listLeads(mockContext, query);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(expectedResult);
      }
    });

    it("should handle empty tags array", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          tags: [],
        },
        sortOrder: "desc",
      };

      const expectedResult = {
        items: [],
        count: 0,
      };

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle multiple tags filter", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          tags: ["hot", "qualified", "enterprise", "urgent"],
        },
        sortOrder: "desc",
      };

      const expectedResult = {
        items: [],
        count: 0,
      };

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });

    it("should handle date range filters", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          createdAfter: new Date("2024-01-01"),
          createdBefore: new Date("2024-12-31"),
        },
        sortOrder: "desc",
      };

      const expectedResult = {
        items: [],
        count: 0,
      };

      mockLeadRepository.list.mockResolvedValue(ok(expectedResult));

      const result = await listLeads(mockContext, query);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedResult);
    });
  });
});
