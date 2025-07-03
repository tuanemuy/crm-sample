import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type {
  CreateCustomerInput,
  Customer,
} from "@/core/domain/customer/types";
import type { User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { createCustomer } from "./createCustomer";

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

describe("createCustomer", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid input with empty name", async () => {
      const input: CreateCustomerInput = {
        name: "",
      };

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with name too long", async () => {
      const input: CreateCustomerInput = {
        name: "a".repeat(256),
      };

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid URL", async () => {
      const input: CreateCustomerInput = {
        name: "Valid Company",
        website: "invalid-url",
      };

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid foundedYear", async () => {
      const input: CreateCustomerInput = {
        name: "Valid Company",
        foundedYear: 1500, // Too old
      };

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject future foundedYear", async () => {
      const input: CreateCustomerInput = {
        name: "Valid Company",
        foundedYear: new Date().getFullYear() + 1,
      };

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });
  });

  describe("business logic validation", () => {
    it("should reject creation if customer with same name already exists", async () => {
      const input: CreateCustomerInput = {
        name: "Existing Company",
      };

      const existingCustomer: Customer = {
        id: uuidv7(),
        name: "Existing Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(existingCustomer));

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Customer with this name already exists",
      );
    });

    it("should reject creation if assigned user does not exist", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
        assignedUserId: uuidv7(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockUserRepository.findById.mockResolvedValue(ok(null));

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Assigned user does not exist",
      );
    });

    it("should reject creation if parent customer does not exist", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
        parentCustomerId: uuidv7(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockCustomerRepository.findById.mockResolvedValue(ok(null));

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Parent customer does not exist",
      );
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error when checking existing customer", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
      };

      mockCustomerRepository.findByName.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to check existing customer",
      );
    });

    it("should handle repository error when verifying assigned user", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
        assignedUserId: uuidv7(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockUserRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify assigned user",
      );
    });

    it("should handle repository error when verifying parent customer", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
        parentCustomerId: uuidv7(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockCustomerRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify parent customer",
      );
    });

    it("should handle repository error when creating customer", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockCustomerRepository.create.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createCustomer(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to create customer",
      );
    });
  });

  describe("successful creation", () => {
    it("should create customer with minimal required fields", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
      };

      const createdCustomer: Customer = {
        id: uuidv7(),
        name: "New Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockCustomerRepository.create.mockResolvedValue(ok(createdCustomer));

      const result = await createCustomer(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdCustomer);
      expect(mockCustomerRepository.create).toHaveBeenCalledWith({
        name: "New Company",
        status: "active",
      });
    });

    it("should create customer with all optional fields", async () => {
      const assignedUserId = uuidv7();
      const parentCustomerId = uuidv7();

      const input: CreateCustomerInput = {
        name: "New Company",
        industry: "Technology",
        size: "medium",
        location: "Tokyo, Japan",
        foundedYear: 2020,
        website: "https://example.com",
        description: "A technology company",
        assignedUserId,
        parentCustomerId,
      };

      const assignedUser: User = {
        id: assignedUserId,
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const parentCustomer: Customer = {
        id: parentCustomerId,
        name: "Parent Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdCustomer: Customer = {
        id: uuidv7(),
        name: "New Company",
        industry: "Technology",
        size: "medium",
        location: "Tokyo, Japan",
        foundedYear: 2020,
        website: "https://example.com",
        description: "A technology company",
        status: "active",
        assignedUserId,
        parentCustomerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockUserRepository.findById.mockResolvedValue(ok(assignedUser));
      mockCustomerRepository.findById.mockResolvedValue(ok(parentCustomer));
      mockCustomerRepository.create.mockResolvedValue(ok(createdCustomer));

      const result = await createCustomer(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdCustomer);
      expect(mockCustomerRepository.create).toHaveBeenCalledWith({
        name: "New Company",
        industry: "Technology",
        size: "medium",
        location: "Tokyo, Japan",
        foundedYear: 2020,
        website: "https://example.com",
        description: "A technology company",
        status: "active",
        assignedUserId,
        parentCustomerId,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle undefined optional fields", async () => {
      const input: CreateCustomerInput = {
        name: "New Company",
        industry: undefined,
        size: undefined,
        location: undefined,
        foundedYear: undefined,
        website: undefined,
        description: undefined,
        assignedUserId: undefined,
        parentCustomerId: undefined,
      };

      const createdCustomer: Customer = {
        id: uuidv7(),
        name: "New Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockCustomerRepository.create.mockResolvedValue(ok(createdCustomer));

      const result = await createCustomer(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdCustomer);
    });

    it("should handle boundary values correctly", async () => {
      const input: CreateCustomerInput = {
        name: "a", // Minimum length
        foundedYear: 1800, // Minimum year
      };

      const createdCustomer: Customer = {
        id: uuidv7(),
        name: "a",
        foundedYear: 1800,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockCustomerRepository.create.mockResolvedValue(ok(createdCustomer));

      const result = await createCustomer(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdCustomer);
    });

    it("should handle current year as foundedYear", async () => {
      const currentYear = new Date().getFullYear();
      const input: CreateCustomerInput = {
        name: "New Company",
        foundedYear: currentYear,
      };

      const createdCustomer: Customer = {
        id: uuidv7(),
        name: "New Company",
        foundedYear: currentYear,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findByName.mockResolvedValue(ok(null));
      mockCustomerRepository.create.mockResolvedValue(ok(createdCustomer));

      const result = await createCustomer(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdCustomer);
    });
  });
});
