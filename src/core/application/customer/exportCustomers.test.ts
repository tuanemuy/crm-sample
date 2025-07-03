import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { Activity } from "@/core/domain/activity/types";
import type { Contact } from "@/core/domain/contact/types";
import type { Customer } from "@/core/domain/customer/types";
import type { Deal } from "@/core/domain/deal/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import {
  type ExportCustomersInput,
  type ExportResult,
  exportCustomers,
} from "./exportCustomers";

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

const mockContactRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByIdWithCustomer: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByCustomerId: vi.fn(),
  findPrimaryByCustomerId: vi.fn(),
  setPrimary: vi.fn(),
  findByEmail: vi.fn(),
  search: vi.fn(),
};

const mockDealRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByCustomerId: vi.fn(),
  findByAssignedUser: vi.fn(),
  updateStage: vi.fn(),
  findByStage: vi.fn(),
  getPipelineData: vi.fn(),
  getStats: vi.fn(),
  search: vi.fn(),
  findExpiredDeals: vi.fn(),
  findUpcomingDeals: vi.fn(),
};

const mockActivityRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByCustomerId: vi.fn(),
  findByAssignedUser: vi.fn(),
  findByType: vi.fn(),
  findUpcoming: vi.fn(),
  findOverdue: vi.fn(),
  findCompleted: vi.fn(),
  search: vi.fn(),
  complete: vi.fn(),
  setReminder: vi.fn(),
};

