import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { LeadWithUser } from "@/core/domain/lead/types";
import { ApplicationError, NotFoundError, RepositoryError } from "@/lib/error";
import { getLeadDetails } from "./getLeadDetails";

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
  userRepository: {} as any,
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

describe("getLeadDetails", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("lead not found", () => {
    it("should return NotFoundError when lead does not exist", async () => {
      const leadId = uuidv7();

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(null));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe("Lead not found");
      expect(mockLeadRepository.findByIdWithUser).toHaveBeenCalledWith(leadId);
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error when getting lead details", async () => {
      const leadId = uuidv7();

      mockLeadRepository.findByIdWithUser.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get lead details",
      );
    });

    it("should handle database connection error", async () => {
      const leadId = uuidv7();

      mockLeadRepository.findByIdWithUser.mockResolvedValue(
        err(new RepositoryError("Database connection failed")),
      );

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get lead details",
      );
    });

    it("should handle permission denied error", async () => {
      const leadId = uuidv7();

      mockLeadRepository.findByIdWithUser.mockResolvedValue(
        err(new RepositoryError("Access denied")),
      );

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get lead details",
      );
    });
  });

  describe("successful retrieval", () => {
    it("should return lead details with minimal data", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(leadWithUser);
      expect(mockLeadRepository.findByIdWithUser).toHaveBeenCalledWith(leadId);
    });

    it("should return lead details with complete information", async () => {
      const leadId = uuidv7();
      const assignedUserId = uuidv7();
      const convertedCustomerId = uuidv7();

      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        company: "Example Corp",
        title: "Manager",
        industry: "Technology",
        source: "Website",
        status: "qualified",
        score: 85,
        tags: ["hot-lead", "enterprise"],
        notes: "Very interested in our premium package",
        assignedUserId,
        convertedCustomerId,
        convertedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
        assignedUser: {
          id: assignedUserId,
          name: "Sales Manager",
          email: "sales@example.com",
        },
        convertedCustomer: {
          id: convertedCustomerId,
          name: "Example Corp",
        },
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(leadWithUser);
      expect(mockLeadRepository.findByIdWithUser).toHaveBeenCalledWith(leadId);
    });

    it("should return lead without assigned user", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        status: "new",
        score: 50,
        tags: ["inbound"],
        createdAt: new Date(),
        updatedAt: new Date(),
        // assignedUser is undefined
        // convertedCustomer is undefined
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.assignedUser).toBeUndefined();
      expect(lead.convertedCustomer).toBeUndefined();
    });

    it("should handle all lead statuses", async () => {
      const statuses: Array<
        "new" | "contacted" | "qualified" | "converted" | "rejected"
      > = ["new", "contacted", "qualified", "converted", "rejected"];

      for (const status of statuses) {
        const leadId = uuidv7();
        const leadWithUser: LeadWithUser = {
          id: leadId,
          firstName: "Test",
          lastName: "Lead",
          email: `test.${status}@example.com`,
          status,
          score: 75,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

        const result = await getLeadDetails(mockContext, leadId);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().status).toBe(status);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle lead with empty optional fields", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "Minimal",
        lastName: "Lead",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        // All optional fields are undefined
        email: undefined,
        phone: undefined,
        company: undefined,
        title: undefined,
        industry: undefined,
        source: undefined,
        notes: undefined,
        assignedUserId: undefined,
        convertedCustomerId: undefined,
        convertedAt: undefined,
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.email).toBeUndefined();
      expect(lead.phone).toBeUndefined();
      expect(lead.company).toBeUndefined();
      expect(lead.title).toBeUndefined();
      expect(lead.industry).toBeUndefined();
      expect(lead.source).toBeUndefined();
      expect(lead.notes).toBeUndefined();
      expect(lead.assignedUserId).toBeUndefined();
      expect(lead.convertedCustomerId).toBeUndefined();
      expect(lead.convertedAt).toBeUndefined();
    });

    it("should handle lead with maximum score", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "High",
        lastName: "Score",
        email: "high.score@example.com",
        status: "qualified",
        score: 100, // Maximum score
        tags: ["hot-lead", "enterprise", "priority"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().score).toBe(100);
    });

    it("should handle lead with minimum score", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "Low",
        lastName: "Score",
        email: "low.score@example.com",
        status: "new",
        score: 0, // Minimum score
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().score).toBe(0);
    });

    it("should handle lead with multiple tags", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "Tagged",
        lastName: "Lead",
        email: "tagged@example.com",
        status: "contacted",
        score: 60,
        tags: ["inbound", "website", "demo-requested", "enterprise", "urgent"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().tags).toHaveLength(5);
      expect(result._unsafeUnwrap().tags).toContain("inbound");
      expect(result._unsafeUnwrap().tags).toContain("urgent");
    });

    it("should handle lead with empty tags array", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "No",
        lastName: "Tags",
        email: "notags@example.com",
        status: "new",
        score: 25,
        tags: [], // Empty tags array
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().tags).toEqual([]);
    });

    it("should handle lead with long notes", async () => {
      const leadId = uuidv7();
      const longNotes = "Very long notes ".repeat(100); // Create long text

      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "Detailed",
        lastName: "Lead",
        email: "detailed@example.com",
        status: "qualified",
        score: 80,
        tags: ["detailed"],
        notes: longNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().notes).toBe(longNotes);
    });

    it("should handle converted lead with conversion data", async () => {
      const leadId = uuidv7();
      const convertedCustomerId = uuidv7();
      const convertedAt = new Date("2023-06-15T10:30:00Z");

      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "Converted",
        lastName: "Lead",
        email: "converted@example.com",
        status: "converted",
        score: 95,
        tags: ["converted", "success"],
        convertedCustomerId,
        convertedAt,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-15"),
        convertedCustomer: {
          id: convertedCustomerId,
          name: "Converted Customer Corp",
        },
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.status).toBe("converted");
      expect(lead.convertedCustomerId).toBe(convertedCustomerId);
      expect(lead.convertedAt).toEqual(convertedAt);
      expect(lead.convertedCustomer?.name).toBe("Converted Customer Corp");
    });

    it("should handle lead with special characters in name fields", async () => {
      const leadId = uuidv7();
      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "José",
        lastName: "García-López",
        email: "jose.garcia@example.com",
        company: "Compañía Internacional",
        title: "Gerente de Ventas",
        industry: "Tecnología & Software",
        status: "contacted",
        score: 70,
        tags: ["español", "international"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("José");
      expect(lead.lastName).toBe("García-López");
      expect(lead.company).toBe("Compañía Internacional");
    });

    it("should handle lead with assigned user but no converted customer", async () => {
      const leadId = uuidv7();
      const assignedUserId = uuidv7();

      const leadWithUser: LeadWithUser = {
        id: leadId,
        firstName: "Assigned",
        lastName: "Lead",
        email: "assigned@example.com",
        status: "qualified",
        score: 85,
        tags: ["assigned"],
        assignedUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedUser: {
          id: assignedUserId,
          name: "John Sales",
          email: "john.sales@example.com",
        },
        // No convertedCustomer
      };

      mockLeadRepository.findByIdWithUser.mockResolvedValue(ok(leadWithUser));

      const result = await getLeadDetails(mockContext, leadId);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.assignedUser).toBeDefined();
      expect(lead.assignedUser?.name).toBe("John Sales");
      expect(lead.convertedCustomer).toBeUndefined();
    });
  });
});
