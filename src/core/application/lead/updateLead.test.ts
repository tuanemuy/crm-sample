import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { Lead, UpdateLeadInput } from "@/core/domain/lead/types";
import type { User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { updateLead } from "./updateLead";

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

// Mock context with required repositories
const mockContext: Context = {
  leadRepository: mockLeadRepository,
  userRepository: mockUserRepository,
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

describe("updateLead", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid email format", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email", // Invalid email format
      };

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Invalid input for updating lead",
      );
    });

    it("should reject invalid score values", async () => {
      const leadId = uuidv7();
      const invalidScores = [-1, 101, 150];

      for (const score of invalidScores) {
        const input: UpdateLeadInput = {
          firstName: "John",
          lastName: "Doe",
          score,
        };

        const result = await updateLead(mockContext, leadId, input);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain(
          "Invalid input for updating lead",
        );
      }
    });

    it("should accept valid score boundary values", async () => {
      const leadId = uuidv7();
      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validScores = [0, 50, 100];

      for (const score of validScores) {
        const input: UpdateLeadInput = {
          score,
        };

        const updatedLead: Lead = { ...existingLead, score };

        mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
        mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

        const result = await updateLead(mockContext, leadId, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().score).toBe(score);
      }
    });

    it("should reject invalid status values", async () => {
      const leadId = uuidv7();
      const input = {
        firstName: "John",
        lastName: "Doe",
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        status: "invalid-status" as any,
      } as UpdateLeadInput;

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Invalid input for updating lead",
      );
    });

    it("should accept all valid status values", async () => {
      const leadId = uuidv7();
      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 50,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validStatuses: Array<
        "new" | "contacted" | "qualified" | "converted" | "rejected"
      > = ["new", "contacted", "qualified", "converted", "rejected"];

      for (const status of validStatuses) {
        const input: UpdateLeadInput = {
          status,
        };

        const updatedLead: Lead = { ...existingLead, status };

        mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
        mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

        const result = await updateLead(mockContext, leadId, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().status).toBe(status);
      }
    });

    it("should accept empty input (no fields to update)", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {};

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 50,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(existingLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(existingLead);
    });
  });

  describe("lead existence validation", () => {
    it("should reject update when lead does not exist", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "John",
        lastName: "Doe",
      };

      mockLeadRepository.findById.mockResolvedValue(ok(null));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Lead not found");
    });

    it("should handle repository error when checking lead existence", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "John",
        lastName: "Doe",
      };

      mockLeadRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Failed to get lead");
    });
  });

  describe("assigned user validation", () => {
    it("should reject update when assigned user does not exist", async () => {
      const leadId = uuidv7();
      const nonExistentUserId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        assignedUserId: nonExistentUserId,
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockUserRepository.findById.mockResolvedValue(ok(null));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Assigned user not found");
    });

    it("should handle repository error when verifying assigned user", async () => {
      const leadId = uuidv7();
      const userId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        assignedUserId: userId,
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockUserRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify user",
      );
    });

    it("should accept valid assigned user", async () => {
      const leadId = uuidv7();
      const userId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        assignedUserId: userId,
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const assignedUser: User = {
        id: userId,
        name: "Sales Manager",
        email: "sales@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        firstName: "John",
        lastName: "Doe",
        assignedUserId: userId,
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockUserRepository.findById.mockResolvedValue(ok(assignedUser));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().assignedUserId).toBe(userId);
    });
  });

  describe("repository error handling", () => {
    it("should handle repository error during update", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "John",
        lastName: "Doe",
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to update lead",
      );
    });
  });

  describe("successful updates", () => {
    it("should update basic lead information", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "Updated",
        lastName: "Name",
        email: "updated@example.com",
        phone: "+1234567890",
        company: "Updated Company",
        title: "Updated Title",
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        firstName: "Updated",
        lastName: "Name",
        email: "updated@example.com",
        phone: "+1234567890",
        company: "Updated Company",
        title: "Updated Title",
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("Updated");
      expect(lead.lastName).toBe("Name");
      expect(lead.email).toBe("updated@example.com");
      expect(lead.phone).toBe("+1234567890");
      expect(lead.company).toBe("Updated Company");
      expect(lead.title).toBe("Updated Title");
    });

    it("should update lead score and status", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        status: "qualified",
        score: 85,
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        status: "qualified",
        score: 85,
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().status).toBe("qualified");
      expect(result._unsafeUnwrap().score).toBe(85);
    });

    it("should update lead tags and notes", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        tags: ["hot-lead", "enterprise", "demo-requested"],
        notes: "Very interested in premium package. Schedule follow-up call.",
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        tags: ["hot-lead", "enterprise", "demo-requested"],
        notes: "Very interested in premium package. Schedule follow-up call.",
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual(["hot-lead", "enterprise", "demo-requested"]);
      expect(lead.notes).toBe(
        "Very interested in premium package. Schedule follow-up call.",
      );
    });

    it("should update industry and source", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        industry: "Technology",
        source: "Website Contact Form",
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        industry: "Technology",
        source: "Website Contact Form",
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().industry).toBe("Technology");
      expect(result._unsafeUnwrap().source).toBe("Website Contact Form");
    });

    it("should update all fields simultaneously", async () => {
      const leadId = uuidv7();
      const userId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "Complete",
        lastName: "Update",
        email: "complete@example.com",
        phone: "+1234567890",
        company: "Complete Corp",
        title: "CEO",
        industry: "Software",
        source: "Conference",
        status: "qualified",
        score: 90,
        tags: ["hot", "enterprise"],
        notes: "Complete update test",
        assignedUserId: userId,
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const assignedUser: User = {
        id: userId,
        name: "Assigned User",
        email: "assigned@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        id: leadId,
        firstName: "Complete",
        lastName: "Update",
        email: "complete@example.com",
        phone: "+1234567890",
        company: "Complete Corp",
        title: "CEO",
        industry: "Software",
        source: "Conference",
        status: "qualified",
        score: 90,
        tags: ["hot", "enterprise"],
        notes: "Complete update test",
        assignedUserId: userId,
        createdAt: existingLead.createdAt,
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockUserRepository.findById.mockResolvedValue(ok(assignedUser));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("Complete");
      expect(lead.lastName).toBe("Update");
      expect(lead.email).toBe("complete@example.com");
      expect(lead.phone).toBe("+1234567890");
      expect(lead.company).toBe("Complete Corp");
      expect(lead.title).toBe("CEO");
      expect(lead.industry).toBe("Software");
      expect(lead.source).toBe("Conference");
      expect(lead.status).toBe("qualified");
      expect(lead.score).toBe(90);
      expect(lead.tags).toEqual(["hot", "enterprise"]);
      expect(lead.notes).toBe("Complete update test");
      expect(lead.assignedUserId).toBe(userId);
    });
  });

  describe("partial updates", () => {
    it("should update only provided fields", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "Updated", // Only update first name
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "Original",
        lastName: "Lastname", // Should remain unchanged
        email: "original@example.com", // Should remain unchanged
        status: "contacted", // Should remain unchanged
        score: 50, // Should remain unchanged
        tags: ["existing"], // Should remain unchanged
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        firstName: "Updated",
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("Updated");
      expect(lead.lastName).toBe("Lastname"); // Unchanged
      expect(lead.email).toBe("original@example.com"); // Unchanged
      expect(lead.status).toBe("contacted"); // Unchanged
      expect(lead.score).toBe(50); // Unchanged
    });

    it("should handle clearing optional fields", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        phone: undefined,
        company: undefined,
        notes: undefined,
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Old Company",
        notes: "Old notes",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        phone: undefined,
        company: undefined,
        notes: undefined,
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.phone).toBeUndefined();
      expect(lead.company).toBeUndefined();
      expect(lead.notes).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle leads with special characters", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "José",
        lastName: "García-López",
        company: "Compañía & Associates",
        title: "Gerente de Ventas",
        notes: "Special chars: éñü @#$%",
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        firstName: "José",
        lastName: "García-López",
        company: "Compañía & Associates",
        title: "Gerente de Ventas",
        notes: "Special chars: éñü @#$%",
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("José");
      expect(lead.lastName).toBe("García-López");
      expect(lead.company).toBe("Compañía & Associates");
    });

    it("should handle empty tags array", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        tags: [], // Clear all tags
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: ["old", "tags"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        tags: [],
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().tags).toEqual([]);
    });

    it("should handle very long notes", async () => {
      const leadId = uuidv7();
      const longNotes = "Very long notes ".repeat(100);
      const input: UpdateLeadInput = {
        notes: longNotes,
      };

      const existingLead: Lead = {
        id: leadId,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLead: Lead = {
        ...existingLead,
        notes: longNotes,
        updatedAt: new Date(),
      };

      mockLeadRepository.findById.mockResolvedValue(ok(existingLead));
      mockLeadRepository.update.mockResolvedValue(ok(updatedLead));

      const result = await updateLead(mockContext, leadId, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().notes).toBe(longNotes);
    });
  });
});
