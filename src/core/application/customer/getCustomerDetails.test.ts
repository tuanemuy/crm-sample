import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { CustomerWithRelations } from "@/core/domain/customer/types";
import { ApplicationError, NotFoundError, RepositoryError } from "@/lib/error";
import { getCustomerDetails } from "./getCustomerDetails";

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

describe("getCustomerDetails", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("customer not found", () => {
    it("should return NotFoundError when customer does not exist", async () => {
      const customerId = uuidv7();

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(ok(null));

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer not found");
      expect(mockCustomerRepository.findByIdWithRelations).toHaveBeenCalledWith(
        customerId,
      );
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error when getting customer details", async () => {
      const customerId = uuidv7();

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get customer details",
      );
    });

    it("should handle database connection error", async () => {
      const customerId = uuidv7();

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        err(new RepositoryError("Database connection failed")),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get customer details",
      );
    });

    it("should handle permission denied error", async () => {
      const customerId = uuidv7();

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        err(new RepositoryError("Access denied")),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get customer details",
      );
    });
  });

  describe("successful retrieval", () => {
    it("should return customer details with minimal data", async () => {
      const customerId = uuidv7();
      const customerWithRelations: CustomerWithRelations = {
        id: customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        contacts: [],
        deals: [],
        activities: [],
        documents: [],
      };

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        ok(customerWithRelations),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customerWithRelations);
      expect(mockCustomerRepository.findByIdWithRelations).toHaveBeenCalledWith(
        customerId,
      );
    });

    it("should return customer details with complete information", async () => {
      const customerId = uuidv7();
      const assignedUserId = uuidv7();
      const parentCustomerId = uuidv7();

      const customerWithRelations: CustomerWithRelations = {
        id: customerId,
        name: "Complete Company",
        industry: "Technology",
        size: "large",
        location: "Tokyo, Japan",
        foundedYear: 2020,
        website: "https://example.com",
        description: "A comprehensive technology company",
        status: "active",
        assignedUserId,
        parentCustomerId,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
        contacts: [
          {
            id: uuidv7(),
            customerId,
            name: "John Doe",
            title: "CEO",
            email: "john@example.com",
            phone: "+1234567890",
            isPrimary: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        deals: [
          {
            id: uuidv7(),
            title: "Big Deal",
            customerId,
            amount: "100000",
            stage: "negotiation",
            probability: 75,
            assignedUserId,
            competitors: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        activities: [
          {
            id: uuidv7(),
            type: "meeting",
            subject: "Initial meeting",
            customerId,
            assignedUserId,
            isCompleted: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        documents: [
          {
            id: uuidv7(),
            name: "contract.pdf",
            entityType: "customer",
            entityId: customerId,
            mimeType: "application/pdf",
            size: 1024,
            uploadedBy: uuidv7(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        assignedUser: {
          id: assignedUserId,
          name: "Assigned User",
          email: "assigned@example.com",
          role: "manager",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        parentCustomer: {
          id: parentCustomerId,
          name: "Parent Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        childrenCustomers: [
          {
            id: uuidv7(),
            name: "Child Company",
            status: "active",
            parentCustomerId: customerId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        ok(customerWithRelations),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customerWithRelations);
      expect(mockCustomerRepository.findByIdWithRelations).toHaveBeenCalledWith(
        customerId,
      );
    });

    it("should return customer with empty relations arrays", async () => {
      const customerId = uuidv7();
      const customerWithRelations: CustomerWithRelations = {
        id: customerId,
        name: "Company Without Relations",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        contacts: [],
        deals: [],
        activities: [],
        documents: [],
      };

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        ok(customerWithRelations),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      const customer = result._unsafeUnwrap();
      expect(customer.contacts).toEqual([]);
      expect(customer.deals).toEqual([]);
      expect(customer.activities).toEqual([]);
      expect(customer.documents).toEqual([]);
    });

    it("should handle customer with various status types", async () => {
      const statusTypes: Array<
        "active" | "inactive" | "prospect" | "archived"
      > = ["active", "inactive", "prospect", "archived"];

      for (const status of statusTypes) {
        const customerId = uuidv7();
        const customerWithRelations: CustomerWithRelations = {
          id: customerId,
          name: `${status} Company`,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
          contacts: [],
          deals: [],
          activities: [],
          documents: [],
        };

        mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
          ok(customerWithRelations),
        );

        const result = await getCustomerDetails(mockContext, customerId);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().status).toBe(status);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle customer with multiple contacts", async () => {
      const customerId = uuidv7();
      const customerWithRelations: CustomerWithRelations = {
        id: customerId,
        name: "Multi Contact Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        contacts: [
          {
            id: uuidv7(),
            customerId,
            name: "Primary Contact",
            email: "primary@example.com",
            isPrimary: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: uuidv7(),
            customerId,
            name: "Secondary Contact",
            email: "secondary@example.com",
            isPrimary: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: uuidv7(),
            customerId,
            name: "Inactive Contact",
            email: "inactive@example.com",
            isPrimary: false,
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        deals: [],
        activities: [],
        documents: [],
      };

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        ok(customerWithRelations),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      const customer = result._unsafeUnwrap();
      expect(customer.contacts).toHaveLength(3);
      expect(customer.contacts.filter((c) => c.isPrimary)).toHaveLength(1);
      expect(customer.contacts.filter((c) => c.isActive)).toHaveLength(2);
    });

    it("should handle customer with deals in different stages", async () => {
      const customerId = uuidv7();
      const customerWithRelations: CustomerWithRelations = {
        id: customerId,
        name: "Multi Deal Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        contacts: [],
        deals: [
          {
            id: uuidv7(),
            title: "Prospecting Deal",
            customerId,
            amount: "50000",
            stage: "prospecting",
            probability: 25,
            assignedUserId: uuidv7(),
            competitors: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: uuidv7(),
            title: "Closed Won Deal",
            customerId,
            amount: "100000",
            stage: "closed-won",
            probability: 100,
            assignedUserId: uuidv7(),
            competitors: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: uuidv7(),
            title: "Closed Lost Deal",
            customerId,
            amount: "75000",
            stage: "closed-lost",
            probability: 0,
            assignedUserId: uuidv7(),
            competitors: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        activities: [],
        documents: [],
      };

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        ok(customerWithRelations),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      const customer = result._unsafeUnwrap();
      expect(customer.deals).toHaveLength(3);
      expect(
        customer.deals.find((d) => d.stage === "prospecting"),
      ).toBeDefined();
      expect(
        customer.deals.find((d) => d.stage === "closed-won"),
      ).toBeDefined();
      expect(
        customer.deals.find((d) => d.stage === "closed-lost"),
      ).toBeDefined();
    });

    it("should handle customer size variations", async () => {
      const sizeTypes: Array<
        "startup" | "small" | "medium" | "large" | "enterprise"
      > = ["startup", "small", "medium", "large", "enterprise"];

      for (const size of sizeTypes) {
        const customerId = uuidv7();
        const customerWithRelations: CustomerWithRelations = {
          id: customerId,
          name: `${size} Company`,
          size,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          contacts: [],
          deals: [],
          activities: [],
          documents: [],
        };

        mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
          ok(customerWithRelations),
        );

        const result = await getCustomerDetails(mockContext, customerId);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().size).toBe(size);
      }
    });

    it("should handle customer with parent-child relationships", async () => {
      const customerId = uuidv7();
      const parentCustomerId = uuidv7();
      const customerWithRelations: CustomerWithRelations = {
        id: customerId,
        name: "Child Company",
        status: "active",
        parentCustomerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        contacts: [],
        deals: [],
        activities: [],
        documents: [],
        parentCustomer: {
          id: parentCustomerId,
          name: "Parent Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        childrenCustomers: [
          {
            id: uuidv7(),
            name: "Sibling Company",
            status: "active",
            parentCustomerId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        ok(customerWithRelations),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      const customer = result._unsafeUnwrap();
      expect(customer.parentCustomer).toBeDefined();
      expect(customer.parentCustomer?.name).toBe("Parent Company");
      expect(customer.childrenCustomers).toHaveLength(1);
    });

    it("should handle very large data sets", async () => {
      const customerId = uuidv7();
      const largeContacts = Array.from({ length: 100 }, (_, i) => ({
        id: uuidv7(),
        customerId,
        name: `Contact ${i}`,
        email: `contact${i}@example.com`,
        isPrimary: i === 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const customerWithRelations: CustomerWithRelations = {
        id: customerId,
        name: "Large Data Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        contacts: largeContacts,
        deals: [],
        activities: [],
        documents: [],
      };

      mockCustomerRepository.findByIdWithRelations.mockResolvedValue(
        ok(customerWithRelations),
      );

      const result = await getCustomerDetails(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      const customer = result._unsafeUnwrap();
      expect(customer.contacts).toHaveLength(100);
      expect(customer.contacts.filter((c) => c.isPrimary)).toHaveLength(1);
    });
  });
});
