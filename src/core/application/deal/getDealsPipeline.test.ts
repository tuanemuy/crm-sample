import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { getDealsPipeline } from "./getDealsPipeline";

let db: Database;
let context: Context;

describe("getDealsPipeline", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid userId", async () => {
      const result = await getDealsPipeline(context, "invalid-uuid");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("business logic validation", () => {
    it("should reject if specified user does not exist", async () => {
      const nonExistentUserId = uuidv7();

      const result = await getDealsPipeline(context, nonExistentUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("User does not exist");
    });
  });

  describe("successful pipeline retrieval", () => {
    it("should return pipeline data for all users when no userId specified", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      expect(pipelineData).toHaveProperty("stages");
      expect(Array.isArray(pipelineData.stages)).toBe(true);
    });

    it("should return pipeline data for specific user", async () => {
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

      const result = await getDealsPipeline(context, user.id);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      expect(pipelineData).toHaveProperty("stages");
      expect(Array.isArray(pipelineData.stages)).toBe(true);
    });

    it("should handle existing user with no deals", async () => {
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

      const result = await getDealsPipeline(context, user.id);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      expect(pipelineData).toHaveProperty("stages");
      expect(Array.isArray(pipelineData.stages)).toBe(true);
    });
  });

  describe("data structure validation", () => {
    it("should return properly formatted pipeline data", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      expect(pipelineData).toHaveProperty("stages");
      expect(Array.isArray(pipelineData.stages)).toBe(true);

      pipelineData.stages.forEach((stage) => {
        expect(stage).toHaveProperty("stage");
        expect(stage).toHaveProperty("name");
        expect(stage).toHaveProperty("deals");
        expect(stage).toHaveProperty("totalValue");
        expect(stage).toHaveProperty("dealCount");

        expect(typeof stage.stage).toBe("string");
        expect(typeof stage.name).toBe("string");
        expect(Array.isArray(stage.deals)).toBe(true);
        expect(typeof stage.totalValue).toBe("string");
        expect(typeof stage.dealCount).toBe("number");
      });
    });

    it("should return deals with proper structure in stages", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      pipelineData.stages.forEach((stage) => {
        stage.deals.forEach((deal) => {
          expect(deal).toHaveProperty("id");
          expect(deal).toHaveProperty("title");
          expect(deal).toHaveProperty("amount");
          expect(deal).toHaveProperty("probability");
          expect(deal).toHaveProperty("customerId");
          expect(deal).toHaveProperty("updatedAt");

          expect(typeof deal.id).toBe("string");
          expect(typeof deal.title).toBe("string");
          expect(typeof deal.amount).toBe("string");
          expect(typeof deal.probability).toBe("number");
          expect(typeof deal.customerId).toBe("string");
          expect(deal.updatedAt).toBeInstanceOf(Date);

          if (deal.assignedUserId) {
            expect(typeof deal.assignedUserId).toBe("string");
          }
        });
      });
    });

    it("should have consistent stage names", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      const validStages = [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ];

      pipelineData.stages.forEach((stage) => {
        expect(validStages).toContain(stage.stage);
        expect(typeof stage.name).toBe("string");
        expect(stage.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe("business logic validation", () => {
    it("should calculate stage totals correctly", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      pipelineData.stages.forEach((stage) => {
        expect(stage.dealCount).toBe(stage.deals.length);
        expect(stage.dealCount).toBeGreaterThanOrEqual(0);
      });
    });

    it("should handle monetary values correctly", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      pipelineData.stages.forEach((stage) => {
        // Total value should be a string representing currency
        expect(typeof stage.totalValue).toBe("string");

        // Should be able to extract numeric value (basic validation)
        const numericValue = stage.totalValue.replace(/[^0-9.-]+/g, "");
        const parsedValue = Number.parseFloat(numericValue);
        expect(Number.isNaN(parsedValue)).toBe(false);
        expect(parsedValue).toBeGreaterThanOrEqual(0);
      });
    });

    it("should handle probability values correctly", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      pipelineData.stages.forEach((stage) => {
        stage.deals.forEach((deal) => {
          expect(deal.probability).toBeGreaterThanOrEqual(0);
          expect(deal.probability).toBeLessThanOrEqual(100);
        });
      });
    });
  });

  describe("user filtering", () => {
    it("should filter deals by user when userId provided", async () => {
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

      // Create a customer
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a deal assigned to the user
      const dealResult = await context.dealRepository.create({
        title: "User Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        assignedUserId: user.id,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);

      const result = await getDealsPipeline(context, user.id);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      // Find the prospecting stage
      const prospectingStage = pipelineData.stages.find(
        (s) => s.stage === "prospecting",
      );
      expect(prospectingStage).toBeDefined();

      // All deals in the pipeline should be assigned to the user
      pipelineData.stages.forEach((stage) => {
        stage.deals.forEach((deal) => {
          if (deal.assignedUserId) {
            expect(deal.assignedUserId).toBe(user.id);
          }
        });
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty pipeline", async () => {
      const result = await getDealsPipeline(context);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      expect(pipelineData.stages).toBeDefined();
      expect(Array.isArray(pipelineData.stages)).toBe(true);

      // Even with no deals, stages should still be present
      pipelineData.stages.forEach((stage) => {
        expect(stage.deals).toHaveLength(0);
        expect(stage.dealCount).toBe(0);
      });
    });

    it("should handle undefined userId gracefully", async () => {
      const result = await getDealsPipeline(context, undefined);

      expect(result.isOk()).toBe(true);
      const pipelineData = result._unsafeUnwrap();

      expect(pipelineData).toHaveProperty("stages");
      expect(Array.isArray(pipelineData.stages)).toBe(true);
    });
  });
});
