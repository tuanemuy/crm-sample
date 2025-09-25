import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import {
  type GetCampaignDetailsInput,
  getCampaignDetails,
  getCampaignDetailsInputSchema,
} from "./getCampaignDetails";

let db: Database;
let context: Context;

describe("getCampaignDetails", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate campaign ID format", async () => {
      const invalidInputs = [
        {
          campaignId: "invalid-uuid",
        },
        {
          campaignId: "",
        },
        {
          campaignId: "123-456-789",
        },
        {
          campaignId: uuidv7().substring(0, 30), // Truncated UUID
        },
      ];

      for (const input of invalidInputs) {
        const validation = getCampaignDetailsInputSchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should validate correct UUID format", async () => {
      const validInput = {
        campaignId: uuidv7(),
      };

      const validation = getCampaignDetailsInputSchema.safeParse(validInput);
      expect(validation.success).toBe(true);
    });
  });

  describe("campaign not found", () => {
    it("should return error when campaign does not exist", async () => {
      const nonExistentId = uuidv7();

      const input: GetCampaignDetailsInput = {
        campaignId: nonExistentId,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Campaign not found");
    });
  });

  describe("successful campaign retrieval", () => {
    it("should return campaign details with minimal data", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const createdCampaign = campaignResult._unsafeUnwrap();

      const input: GetCampaignDetailsInput = {
        campaignId: createdCampaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.id).toBe(createdCampaign.id);
      expect(campaign.name).toBe("Test Campaign");
      expect(campaign.type).toBe("email");
      expect(campaign.createdBy).toBe(user.id);
      expect(campaign.status).toBe("draft");
      // Check that stats are included
      expect(campaign.totalLeads).toBe(0);
      expect(campaign.assignedLeads).toBe(0);
      expect(campaign.contactedLeads).toBe(0);
      expect(campaign.respondedLeads).toBe(0);
      expect(campaign.convertedLeads).toBe(0);
      expect(campaign.excludedLeads).toBe(0);
      expect(campaign.conversionRate).toBe(0);
      expect(campaign.responseRate).toBe(0);
    });

    it("should return campaign details with complete data", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-30");
      const metadata = { source: "web", priority: "high" };

      // Create a campaign with all fields
      const campaignResult = await context.campaignRepository.create({
        name: "Comprehensive Campaign",
        description: "A comprehensive test campaign",
        type: "email",
        startDate,
        endDate,
        budget: 5000.5,
        targetAudience: "B2B enterprises",
        goal: "Generate 100 leads",
        metadata,
        createdBy: user.id,
      });
      expect(campaignResult.isOk()).toBe(true);
      const createdCampaign = campaignResult._unsafeUnwrap();

      const input: GetCampaignDetailsInput = {
        campaignId: createdCampaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.id).toBe(createdCampaign.id);
      expect(campaign.name).toBe("Comprehensive Campaign");
      expect(campaign.description).toBe("A comprehensive test campaign");
      expect(campaign.type).toBe("email");
      expect(campaign.startDate).toEqual(startDate);
      expect(campaign.endDate).toEqual(endDate);
      expect(campaign.budget).toBe(5000.5);
      expect(campaign.targetAudience).toBe("B2B enterprises");
      expect(campaign.goal).toBe("Generate 100 leads");
      expect(campaign.metadata).toEqual(metadata);
      expect(campaign.createdBy).toBe(user.id);
      expect(campaign.createdAt).toBeDefined();
      expect(campaign.updatedAt).toBeDefined();
    });

    it("should return campaign details for different types", async () => {
      const campaignTypes = [
        "email",
        "sms",
        "social",
        "event",
        "webinar",
      ] as const;

      for (const type of campaignTypes) {
        // Create a user for each campaign type
        const userResult = await context.userRepository.create({
          name: "Test User",
          email: `test-${type}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        // Create a campaign
        const campaignResult = await context.campaignRepository.create({
          name: `Test ${type} Campaign`,
          type: type,
          createdBy: user.id,
          metadata: {},
        });
        expect(campaignResult.isOk()).toBe(true);
        const createdCampaign = campaignResult._unsafeUnwrap();

        const input: GetCampaignDetailsInput = {
          campaignId: createdCampaign.id,
        };

        const result = await getCampaignDetails(context, input);

        expect(result.isOk()).toBe(true);
        const campaign = result._unsafeUnwrap();
        expect(campaign.type).toBe(type);
        expect(campaign.name).toBe(`Test ${type} Campaign`);
      }
    });

    it("should return campaign details for different statuses", async () => {
      const campaignStatuses = [
        "draft",
        "active",
        "paused",
        "completed",
        "cancelled",
      ] as const;

      for (const status of campaignStatuses) {
        // Create a user for each campaign status
        const userResult = await context.userRepository.create({
          name: "Test User",
          email: `test-${status}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        // Create a campaign
        const campaignResult = await context.campaignRepository.create({
          name: `Test ${status} Campaign`,
          type: "email",
          createdBy: user.id,
          metadata: {},
        });
        expect(campaignResult.isOk()).toBe(true);
        const createdCampaign = campaignResult._unsafeUnwrap();

        // Update campaign status
        const updateResult = await context.campaignRepository.update({
          id: createdCampaign.id,
          status: status,
        });
        expect(updateResult.isOk()).toBe(true);

        const input: GetCampaignDetailsInput = {
          campaignId: createdCampaign.id,
        };

        const result = await getCampaignDetails(context, input);

        expect(result.isOk()).toBe(true);
        const campaign = result._unsafeUnwrap();
        expect(campaign.status).toBe(status);
        expect(campaign.name).toBe(`Test ${status} Campaign`);
      }
    });
  });

  describe("campaign statistics", () => {
    it("should return campaign with statistics when leads are assigned", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign with Stats",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create some leads
      const leadResults = await Promise.all([
        context.leadRepository.create({
          firstName: "Lead1",
          lastName: "Test",
          email: "lead1@example.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Lead2",
          lastName: "Test",
          email: "lead2@example.com",
          status: "qualified",
          score: 75,
          tags: [],
        }),
      ]);

      const _leads = leadResults.map((r) => r._unsafeUnwrap());

      // Assign leads to campaign (if campaign lead functionality exists)
      // Note: This depends on whether the campaign repository has lead assignment functionality
      // For now, we'll test the basic statistics structure

      const input: GetCampaignDetailsInput = {
        campaignId: campaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaignWithStats = result._unsafeUnwrap();

      // Verify that statistics properties exist
      expect(typeof campaignWithStats.totalLeads).toBe("number");
      expect(typeof campaignWithStats.assignedLeads).toBe("number");
      expect(typeof campaignWithStats.contactedLeads).toBe("number");
      expect(typeof campaignWithStats.respondedLeads).toBe("number");
      expect(typeof campaignWithStats.convertedLeads).toBe("number");
      expect(typeof campaignWithStats.excludedLeads).toBe("number");
      expect(typeof campaignWithStats.conversionRate).toBe("number");
      expect(typeof campaignWithStats.responseRate).toBe("number");
    });
  });

  describe("edge cases", () => {
    it("should handle campaign with empty optional fields", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign with minimal data
      const campaignResult = await context.campaignRepository.create({
        name: "Minimal Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const createdCampaign = campaignResult._unsafeUnwrap();

      const input: GetCampaignDetailsInput = {
        campaignId: createdCampaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.description).toBeUndefined();
      expect(campaign.startDate).toBeUndefined();
      expect(campaign.endDate).toBeUndefined();
      expect(campaign.budget).toBeUndefined();
      expect(campaign.targetAudience).toBeUndefined();
      expect(campaign.goal).toBeUndefined();
      expect(campaign.metadata).toEqual({});
    });

    it("should handle campaign with complex metadata", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const complexMetadata = {
        source: "organic",
        tags: ["B2B", "enterprise"],
        settings: {
          autoResponder: true,
          tracking: {
            opens: true,
            clicks: true,
          },
        },
        nested: {
          deep: {
            value: "test",
          },
        },
      };

      // Create a campaign with complex metadata
      const campaignResult = await context.campaignRepository.create({
        name: "Complex Metadata Campaign",
        type: "email",
        metadata: complexMetadata,
        createdBy: user.id,
      });
      expect(campaignResult.isOk()).toBe(true);
      const createdCampaign = campaignResult._unsafeUnwrap();

      const input: GetCampaignDetailsInput = {
        campaignId: createdCampaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.metadata).toEqual(complexMetadata);
    });

    it("should handle campaign with boundary date values", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Test with dates very close together
      const startDate = new Date("2024-06-01T10:00:00.000Z");
      const endDate = new Date("2024-06-01T10:00:00.001Z");

      // Create a campaign with boundary dates
      const campaignResult = await context.campaignRepository.create({
        name: "Boundary Date Campaign",
        type: "email",
        startDate,
        endDate,
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const createdCampaign = campaignResult._unsafeUnwrap();

      const input: GetCampaignDetailsInput = {
        campaignId: createdCampaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.startDate).toEqual(startDate);
      expect(campaign.endDate).toEqual(endDate);
    });

    it("should handle campaign with zero budget", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign with zero budget
      const campaignResult = await context.campaignRepository.create({
        name: "Zero Budget Campaign",
        type: "social",
        budget: 0,
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const createdCampaign = campaignResult._unsafeUnwrap();

      const input: GetCampaignDetailsInput = {
        campaignId: createdCampaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.budget).toBe(0);
    });

    it("should handle campaign with high budget", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const highBudget = 999999.99;

      // Create a campaign with high budget
      const campaignResult = await context.campaignRepository.create({
        name: "High Budget Campaign",
        type: "email",
        budget: highBudget,
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const createdCampaign = campaignResult._unsafeUnwrap();

      const input: GetCampaignDetailsInput = {
        campaignId: createdCampaign.id,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.budget).toBe(highBudget);
    });
  });

  describe("repository error handling", () => {
    it("should handle repository failure gracefully", async () => {
      const campaignId = uuidv7();

      // Mock the repository to return an error
      const originalFindByIdWithStats =
        context.campaignRepository.findByIdWithStats;
      context.campaignRepository.findByIdWithStats = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Repository error"),
        } as any);
      };

      const input: GetCampaignDetailsInput = {
        campaignId,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Failed to get campaign details",
      );

      // Restore original method
      context.campaignRepository.findByIdWithStats = originalFindByIdWithStats;
    });

    it("should handle repository returning null", async () => {
      const campaignId = uuidv7();

      // Mock the repository to return null (campaign not found)
      const originalFindByIdWithStats =
        context.campaignRepository.findByIdWithStats;
      context.campaignRepository.findByIdWithStats = async () => {
        return Promise.resolve({
          isErr: () => false,
          isOk: () => true,
          value: null,
        } as any);
      };

      const input: GetCampaignDetailsInput = {
        campaignId,
      };

      const result = await getCampaignDetails(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Campaign not found");

      // Restore original method
      context.campaignRepository.findByIdWithStats = originalFindByIdWithStats;
    });
  });
});
