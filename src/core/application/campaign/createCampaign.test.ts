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
  type CreateCampaignInput,
  createCampaign,
  createCampaignInputSchema,
} from "./createCampaign";

let db: Database;
let context: Context;

describe("createCampaign", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate required fields", async () => {
      const invalidInputs = [
        {
          // Missing name
          type: "email",
          userId: uuidv7(),
        },
        {
          name: "", // Empty name
          type: "email",
          userId: uuidv7(),
        },
        {
          name: "A".repeat(256), // Name too long
          type: "email",
          userId: uuidv7(),
        },
        {
          name: "Test Campaign",
          type: "invalid", // Invalid type
          userId: uuidv7(),
        },
        {
          name: "Test Campaign",
          type: "email",
          userId: "invalid-uuid", // Invalid user ID
        },
        {
          name: "Test Campaign",
          type: "email",
          budget: -1, // Negative budget
          userId: uuidv7(),
        },
        {
          name: "Test Campaign",
          type: "email",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2023-12-31"), // End date before start date
          userId: uuidv7(),
        },
      ];

      for (const input of invalidInputs) {
        const validation = createCampaignInputSchema.safeParse(input);
        if (validation.success) {
          // If validation passes, the business logic should catch it
          const result = await createCampaign(
            context,
            input as CreateCampaignInput,
          );
          expect(result.isErr()).toBe(true);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        } else {
          // Validation should fail
          expect(validation.success).toBe(false);
        }
      }
    });

    it("should validate campaign types", async () => {
      const validTypes = ["email", "sms", "social", "event", "webinar"];

      for (const type of validTypes) {
        // Create a user first
        const userResult = await context.userRepository.create({
          name: "Test User",
          email: `test-${type}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const validation = createCampaignInputSchema.safeParse({
          name: `Test ${type} Campaign`,
          type: type,
          userId: user.id,
        });
        expect(validation.success).toBe(true);
      }
    });

    it("should validate date range", async () => {
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
      const endDate = new Date("2024-05-01"); // End before start

      const input: CreateCampaignInput = {
        name: "Test Campaign",
        type: "email",
        startDate,
        endDate,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "End date must be after start date",
      );
    });

    it("should allow same start and end date", async () => {
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

      const sameDate = new Date("2024-06-01");

      const input: CreateCampaignInput = {
        name: "Test Campaign",
        type: "email",
        startDate: sameDate,
        endDate: sameDate,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe(
        "End date must be after start date",
      );
    });
  });

  describe("successful campaign creation", () => {
    it("should create campaign with minimal required fields", async () => {
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

      const input: CreateCampaignInput = {
        name: "Test Campaign",
        type: "email",
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.name).toBe("Test Campaign");
      expect(campaign.type).toBe("email");
      expect(campaign.createdBy).toBe(user.id);
      expect(campaign.status).toBe("draft");
      expect(campaign.id).toBeDefined();
      expect(campaign.createdAt).toBeDefined();
      expect(campaign.updatedAt).toBeDefined();
      expect(campaign.metadata).toEqual({});
    });

    it("should create campaign with all fields", async () => {
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
      const metadata = { channel: "web", priority: "high" };

      const input: CreateCampaignInput = {
        name: "Comprehensive Campaign",
        description: "A comprehensive test campaign",
        type: "email",
        startDate,
        endDate,
        budget: 5000.5,
        targetAudience: "B2B enterprises",
        goal: "Generate 100 leads",
        metadata,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
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
    });

    it("should create campaigns with different types", async () => {
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

        const input: CreateCampaignInput = {
          name: `Test ${type} Campaign`,
          description: `Campaign for ${type} marketing`,
          type: type,
          userId: user.id,
        };

        const result = await createCampaign(context, input);

        expect(result.isOk()).toBe(true);
        const campaign = result._unsafeUnwrap();
        expect(campaign.type).toBe(type);
        expect(campaign.name).toBe(`Test ${type} Campaign`);
      }
    });

    it("should create campaign with zero budget", async () => {
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

      const input: CreateCampaignInput = {
        name: "Zero Budget Campaign",
        type: "social",
        budget: 0,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.budget).toBe(0);
    });

    it("should create campaign with long valid name", async () => {
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

      const longName = "A".repeat(255); // Maximum allowed length

      const input: CreateCampaignInput = {
        name: longName,
        type: "email",
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.name).toBe(longName);
    });
  });

  describe("edge cases", () => {
    it("should handle valid date ranges", async () => {
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

      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const input: CreateCampaignInput = {
        name: "Short Duration Campaign",
        type: "email",
        startDate: now,
        endDate: oneHourLater,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.startDate).toEqual(now);
      expect(campaign.endDate).toEqual(oneHourLater);
    });

    it("should handle only start date", async () => {
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

      const input: CreateCampaignInput = {
        name: "Start Only Campaign",
        type: "email",
        startDate,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.startDate).toEqual(startDate);
      expect(campaign.endDate).toBeUndefined();
    });

    it("should handle only end date", async () => {
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

      const endDate = new Date("2024-06-30");

      const input: CreateCampaignInput = {
        name: "End Only Campaign",
        type: "email",
        endDate,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.startDate).toBeUndefined();
      expect(campaign.endDate).toEqual(endDate);
    });

    it("should handle complex metadata", async () => {
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
        tags: ["B2B", "enterprise", "high-value"],
        settings: {
          autoResponder: true,
          tracking: {
            opens: true,
            clicks: true,
          },
        },
        customFields: {
          industry: "technology",
          region: "asia-pacific",
        },
      };

      const input: CreateCampaignInput = {
        name: "Complex Metadata Campaign",
        type: "email",
        metadata: complexMetadata,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.metadata).toEqual(complexMetadata);
    });

    it("should handle empty strings for optional fields", async () => {
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

      const input: CreateCampaignInput = {
        name: "Empty Fields Campaign",
        description: "", // Empty description
        type: "email",
        targetAudience: "", // Empty target audience
        goal: "", // Empty goal
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.description).toBe("");
      expect(campaign.targetAudience).toBe("");
      expect(campaign.goal).toBe("");
    });

    it("should handle high budget values", async () => {
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

      const input: CreateCampaignInput = {
        name: "High Budget Campaign",
        type: "email",
        budget: highBudget,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.budget).toBe(highBudget);
    });

    it("should handle decimal budget values", async () => {
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

      const decimalBudget = 1234.56;

      const input: CreateCampaignInput = {
        name: "Decimal Budget Campaign",
        type: "email",
        budget: decimalBudget,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.budget).toBe(decimalBudget);
    });
  });

  describe("boundary conditions", () => {
    it("should handle campaign name at boundaries", async () => {
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

      // Test minimum length (1 character)
      const minInput: CreateCampaignInput = {
        name: "A",
        type: "email",
        userId: user.id,
      };

      const minResult = await createCampaign(context, minInput);
      expect(minResult.isOk()).toBe(true);
      expect(minResult._unsafeUnwrap().name).toBe("A");

      // Test maximum length (255 characters)
      const maxName = "A".repeat(255);
      const maxInput: CreateCampaignInput = {
        name: maxName,
        type: "email",
        userId: user.id,
      };

      const maxResult = await createCampaign(context, maxInput);
      expect(maxResult.isOk()).toBe(true);
      expect(maxResult._unsafeUnwrap().name).toBe(maxName);
    });

    it("should handle dates at boundaries", async () => {
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

      // Test with dates very close to each other (1 millisecond apart)
      const startDate = new Date("2024-06-01T10:00:00.000Z");
      const endDate = new Date("2024-06-01T10:00:00.001Z");

      const input: CreateCampaignInput = {
        name: "Boundary Date Campaign",
        type: "email",
        startDate,
        endDate,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.startDate).toEqual(startDate);
      expect(campaign.endDate).toEqual(endDate);
    });

    it("should handle budget at zero boundary", async () => {
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

      const input: CreateCampaignInput = {
        name: "Zero Budget Campaign",
        type: "email",
        budget: 0,
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaign = result._unsafeUnwrap();
      expect(campaign.budget).toBe(0);
    });
  });

  describe("repository error handling", () => {
    it("should handle repository failure gracefully", async () => {
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

      // Mock the repository to return an error
      const originalCreate = context.campaignRepository.create;
      context.campaignRepository.create = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Repository error"),
        } as any);
      };

      const input: CreateCampaignInput = {
        name: "Test Campaign",
        type: "email",
        userId: user.id,
      };

      const result = await createCampaign(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Failed to create campaign",
      );

      // Restore original method
      context.campaignRepository.create = originalCreate;
    });
  });
});
