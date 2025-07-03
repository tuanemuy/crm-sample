import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { Contact } from "@/core/domain/contact/types";
import type { Customer } from "@/core/domain/customer/types";
import type { CreateDealInput, Deal } from "@/core/domain/deal/types";
import type { User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { createDeal } from "./createDeal";

// Mock repositories
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

// Mock context with required repositories
const mockContext: Context = {
  dealRepository: mockDealRepository,
  customerRepository: mockCustomerRepository,
  userRepository: mockUserRepository,
  contactRepository: mockContactRepository,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  leadRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactHistoryRepository: {} as any,
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

describe("createDeal", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid input with empty title", async () => {
      const input: CreateDealInput = {
        title: "",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid customerId", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: "invalid-uuid",
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid assignedUserId", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: "invalid-uuid",
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid contactId", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        contactId: "invalid-uuid",
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid stage", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
        stage: "invalid_stage" as any,
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with negative probability", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: -1,
        competitors: [],
      };

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with probability over 100", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 101,
        competitors: [],
      };

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });
  });

  describe("customer validation", () => {
    it("should reject creation if customer does not exist", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(null));

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer does not exist");
    });

    it("should handle repository error when verifying customer", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      mockCustomerRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify customer",
      );
    });
  });

  describe("user validation", () => {
    it("should reject creation if assigned user does not exist", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(null));

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Assigned user does not exist",
      );
    });

    it("should handle repository error when verifying user", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify assigned user",
      );
    });
  });

  describe("contact validation", () => {
    it("should reject creation if contact does not exist", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        contactId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockContactRepository.findById.mockResolvedValue(ok(null));

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact does not exist");
    });

    it("should reject creation if contact belongs to different customer", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        contactId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const contact: Contact = {
        id: input.contactId as string,
        customerId: uuidv7(), // Different customer
        name: "John Doe",
        email: "john@example.com",
        isPrimary: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockContactRepository.findById.mockResolvedValue(ok(contact));

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Contact does not belong to the specified customer",
      );
    });

    it("should handle repository error when verifying contact", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        contactId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockContactRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify contact",
      );
    });
  });

  describe("deal creation", () => {
    it("should handle repository error during deal creation", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockDealRepository.create.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createDeal(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to create deal",
      );
    });
  });

  describe("successful creation", () => {
    it("should create deal with minimal required fields", async () => {
      const input: CreateDealInput = {
        title: "Simple Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdDeal: Deal = {
        id: uuidv7(),
        title: "Simple Deal",
        customerId: input.customerId,
        assignedUserId: input.assignedUserId,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockDealRepository.create.mockResolvedValue(ok(createdDeal));

      const result = await createDeal(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdDeal);
      expect(mockDealRepository.create).toHaveBeenCalledWith({
        title: "Simple Deal",
        customerId: input.customerId,
        assignedUserId: input.assignedUserId,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      });
    });

    it("should create deal with all optional fields", async () => {
      const input: CreateDealInput = {
        title: "Complex Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        contactId: uuidv7(),
        stage: "qualification",
        amount: "50000",
        probability: 75,
        description: "A complex business deal",
        expectedCloseDate: new Date("2024-12-31"),
        competitors: ["Competitor A", "Competitor B"],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const contact: Contact = {
        id: input.contactId as string,
        customerId: input.customerId,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdDeal: Deal = {
        id: uuidv7(),
        title: "Complex Deal",
        customerId: input.customerId,
        assignedUserId: input.assignedUserId,
        contactId: input.contactId,
        stage: "qualification",
        amount: "50000",
        probability: 75,
        description: "A complex business deal",
        expectedCloseDate: new Date("2024-12-31"),
        competitors: ["Competitor A", "Competitor B"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockContactRepository.findById.mockResolvedValue(ok(contact));
      mockDealRepository.create.mockResolvedValue(ok(createdDeal));

      const result = await createDeal(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdDeal);
      expect(mockDealRepository.create).toHaveBeenCalledWith(input);
    });

    it("should create deal without contactId", async () => {
      const input: CreateDealInput = {
        title: "No Contact Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "negotiation",
        amount: "25000",
        probability: 50,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdDeal: Deal = {
        id: uuidv7(),
        title: "No Contact Deal",
        customerId: input.customerId,
        assignedUserId: input.assignedUserId,
        stage: "negotiation",
        amount: "25000",
        probability: 50,
        competitors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockDealRepository.create.mockResolvedValue(ok(createdDeal));

      const result = await createDeal(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdDeal);
      expect(mockContactRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle all valid deal stages", async () => {
      const testCases: Array<
        "prospecting" | "qualification" | "proposal" | "negotiation"
      > = ["prospecting", "qualification", "proposal", "negotiation"];

      for (const stage of testCases) {
        const input: CreateDealInput = {
          title: `Deal in ${stage}`,
          customerId: uuidv7(),
          assignedUserId: uuidv7(),
          stage: stage as
            | "prospecting"
            | "qualification"
            | "proposal"
            | "negotiation",
          amount: "0",
          probability: 0,
          competitors: [],
        };

        const customer: Customer = {
          id: input.customerId,
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const user: User = {
          id: input.assignedUserId,
          name: "Test User",
          email: "test@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hash",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const createdDeal: Deal = {
          id: uuidv7(),
          title: `Deal in ${stage}`,
          customerId: input.customerId,
          assignedUserId: input.assignedUserId,
          stage: stage as
            | "prospecting"
            | "qualification"
            | "proposal"
            | "negotiation"
            | "closed_won"
            | "closed_lost",
          amount: "0",
          probability: 0,
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockCustomerRepository.findById.mockResolvedValue(ok(customer));
        mockUserRepository.findById.mockResolvedValue(ok(user));
        mockDealRepository.create.mockResolvedValue(ok(createdDeal));

        const result = await createDeal(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(createdDeal);
      }
    });

    it("should handle boundary probability values", async () => {
      const testCases = [0, 50, 100];

      for (const probability of testCases) {
        const input: CreateDealInput = {
          title: `Deal with probability ${probability}`,
          customerId: uuidv7(),
          assignedUserId: uuidv7(),
          stage: "prospecting",
          amount: "0",
          probability,
          competitors: [],
        };

        const customer: Customer = {
          id: input.customerId,
          name: "Test Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const user: User = {
          id: input.assignedUserId,
          name: "Test User",
          email: "test@example.com",
          role: "user",
          isActive: true,
          passwordHash: "hash",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const createdDeal: Deal = {
          id: uuidv7(),
          title: `Deal with probability ${probability}`,
          customerId: input.customerId,
          assignedUserId: input.assignedUserId,
          stage: "prospecting",
          amount: "0",
          probability,
          competitors: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockCustomerRepository.findById.mockResolvedValue(ok(customer));
        mockUserRepository.findById.mockResolvedValue(ok(user));
        mockDealRepository.create.mockResolvedValue(ok(createdDeal));

        const result = await createDeal(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(createdDeal);
      }
    });

    it("should handle empty competitors array", async () => {
      const input: CreateDealInput = {
        title: "Deal with no competitors",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdDeal: Deal = {
        id: uuidv7(),
        title: "Deal with no competitors",
        customerId: input.customerId,
        assignedUserId: input.assignedUserId,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockDealRepository.create.mockResolvedValue(ok(createdDeal));

      const result = await createDeal(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdDeal);
    });

    it("should handle future expected close date", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const input: CreateDealInput = {
        title: "Future deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
        expectedCloseDate: futureDate,
      };

      const customer: Customer = {
        id: input.customerId,
        name: "Test Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user: User = {
        id: input.assignedUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdDeal: Deal = {
        id: uuidv7(),
        title: "Future deal",
        customerId: input.customerId,
        assignedUserId: input.assignedUserId,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        expectedCloseDate: futureDate,
        competitors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockUserRepository.findById.mockResolvedValue(ok(user));
      mockDealRepository.create.mockResolvedValue(ok(createdDeal));

      const result = await createDeal(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdDeal);
    });
  });
});
