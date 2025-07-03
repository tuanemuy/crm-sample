import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type {
  Customer,
  UpdateCustomerInput,
} from "@/core/domain/customer/types";
import type { User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { updateCustomer } from "./updateCustomer";

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
  customerRepository: mockCustomerRepository,
  userRepository: mockUserRepository,
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

describe("updateCustomer", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid input with empty name", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "",
      };

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with name too long", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "a".repeat(256),
      };

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid URL", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        website: "invalid-url",
      };

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid foundedYear", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        foundedYear: 1500, // Too old
      };

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject future foundedYear", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        foundedYear: new Date().getFullYear() + 1,
      };

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid size", async () => {
      const customerId = uuidv7();
      const input = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
        size: "invalid_size" as any,
      } as UpdateCustomerInput;

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid UUID for assignedUserId", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        assignedUserId: "invalid-uuid",
      };

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid UUID for parentCustomerId", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        parentCustomerId: "invalid-uuid",
      };

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });
  });

  describe("customer existence validation", () => {
    it("should reject update if customer does not exist", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "Updated Company",
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(null));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer not found");
    });

    it("should handle repository error when finding customer", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "Updated Company",
      };

      mockCustomerRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to find customer",
      );
    });
  });

  describe("assigned user validation", () => {
    it("should reject update if assigned user does not exist", async () => {
      const customerId = uuidv7();
      const assignedUserId = uuidv7();
      const input: UpdateCustomerInput = {
        assignedUserId,
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Existing Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockUserRepository.findById.mockResolvedValue(ok(null));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Assigned user does not exist",
      );
    });

    it("should handle repository error when verifying assigned user", async () => {
      const customerId = uuidv7();
      const assignedUserId = uuidv7();
      const input: UpdateCustomerInput = {
        assignedUserId,
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Existing Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockUserRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify assigned user",
      );
    });

    it("should skip user validation when assignedUserId is not provided", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "Updated Company",
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Existing Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer: Customer = {
        ...existingCustomer,
        name: "Updated Company",
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error during update", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "Updated Company",
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Existing Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockCustomerRepository.update.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to update customer",
      );
    });
  });

  describe("successful updates", () => {
    it("should update customer with single field", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "Updated Company Name",
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Original Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer: Customer = {
        ...existingCustomer,
        name: "Updated Company Name",
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedCustomer);
      expect(mockCustomerRepository.update).toHaveBeenCalledWith(
        customerId,
        input,
      );
    });

    it("should update customer with all fields", async () => {
      const customerId = uuidv7();
      const assignedUserId = uuidv7();
      const parentCustomerId = uuidv7();

      const input: UpdateCustomerInput = {
        name: "Updated Company",
        industry: "Updated Technology",
        size: "large",
        location: "Updated Location",
        foundedYear: 2022,
        website: "https://updated.com",
        description: "Updated description",
        assignedUserId,
        parentCustomerId,
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Original Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const assignedUser: User = {
        id: assignedUserId,
        name: "Assigned User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer: Customer = {
        ...existingCustomer,
        ...input,
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockUserRepository.findById.mockResolvedValue(ok(assignedUser));
      mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedCustomer);
      expect(mockCustomerRepository.update).toHaveBeenCalledWith(
        customerId,
        input,
      );
    });

    it("should update customer with partial fields", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        industry: "Technology",
        size: "medium",
        location: "San Francisco",
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Existing Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer: Customer = {
        ...existingCustomer,
        industry: "Technology",
        size: "medium",
        location: "San Francisco",
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedCustomer);
    });

    it("should update customer with empty input (no fields to update)", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {};

      const existingCustomer: Customer = {
        id: customerId,
        name: "Existing Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockCustomerRepository.update.mockResolvedValue(ok(existingCustomer));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(existingCustomer);
      expect(mockCustomerRepository.update).toHaveBeenCalledWith(
        customerId,
        input,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle updating all valid company sizes", async () => {
      const customerId = uuidv7();
      const testCases: Array<"small" | "medium" | "large" | "enterprise"> = [
        "small",
        "medium",
        "large",
        "enterprise",
      ];

      const existingCustomer: Customer = {
        id: customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const size of testCases) {
        const input: UpdateCustomerInput = { size };
        const updatedCustomer: Customer = {
          ...existingCustomer,
          size,
          updatedAt: new Date(),
        };

        mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
        mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

        const result = await updateCustomer(mockContext, customerId, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().size).toBe(size);
      }
    });

    it("should handle boundary values for foundedYear", async () => {
      const customerId = uuidv7();
      const currentYear = new Date().getFullYear();
      const testCases = [1800, 2000, currentYear];

      const existingCustomer: Customer = {
        id: customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const foundedYear of testCases) {
        const input: UpdateCustomerInput = { foundedYear };
        const updatedCustomer: Customer = {
          ...existingCustomer,
          foundedYear,
          updatedAt: new Date(),
        };

        mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
        mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

        const result = await updateCustomer(mockContext, customerId, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().foundedYear).toBe(foundedYear);
      }
    });

    it("should handle various valid website URLs", async () => {
      const customerId = uuidv7();
      const testCases = [
        "https://example.com",
        "http://subdomain.example.org",
        "https://complex-domain.co.uk/path?query=value",
        "https://localhost:3000",
      ];

      const existingCustomer: Customer = {
        id: customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const website of testCases) {
        const input: UpdateCustomerInput = { website };
        const updatedCustomer: Customer = {
          ...existingCustomer,
          website,
          updatedAt: new Date(),
        };

        mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
        mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

        const result = await updateCustomer(mockContext, customerId, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().website).toBe(website);
      }
    });

    it("should handle minimum and maximum length names", async () => {
      const customerId = uuidv7();
      const testCases = ["A", "a".repeat(255)];

      const existingCustomer: Customer = {
        id: customerId,
        name: "Original Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const name of testCases) {
        const input: UpdateCustomerInput = { name };
        const updatedCustomer: Customer = {
          ...existingCustomer,
          name,
          updatedAt: new Date(),
        };

        mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
        mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

        const result = await updateCustomer(mockContext, customerId, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().name).toBe(name);
      }
    });

    it("should handle undefined optional fields without modifying them", async () => {
      const customerId = uuidv7();
      const input: UpdateCustomerInput = {
        name: "Updated Name",
        industry: undefined,
        size: undefined,
        location: undefined,
        foundedYear: undefined,
        website: undefined,
        description: undefined,
        assignedUserId: undefined,
        parentCustomerId: undefined,
      };

      const existingCustomer: Customer = {
        id: customerId,
        name: "Original Company",
        industry: "Original Industry",
        size: "small",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer: Customer = {
        ...existingCustomer,
        name: "Updated Name",
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(existingCustomer));
      mockCustomerRepository.update.mockResolvedValue(ok(updatedCustomer));

      const result = await updateCustomer(mockContext, customerId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedCustomer);
    });
  });
});