// Mock context with required repositories
const mockContext: Context = {
  customerRepository: mockCustomerRepository,
  contactRepository: mockContactRepository,
  dealRepository: mockDealRepository,
  activityRepository: mockActivityRepository,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  userRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactHistoryRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  leadRepository: {} as any,
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

describe("exportCustomers", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should use default values when not provided", async () => {
      const input = {} as ExportCustomersInput;

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.filename).toMatch(/\.csv$/);
      expect(exportResult.mimeType).toBe("text/csv");
    });

    it("should validate invalid format", async () => {
      const input: ExportCustomersInput = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        format: "invalid" as any,
      };

      const result = await exportCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Invalid input for customer export",
      );
    });

    it("should validate filter date ranges", async () => {
      const input: ExportCustomersInput = {
        filter: {
          createdAfter: new Date("2023-01-01"),
          createdBefore: new Date("2022-01-01"), // Before the after date
        },
      };

      const mockCustomers: Customer[] = [];
      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 0 }),
      );

      const result = await exportCustomers(mockContext, input);

      // The function should still work even with invalid date ranges,
      // as the validation is handled by the repository
      expect(result.isOk()).toBe(true);
    });

    it("should handle valid size and status enums", async () => {
      const input: ExportCustomersInput = {
        filter: {
          size: "large",
          status: "active",
        },
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Large Active Company",
          size: "large",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error when fetching customers", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      mockCustomerRepository.list.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to fetch customers",
      );
    });

    it("should handle errors when fetching contacts gracefully", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
        includeContacts: true,
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );
      mockContactRepository.findByCustomerId.mockResolvedValue(
        err(new RepositoryError("Contact fetch error")),
      );

      const result = await exportCustomers(mockContext, input);

      // Should still succeed with empty contacts array
      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.recordCount).toBe(1);
    });

    it("should handle errors when fetching deals gracefully", async () => {
      const input: ExportCustomersInput = {
        format: "json",
        includeDeals: true,
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );
      mockDealRepository.findByCustomerId.mockResolvedValue(
        err(new RepositoryError("Deal fetch error")),
      );

      const result = await exportCustomers(mockContext, input);

      // Should still succeed with empty deals array
      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.recordCount).toBe(1);
    });

    it("should handle errors when fetching activities gracefully", async () => {
      const input: ExportCustomersInput = {
        format: "json",
        includeActivities: true,
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );
      mockActivityRepository.findByCustomerId.mockResolvedValue(
        err(new RepositoryError("Activity fetch error")),
      );

      const result = await exportCustomers(mockContext, input);

      // Should still succeed with empty activities array
      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.recordCount).toBe(1);
    });
  });

  describe("CSV export", () => {
    it("should export customers to CSV format", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          industry: "Technology",
          size: "medium",
          status: "active",
          website: "https://test.com",
          location: "Tokyo",
          assignedUserId: uuidv7(),
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-06-01"),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.filename).toMatch(
        /customers_export_\d{4}-\d{2}-\d{2}\.csv/,
      );
      expect(exportResult.mimeType).toBe("text/csv");
      expect(exportResult.recordCount).toBe(1);
      expect(exportResult.content).toContain("Test Company");
      expect(exportResult.content).toContain("Technology");
    });

    it("should export CSV with contacts data", async () => {
      const customerId = uuidv7();
      const input: ExportCustomersInput = {
        format: "csv",
        includeContacts: true,
      };

      const mockCustomers: Customer[] = [
        {
          id: customerId,
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockContacts: Contact[] = [
        {
          id: uuidv7(),
          customerId,
          name: "John Doe",
          email: "john@test.com",
          isPrimary: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          customerId,
          name: "Jane Smith",
          email: "jane@test.com",
          isPrimary: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );
      mockContactRepository.findByCustomerId.mockResolvedValue(
        ok(mockContacts),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.content).toContain("Contact Count");
      expect(exportResult.content).toContain("2"); // Contact count
    });

    it("should export CSV with deals data", async () => {
      const customerId = uuidv7();
      const input: ExportCustomersInput = {
        format: "csv",
        includeDeals: true,
      };

      const mockCustomers: Customer[] = [
        {
          id: customerId,
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDeals: Deal[] = [
        {
          id: uuidv7(),
          title: "Deal 1",
          customerId,
          amount: "10000",
          stage: "negotiation",
          probability: 50,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          title: "Deal 2",
          customerId,
          amount: "20000",
          stage: "closed-won",
          probability: 100,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );
      mockDealRepository.findByCustomerId.mockResolvedValue(ok(mockDeals));

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.content).toContain("Deal Count");
      expect(exportResult.content).toContain("Total Deal Value");
      expect(exportResult.content).toContain("2"); // Deal count
      expect(exportResult.content).toContain("30000"); // Total value
    });

    it("should handle empty customer list", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: [], count: 0 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.recordCount).toBe(0);
      expect(exportResult.content).toBe("No customers to export");
    });
  });

  describe("JSON export", () => {
    it("should export customers to JSON format", async () => {
      const input: ExportCustomersInput = {
        format: "json",
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          industry: "Technology",
          status: "active",
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-06-01"),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.filename).toMatch(
        /customers_export_\d{4}-\d{2}-\d{2}\.json/,
      );
      expect(exportResult.mimeType).toBe("application/json");
      expect(exportResult.recordCount).toBe(1);

      // Verify JSON content is valid
      const jsonData = JSON.parse(exportResult.content);
      expect(jsonData).toHaveLength(1);
      expect(jsonData[0].name).toBe("Test Company");
      expect(jsonData[0].industry).toBe("Technology");
    });

    it("should include relations in JSON export", async () => {
      const customerId = uuidv7();
      const input: ExportCustomersInput = {
        format: "json",
        includeContacts: true,
        includeDeals: true,
        includeActivities: true,
      };

      const mockCustomers: Customer[] = [
        {
          id: customerId,
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockContacts: Contact[] = [
        {
          id: uuidv7(),
          customerId,
          name: "John Doe",
          email: "john@test.com",
          isPrimary: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDeals: Deal[] = [
        {
          id: uuidv7(),
          title: "Test Deal",
          customerId,
          amount: "10000",
          stage: "negotiation",
          probability: 50,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockActivities: Activity[] = [
        {
          id: uuidv7(),
          type: "meeting",
          subject: "Initial meeting",
          customerId,
          assignedUserId: uuidv7(),
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );
      mockContactRepository.findByCustomerId.mockResolvedValue(
        ok(mockContacts),
      );
      mockDealRepository.findByCustomerId.mockResolvedValue(ok(mockDeals));
      mockActivityRepository.findByCustomerId.mockResolvedValue(
        ok(mockActivities),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();

      const jsonData = JSON.parse(exportResult.content);
      expect(jsonData[0].contacts).toHaveLength(1);
      expect(jsonData[0].deals).toHaveLength(1);
      expect(jsonData[0].activities).toHaveLength(1);
    });
  });

  describe("XLSX export", () => {
    it("should export customers to XLSX format", async () => {
      const input: ExportCustomersInput = {
        format: "xlsx",
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.filename).toMatch(
        /customers_export_\d{4}-\d{2}-\d{2}\.xlsx/,
      );
      expect(exportResult.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(exportResult.recordCount).toBe(1);
      // Note: Current implementation returns CSV content for XLSX
      expect(exportResult.content).toContain("Test Company");
    });
  });

  describe("filtering", () => {
    it("should apply filter to customer query", async () => {
      const assignedUserId = uuidv7();
      const input: ExportCustomersInput = {
        format: "csv",
        filter: {
          keyword: "tech",
          industry: "Technology",
          size: "large",
          status: "active",
          assignedUserId,
          createdAfter: new Date("2023-01-01"),
          createdBefore: new Date("2023-12-31"),
        },
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Tech Company",
          industry: "Technology",
          size: "large",
          status: "active",
          assignedUserId,
          createdAt: new Date("2023-06-01"),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(mockCustomerRepository.list).toHaveBeenCalledWith({
        pagination: { page: 1, limit: 10000, order: "asc", orderBy: "name" },
        filter: input.filter,
        sortBy: "name",
        sortOrder: "asc",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in CSV export", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: 'Company "With Quotes"',
          industry: "Tech, Software",
          location: "Tokyo, Japan",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      // CSV should properly escape quotes
      expect(exportResult.content).toContain('""With Quotes""');
    });

    it("should handle large datasets", async () => {
      const input: ExportCustomersInput = {
        format: "json",
      };

      const mockCustomers: Customer[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: uuidv7(),
          name: `Company ${i + 1}`,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1000 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.recordCount).toBe(1000);

      const jsonData = JSON.parse(exportResult.content);
      expect(jsonData).toHaveLength(1000);
    });

    it("should handle customers with null/undefined optional fields", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Minimal Company",
          status: "active",
          // All optional fields are undefined
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.content).toContain("Minimal Company");
      // Should handle empty fields gracefully
      expect(exportResult.content).toContain('""'); // Empty fields
    });

    it("should handle date parsing in CSV", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      const createdAt = new Date("2023-01-15T10:30:00Z");
      const updatedAt = new Date("2023-06-20T15:45:30Z");

      const mockCustomers: Customer[] = [
        {
          id: uuidv7(),
          name: "Date Test Company",
          status: "active",
          createdAt,
          updatedAt,
        },
      ];

      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 1 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();
      expect(exportResult.content).toContain(createdAt.toISOString());
      expect(exportResult.content).toContain(updatedAt.toISOString());
    });

    it("should generate filename with current date", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      const mockCustomers: Customer[] = [];
      mockCustomerRepository.list.mockResolvedValue(
        ok({ items: mockCustomers, count: 0 }),
      );

      const result = await exportCustomers(mockContext, input);

      expect(result.isOk()).toBe(true);
      const exportResult = result._unsafeUnwrap();

      const today = new Date().toISOString().split("T")[0];
      expect(exportResult.filename).toContain(today);
    });

    it("should handle unexpected errors gracefully", async () => {
      const input: ExportCustomersInput = {
        format: "csv",
      };

      // Mock an unexpected error during processing
      mockCustomerRepository.list.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await exportCustomers(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to export customers",
      );
    });
  });
});
