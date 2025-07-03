import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { Activity } from "@/core/domain/activity/types";
import type { Contact } from "@/core/domain/contact/types";
import type { Customer } from "@/core/domain/customer/types";
import type { Deal } from "@/core/domain/deal/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { deleteCustomer } from "./deleteCustomer";

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
  dealRepository: mockDealRepository,
  contactRepository: mockContactRepository,
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

describe("deleteCustomer", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("customer not found", () => {
    it("should reject deletion when customer does not exist", async () => {
      const customerId = uuidv7();

      mockCustomerRepository.findById.mockResolvedValue(ok(null));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer not found");
    });

    it("should handle repository error when finding customer", async () => {
      const customerId = uuidv7();

      mockCustomerRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to find customer",
      );
    });
  });

  describe("business logic validation", () => {
    it("should reject deletion when customer has active deals", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Active Deals",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const activeDeals: Deal[] = [
        {
          id: uuidv7(),
          title: "Active Deal 1",
          customerId,
          amount: "10000",
          stage: "prospecting", // Active stage
          probability: 25,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          title: "Active Deal 2",
          customerId,
          amount: "20000",
          stage: "negotiation", // Active stage
          probability: 50,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok(activeDeals));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Cannot delete customer with active deals",
      );
    });

    it("should allow deletion when customer has only closed deals", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Closed Deals",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const closedDeals: Deal[] = [
        {
          id: uuidv7(),
          title: "Won Deal",
          customerId,
          amount: "10000",
          stage: "closed_won",
          probability: 100,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          title: "Lost Deal",
          customerId,
          amount: "20000",
          stage: "closed_lost",
          probability: 0,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok(closedDeals));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockActivityRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockCustomerRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it("should handle repository error when checking deals", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Test Customer",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to check related deals",
      );
    });
  });

  describe("cascade deletion", () => {
    it("should delete related contacts successfully", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Contacts",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const contacts: Contact[] = [
        {
          id: uuidv7(),
          customerId,
          name: "Contact 1",
          email: "contact1@example.com",
          isPrimary: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv7(),
          customerId,
          name: "Contact 2",
          email: "contact2@example.com",
          isPrimary: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok(contacts));
      mockContactRepository.delete.mockResolvedValue(ok(undefined));
      mockActivityRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockCustomerRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockContactRepository.delete).toHaveBeenCalledTimes(2);
      expect(mockContactRepository.delete).toHaveBeenCalledWith(contacts[0].id);
      expect(mockContactRepository.delete).toHaveBeenCalledWith(contacts[1].id);
    });

    it("should handle error during contact deletion", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Contacts",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const contacts: Contact[] = [
        {
          id: uuidv7(),
          customerId,
          name: "Contact 1",
          email: "contact1@example.com",
          isPrimary: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok(contacts));
      mockContactRepository.delete.mockResolvedValue(
        err(new RepositoryError("Failed to delete contact")),
      );

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete related contact",
      );
    });

    it("should delete related activities successfully", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Activities",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const activities: Activity[] = [
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
        {
          id: uuidv7(),
          type: "call",
          subject: "Follow-up call",
          customerId,
          assignedUserId: uuidv7(),
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockActivityRepository.findByCustomerId.mockResolvedValue(ok(activities));
      mockActivityRepository.delete.mockResolvedValue(ok(undefined));
      mockCustomerRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockActivityRepository.delete).toHaveBeenCalledTimes(2);
      expect(mockActivityRepository.delete).toHaveBeenCalledWith(
        activities[0].id,
      );
      expect(mockActivityRepository.delete).toHaveBeenCalledWith(
        activities[1].id,
      );
    });

    it("should handle error during activity deletion", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Activities",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const activities: Activity[] = [
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

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockActivityRepository.findByCustomerId.mockResolvedValue(ok(activities));
      mockActivityRepository.delete.mockResolvedValue(
        err(new RepositoryError("Failed to delete activity")),
      );

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete related activity",
      );
    });
  });

  describe("final customer deletion", () => {
    it("should handle error during final customer deletion", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Test Customer",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockActivityRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockCustomerRepository.delete.mockResolvedValue(
        err(new RepositoryError("Failed to delete customer")),
      );

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to delete customer",
      );
    });
  });

  describe("successful deletion", () => {
    it("should delete customer with no related data", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Simple Customer",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockActivityRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockCustomerRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockCustomerRepository.delete).toHaveBeenCalledWith(customerId);
    });

    it("should delete customer with all related data successfully", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Complete Customer",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const closedDeals: Deal[] = [
        {
          id: uuidv7(),
          title: "Closed Deal",
          customerId,
          amount: "10000",
          stage: "closed_won",
          probability: 100,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const contacts: Contact[] = [
        {
          id: uuidv7(),
          customerId,
          name: "Contact 1",
          email: "contact@example.com",
          isPrimary: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const activities: Activity[] = [
        {
          id: uuidv7(),
          type: "meeting",
          subject: "Meeting",
          customerId,
          assignedUserId: uuidv7(),
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok(closedDeals));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok(contacts));
      mockContactRepository.delete.mockResolvedValue(ok(undefined));
      mockActivityRepository.findByCustomerId.mockResolvedValue(ok(activities));
      mockActivityRepository.delete.mockResolvedValue(ok(undefined));
      mockCustomerRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockContactRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockActivityRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockCustomerRepository.delete).toHaveBeenCalledWith(customerId);
    });
  });

  describe("edge cases", () => {
    it("should handle mixed deal stages correctly", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Mixed Deals",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mixedDeals: Deal[] = [
        {
          id: uuidv7(),
          title: "Active Deal",
          customerId,
          amount: "10000",
          stage: "qualification", // Active
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
          amount: "20000",
          stage: "closed_won", // Closed
          probability: 100,
          assignedUserId: uuidv7(),
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok(mixedDeals));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Cannot delete customer with active deals",
      );
    });

    it("should handle repository errors when checking related data", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Test Customer",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to check related contacts",
      );
    });

    it("should handle repository errors when checking activities", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Test Customer",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockActivityRepository.findByCustomerId.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to check related activities",
      );
    });

    it("should handle large numbers of related records", async () => {
      const customerId = uuidv7();
      const customer: Customer = {
        id: customerId,
        name: "Customer with Many Relations",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create large arrays of related data
      const manyContacts = Array.from({ length: 50 }, (_, i) => ({
        id: uuidv7(),
        customerId,
        name: `Contact ${i}`,
        email: `contact${i}@example.com`,
        isPrimary: i === 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const manyActivities = Array.from({ length: 100 }, (_, i) => ({
        id: uuidv7(),
        type: "call" as const,
        subject: `Activity ${i}`,
        customerId,
        assignedUserId: uuidv7(),
        isCompleted: i % 2 === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockDealRepository.findByCustomerId.mockResolvedValue(ok([]));
      mockContactRepository.findByCustomerId.mockResolvedValue(
        ok(manyContacts),
      );
      mockContactRepository.delete.mockResolvedValue(ok(undefined));
      mockActivityRepository.findByCustomerId.mockResolvedValue(
        ok(manyActivities),
      );
      mockActivityRepository.delete.mockResolvedValue(ok(undefined));
      mockCustomerRepository.delete.mockResolvedValue(ok(undefined));

      const result = await deleteCustomer(mockContext, customerId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockContactRepository.delete).toHaveBeenCalledTimes(50);
      expect(mockActivityRepository.delete).toHaveBeenCalledTimes(100);
    });
  });
});
