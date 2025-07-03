import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type { CreateLeadInput, Lead } from "@/core/domain/lead/types";
import type { User } from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { createLead } from "./createLead";

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

const mockScoringService = {
  evaluateLeadScore: vi.fn(),
  updateLeadScore: vi.fn(),
  calculateScoreFromBehavior: vi.fn(),
  getActiveRules: vi.fn(),
  testRule: vi.fn(),
  calculateScore: vi.fn(),
  bulkUpdateLeadScores: vi.fn(),
};

// Mock context with required repositories
const mockContext: Context = {
  leadRepository: mockLeadRepository,
  userRepository: mockUserRepository,
  scoringService: mockScoringService,
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

describe("createLead", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("should reject invalid input with empty firstName", async () => {
      const input: CreateLeadInput = {
        firstName: "",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with empty lastName", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "",
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid email format", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        tags: [],
      };

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with firstName too long", async () => {
      const input: CreateLeadInput = {
        firstName: "a".repeat(101),
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with lastName too long", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "a".repeat(101),
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid input with invalid assignedUserId", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        assignedUserId: "invalid-uuid",
        tags: [],
      };

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });
  });

  describe("email duplication check", () => {
    it("should reject creation if lead with same email already exists", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const existingLead: Lead = {
        id: uuidv7(),
        firstName: "Jane",
        lastName: "Smith",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(existingLead));

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Lead with this email already exists",
      );
    });

    it("should handle repository error when checking existing lead", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      mockLeadRepository.findByEmail.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to check existing lead",
      );
    });

    it("should skip email check when email is not provided", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        tags: [],
        // No email provided
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(ok(createdLead));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(mockLeadRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe("assigned user validation", () => {
    it("should reject creation if assigned user does not exist", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        assignedUserId: uuidv7(),
        tags: [],
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockUserRepository.findById.mockResolvedValue(ok(null));

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Assigned user does not exist",
      );
    });

    it("should handle repository error when verifying assigned user", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        assignedUserId: uuidv7(),
        tags: [],
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockUserRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to verify assigned user",
      );
    });

    it("should skip user validation when assignedUserId is not provided", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
        // No assignedUserId
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(ok(createdLead));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("lead creation", () => {
    it("should handle repository error during lead creation", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockLeadRepository.create.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createLead(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to create lead",
      );
    });
  });

  describe("successful creation", () => {
    it("should create lead with minimal required fields", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(ok(createdLead));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdLead);
      expect(mockLeadRepository.create).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        score: 0,
        status: "new",
        tags: [],
      });
    });

    it("should create lead with all optional fields", async () => {
      const assignedUserId = uuidv7();
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Tech Corp",
        title: "Manager",
        industry: "Technology",
        source: "Website",
        tags: ["hot", "qualified"],
        notes: "Great prospect",
        assignedUserId,
      };

      const assignedUser: User = {
        id: assignedUserId,
        name: "Sales Rep",
        email: "rep@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Tech Corp",
        title: "Manager",
        industry: "Technology",
        source: "Website",
        status: "new",
        score: 0,
        tags: ["hot", "qualified"],
        notes: "Great prospect",
        assignedUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockUserRepository.findById.mockResolvedValue(ok(assignedUser));
      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(ok(createdLead));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdLead);
      expect(mockLeadRepository.create).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Tech Corp",
        title: "Manager",
        industry: "Technology",
        source: "Website",
        tags: ["hot", "qualified"],
        notes: "Great prospect",
        assignedUserId,
        score: 0,
        status: "new",
      });
    });

    it("should set default values correctly", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(ok(createdLead));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().status).toBe("new");
      expect(result._unsafeUnwrap().score).toBe(0);
      expect(result._unsafeUnwrap().tags).toEqual([]);
    });
  });

  describe("scoring service integration", () => {
    it("should return updated lead when scoring service succeeds", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
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
        ...createdLead,
        score: 75,
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(ok(updatedLead));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedLead);
      expect(mockScoringService.evaluateLeadScore).toHaveBeenCalledWith(
        createdLead.id,
      );
    });

    it("should return original lead when scoring service fails", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(
        err(new ApplicationError("Scoring failed")),
      );

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdLead);
    });

    it("should return original lead when updated lead is not found", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(ok(null));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdLead);
    });

    it("should return original lead when findById fails after scoring", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));
      mockLeadRepository.findById.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(createdLead);
    });
  });

  describe("edge cases", () => {
    it("should handle minimum length names", async () => {
      const input: CreateLeadInput = {
        firstName: "A",
        lastName: "B",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "A",
        lastName: "B",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().firstName).toBe("A");
      expect(result._unsafeUnwrap().lastName).toBe("B");
    });

    it("should handle maximum length names", async () => {
      const input: CreateLeadInput = {
        firstName: "a".repeat(100),
        lastName: "b".repeat(100),
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "a".repeat(100),
        lastName: "b".repeat(100),
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().firstName).toBe("a".repeat(100));
      expect(result._unsafeUnwrap().lastName).toBe("b".repeat(100));
    });

    it("should handle empty tags array", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        tags: [],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        status: "new",
        score: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().tags).toEqual([]);
    });

    it("should handle multiple tags", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        tags: ["hot", "qualified", "enterprise", "urgent"],
      };

      const createdLead: Lead = {
        id: uuidv7(),
        firstName: "John",
        lastName: "Doe",
        status: "new",
        score: 0,
        tags: ["hot", "qualified", "enterprise", "urgent"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeadRepository.create.mockResolvedValue(ok(createdLead));
      mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));

      const result = await createLead(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().tags).toEqual([
        "hot",
        "qualified",
        "enterprise",
        "urgent",
      ]);
    });

    it("should handle various email formats", async () => {
      const testCases = [
        "user@domain.com",
        "user.name@domain.co.uk",
        "user+tag@domain.org",
        "user123@sub.domain.com",
      ];

      for (const email of testCases) {
        const input: CreateLeadInput = {
          firstName: "John",
          lastName: "Doe",
          email,
          tags: [],
        };

        const createdLead: Lead = {
          id: uuidv7(),
          firstName: "John",
          lastName: "Doe",
          email,
          status: "new",
          score: 0,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockLeadRepository.findByEmail.mockResolvedValue(ok(null));
        mockLeadRepository.create.mockResolvedValue(ok(createdLead));
        mockScoringService.evaluateLeadScore.mockResolvedValue(ok(undefined));

        const result = await createLead(mockContext, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().email).toBe(email);
      }
    });
  });
});
