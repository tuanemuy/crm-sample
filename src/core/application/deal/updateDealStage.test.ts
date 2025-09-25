import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { UpdateDealStageInput } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { updateDealStage } from "./updateDealStage";

let db: Database;
let context: Context;

describe("updateDealStage", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate deal stage update requirements", async () => {
      const invalidInputs = [
        {
          stage: "invalid_stage", // Invalid stage
        },
        {
          stage: "qualification",
          probability: 150, // Probability > 100
        },
        {
          stage: "qualification",
          probability: -10, // Negative probability
        },
      ];

      for (const input of invalidInputs) {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        const result = await updateDealStage(context, uuidv7(), input as any);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });
  });

  describe("business logic validation", () => {
    it("should reject if deal does not exist", async () => {
      const input: UpdateDealStageInput = {
        stage: "qualification",
      };

      const result = await updateDealStage(context, uuidv7(), input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Deal not found");
    });
  });

  describe("successful stage updates", () => {
    it("should update deal stage without probability", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashed_password",
        role: "user",
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

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 25,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealStageInput = {
        stage: "qualification",
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.stage).toBe("qualification");
      expect(updatedDeal.id).toBe(deal.id);
    });

    it("should update deal stage with probability", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test2@example.com",
        name: "Test User 2",
        passwordHash: "hashed_password",
        role: "user",
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

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 25,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealStageInput = {
        stage: "qualification",
        probability: 60,
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.stage).toBe("qualification");
      expect(updatedDeal.probability).toBe(60);
    });

    it("should handle all valid stages", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test3@example.com",
        name: "Test User 3",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 25,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const stages = [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ] as const;

      for (const stage of stages) {
        const input: UpdateDealStageInput = {
          stage,
        };

        const result = await updateDealStage(context, deal.id, input);

        expect(result.isOk()).toBe(true);
        const updatedDeal = result._unsafeUnwrap();

        expect(updatedDeal.stage).toBe(stage);
      }
    });

    it("should set probability to 100 for closed_won", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test4@example.com",
        name: "Test User 4",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "negotiation",
        probability: 85,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealStageInput = {
        stage: "closed_won",
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.stage).toBe("closed_won");
      expect(updatedDeal.probability).toBe(100);
    });

    it("should set probability to 0 for closed_lost", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test5@example.com",
        name: "Test User 5",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "negotiation",
        probability: 85,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealStageInput = {
        stage: "closed_lost",
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.stage).toBe("closed_lost");
      expect(updatedDeal.probability).toBe(0);
    });

    it("should set actualCloseDate for closed deals", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test6@example.com",
        name: "Test User 6",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "negotiation",
        probability: 85,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealStageInput = {
        stage: "closed_won",
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.stage).toBe("closed_won");
      expect(updatedDeal.actualCloseDate).toBeInstanceOf(Date);
    });

    it("should accept custom actualCloseDate for closed deals", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test7@example.com",
        name: "Test User 7",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "negotiation",
        probability: 85,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const customDate = new Date("2024-12-25");
      const input: UpdateDealStageInput = {
        stage: "closed_won",
        actualCloseDate: customDate,
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.stage).toBe("closed_won");
      expect(updatedDeal.actualCloseDate).toEqual(customDate);
    });
  });

  describe("data structure validation", () => {
    it("should return updated deal with proper structure", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test8@example.com",
        name: "Test User 8",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 25,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealStageInput = {
        stage: "qualification",
        probability: 60,
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(typeof updatedDeal.id).toBe("string");
      expect(typeof updatedDeal.title).toBe("string");
      expect(typeof updatedDeal.amount).toBe("string");
      expect(typeof updatedDeal.stage).toBe("string");
      expect(typeof updatedDeal.probability).toBe("number");
      expect(typeof updatedDeal.customerId).toBe("string");
      expect(updatedDeal.createdAt).toBeInstanceOf(Date);
      expect(updatedDeal.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("edge cases", () => {
    it("should handle probability boundaries", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test9@example.com",
        name: "Test User 9",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const probabilities = [0, 25, 50, 75, 100];

      for (const probability of probabilities) {
        const input: UpdateDealStageInput = {
          stage: "qualification",
          probability,
        };

        const result = await updateDealStage(context, deal.id, input);

        expect(result.isOk()).toBe(true);
        const updatedDeal = result._unsafeUnwrap();

        expect(updatedDeal.probability).toBe(probability);
      }
    });

    it("should not override existing actualCloseDate", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        email: "test10@example.com",
        name: "Test User 10",
        passwordHash: "hashed_password",
        role: "user",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal first with actualCloseDate already set
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const existingCloseDate = new Date("2024-11-15");
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "closed_won",
        probability: 100,
        customerId: customer.id,
        actualCloseDate: existingCloseDate,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealStageInput = {
        stage: "closed_lost",
      };

      const result = await updateDealStage(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.stage).toBe("closed_lost");
      expect(updatedDeal.actualCloseDate).toEqual(existingCloseDate);
    });
  });
});
