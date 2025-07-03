import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { Contact } from "@/core/domain/contact/types";
import type { Customer } from "@/core/domain/customer/types";
import type { Deal } from "@/core/domain/deal/types";
import type { ConvertLeadInput, Lead } from "@/core/domain/lead/types";
import { ApplicationError, NotFoundError, RepositoryError } from "@/lib/error";
import { convertLeadToCustomer } from "./convertLeadToCustomer";

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

// Mock context with required repositories
const mockContext: Context = {
  leadRepository: mockLeadRepository,
  customerRepository: mockCustomerRepository,
  contactRepository: mockContactRepository,
  dealRepository: mockDealRepository,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  userRepository: {} as any,
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

describe("convertLeadToCustomer", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid input with invalid customerId", async () => {
      const leadId = uuidv7();
      const input: ConvertLeadInput = {
        customerId: "invalid-uuid",
        createContact: false,
        createDeal: false,
      };

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with missing customerId", async () => {
      const leadId = uuidv7();
      const input = {
        createContact: false,
        createDeal: false,
        // missing customerId
      } as ConvertLeadInput;

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should accept valid input when createDeal is true but dealInfo is missing", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: true,
        // missing dealInfo when createDeal is true - this is valid per schema
      };

      const lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified" as const,
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer = {
        id: customerId,
        name: "Target Company",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      // Deal should not be created when no dealInfo and no assignedUserId
      expect(mockDealRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("lead validation", () => {
    it("should reject conversion when lead does not exist", async () => {
      const leadId = uuidv7();
      const input: ConvertLeadInput = {
        customerId: uuidv7(),
        createContact: false,
        createDeal: false,
      };

      mockLeadRepository.findById.mockResolvedValue(ok(null));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe("Lead not found");
    });

    it("should reject conversion when lead is already converted", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: false,
      };

      const convertedLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "converted", // Already converted
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(convertedLead));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Lead is already converted",
      );
    });

    it("should handle repository error when getting lead", async () => {
      const leadId = uuidv7();
      const input: ConvertLeadInput = {
        customerId: uuidv7(),
        createContact: false,
        createDeal: false,
      };

      mockLeadRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Failed to get lead");
    });
  });

  describe("customer validation", () => {
    it("should reject conversion when target customer does not exist", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: false,
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(null));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Target customer does not exist",
      );
    });

    it("should handle repository error when verifying customer", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: false,
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify customer",
      );
    });
  });

  describe("lead conversion", () => {
    it("should handle repository error during lead conversion", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: false,
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to convert lead",
      );
    });
  });

  describe("successful conversion", () => {
    it("should convert lead without creating contact or deal", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: false,
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(mockLeadRepository.convert).toHaveBeenCalledWith(
        leadId,
        customerId,
      );
      expect(mockContactRepository.create).not.toHaveBeenCalled();
      expect(mockDealRepository.create).not.toHaveBeenCalled();
    });

    it("should convert lead and create contact", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: true,
        createDeal: false,
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
        title: "Manager",
        status: "qualified",
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdContact: Contact = {
        id: uuidv7(),
        customerId,
        name: "John Doe",
        title: "Manager",
        email: "john@example.com",
        phone: "+1234567890",
        isPrimary: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));
      mockContactRepository.create.mockResolvedValue(ok(createdContact));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(mockContactRepository.create).toHaveBeenCalledWith({
        customerId,
        name: "John Doe",
        title: "Manager",
        email: "john@example.com",
        phone: "+1234567890",
        isPrimary: false,
        isActive: true,
      });
    });

    it("should convert lead and create deal with assignedUserId from lead", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const assignedUserId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: true,
        dealInfo: {
          title: "New Deal",
          amount: "10000",
          stage: "qualification",
        },
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        assignedUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdDeal: Deal = {
        id: uuidv7(),
        title: "New Deal",
        customerId,
        amount: "10000",
        stage: "qualification",
        probability: 25,
        assignedUserId,
        competitors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));
      mockDealRepository.create.mockResolvedValue(ok(createdDeal));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(mockDealRepository.create).toHaveBeenCalledWith({
        title: "New Deal",
        customerId,
        amount: "10000",
        stage: "qualification",
        probability: 25,
        competitors: [],
        assignedUserId,
      });
    });

    it("should convert lead and create deal with assignedUserId from customer", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const assignedUserId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: true,
        dealInfo: {
          title: "New Deal",
          amount: "10000",
        },
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        // No assignedUserId on lead
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        assignedUserId, // Has assignedUserId
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdDeal: Deal = {
        id: uuidv7(),
        title: "New Deal",
        customerId,
        amount: "10000",
        stage: "prospecting",
        probability: 25,
        assignedUserId,
        competitors: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));
      mockDealRepository.create.mockResolvedValue(ok(createdDeal));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(mockDealRepository.create).toHaveBeenCalledWith({
        title: "New Deal",
        customerId,
        amount: "10000",
        stage: "prospecting",
        probability: 25,
        competitors: [],
        assignedUserId,
      });
    });

    it("should not create deal when no assignedUserId is available", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: true,
        dealInfo: {
          title: "New Deal",
          amount: "10000",
        },
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        // No assignedUserId
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        // No assignedUserId
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(mockDealRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("error handling for optional operations", () => {
    it("should continue conversion even if contact creation fails", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: true,
        createDeal: false,
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock console.warn to verify it's called
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));
      mockContactRepository.create.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to create contact during lead conversion:",
        expect.any(RepositoryError),
      );

      consoleSpy.mockRestore();
    });

    it("should continue conversion even if deal creation fails", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const assignedUserId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: false,
        createDeal: true,
        dealInfo: {
          title: "New Deal",
          amount: "10000",
        },
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        assignedUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock console.warn to verify it's called
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));
      mockDealRepository.create.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to create deal during lead conversion:",
        expect.any(RepositoryError),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("edge cases", () => {
    it("should handle all lead statuses except converted", async () => {
      const testCases: Array<"new" | "contacted" | "qualified" | "rejected"> = [
        "new",
        "contacted",
        "qualified",
        "rejected",
      ];

      for (const status of testCases) {
        const leadId = uuidv7();
        const customerId = uuidv7();
        const input: ConvertLeadInput = {
          customerId,
          createContact: false,
          createDeal: false,
        };

        const lead: Lead = {
          id: leadId,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          status,
          score: 85,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const customer: Customer = {
          id: customerId,
          name: "Target Company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockLeadRepository.findById.mockResolvedValue(ok(lead));
        mockCustomerRepository.findById.mockResolvedValue(ok(customer));
        mockLeadRepository.convert.mockResolvedValue(ok(undefined));

        const result = await convertLeadToCustomer(mockContext, leadId, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(customer);
      }
    });

    it("should handle lead with minimal information", async () => {
      const leadId = uuidv7();
      const customerId = uuidv7();
      const input: ConvertLeadInput = {
        customerId,
        createContact: true,
        createDeal: false,
      };

      const lead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "qualified",
        score: 85,
        tags: [],
        // Missing optional fields like phone, title, etc.
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const customer: Customer = {
        id: customerId,
        name: "Target Company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdContact: Contact = {
        id: uuidv7(),
        customerId,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(lead));
      mockCustomerRepository.findById.mockResolvedValue(ok(customer));
      mockLeadRepository.convert.mockResolvedValue(ok(undefined));
      mockContactRepository.create.mockResolvedValue(ok(createdContact));

      const result = await convertLeadToCustomer(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(customer);
      expect(mockContactRepository.create).toHaveBeenCalledWith({
        customerId,
        name: "John Doe",
        title: undefined,
        email: "john@example.com",
        phone: undefined,
        isPrimary: false,
        isActive: true,
      });
    });
  });
});
