import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { getDealDetails } from "./getDealDetails";

let db: Database;
let context: Context;

describe("getDealDetails", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject empty dealId", async () => {
      const result = await getDealDetails(context, "");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject undefined dealId", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getDealDetails(context, undefined as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject null dealId", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getDealDetails(context, null as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("business logic validation", () => {
    it("should return error for non-existent deal", async () => {
      const nonExistentDealId = uuidv7();

      const result = await getDealDetails(context, nonExistentDealId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Deal not found");
    });
  });

  describe("successful retrieval", () => {
    it("should return deal details for existing deal", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "testuser@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        expectedCloseDate: new Date("2024-12-31"),
        competitors: [],
        assignedUserId: user.id,
      });
      if (dealResult.isErr()) {
        console.error("Deal creation failed:", dealResult.error);
      }
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const result = await getDealDetails(context, deal.id);

      expect(result.isOk()).toBe(true);
      const dealDetails = result._unsafeUnwrap();

      expect(dealDetails).toHaveProperty("id");
      expect(dealDetails).toHaveProperty("title");
      expect(dealDetails).toHaveProperty("amount");
      expect(dealDetails).toHaveProperty("stage");
      expect(dealDetails).toHaveProperty("customerId");

      expect(dealDetails.id).toBe(deal.id);
      expect(dealDetails.title).toBe("Test Deal");
      expect(dealDetails.amount).toBe("10000.00");
      expect(dealDetails.stage).toBe("prospecting");
      expect(dealDetails.customerId).toBe(customer.id);
    });

    it("should return deal with relations if available", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

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

      // Create a deal with assigned user
      const dealResult = await context.dealRepository.create({
        title: "Test Deal with Relations",
        amount: "25000",
        stage: "qualification",
        probability: 75,
        customerId: customer.id,
        assignedUserId: user.id,
        expectedCloseDate: new Date("2024-12-31"),
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const result = await getDealDetails(context, deal.id);

      expect(result.isOk()).toBe(true);
      const dealDetails = result._unsafeUnwrap();

      expect(dealDetails).toHaveProperty("id");
      expect(dealDetails).toHaveProperty("title");
      expect(dealDetails).toHaveProperty("amount");
      expect(dealDetails).toHaveProperty("stage");
      expect(dealDetails).toHaveProperty("customerId");
      expect(dealDetails).toHaveProperty("assignedUserId");

      expect(dealDetails.id).toBe(deal.id);
      expect(dealDetails.title).toBe("Test Deal with Relations");
      expect(dealDetails.amount).toBe("25000.00");
      expect(dealDetails.stage).toBe("qualification");
      expect(dealDetails.probability).toBe(75);
      expect(dealDetails.customerId).toBe(customer.id);
      expect(dealDetails.assignedUserId).toBe(user.id);
    });
  });

  describe("data structure validation", () => {
    it("should return deal with proper structure", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "testuser3@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        expectedCloseDate: new Date("2024-12-31"),
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const result = await getDealDetails(context, deal.id);

      expect(result.isOk()).toBe(true);
      const dealDetails = result._unsafeUnwrap();

      // Check core fields
      expect(typeof dealDetails.id).toBe("string");
      expect(typeof dealDetails.title).toBe("string");
      expect(typeof dealDetails.amount).toBe("string");
      expect(typeof dealDetails.stage).toBe("string");
      expect(typeof dealDetails.probability).toBe("number");
      expect(typeof dealDetails.customerId).toBe("string");

      // Check timestamps
      expect(dealDetails.createdAt).toBeInstanceOf(Date);
      expect(dealDetails.updatedAt).toBeInstanceOf(Date);

      // Check optional fields
      if (dealDetails.expectedCloseDate) {
        expect(dealDetails.expectedCloseDate).toBeInstanceOf(Date);
      }
      if (dealDetails.assignedUserId) {
        expect(typeof dealDetails.assignedUserId).toBe("string");
      }
      if (dealDetails.description) {
        expect(typeof dealDetails.description).toBe("string");
      }
    });

    it("should handle deals with optional fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "testuser4@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal with all optional fields
      const dealResult = await context.dealRepository.create({
        title: "Complete Deal",
        amount: "50000",
        stage: "negotiation",
        probability: 90,
        customerId: customer.id,
        description: "A complete deal with all fields",
        expectedCloseDate: new Date("2024-12-31"),
        competitors: ["Competitor A", "Competitor B"],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const result = await getDealDetails(context, deal.id);

      expect(result.isOk()).toBe(true);
      const dealDetails = result._unsafeUnwrap();

      expect(dealDetails.title).toBe("Complete Deal");
      expect(dealDetails.amount).toBe("50000.00");
      expect(dealDetails.stage).toBe("negotiation");
      expect(dealDetails.probability).toBe(90);
      expect(dealDetails.description).toBe("A complete deal with all fields");
      expect(dealDetails.expectedCloseDate).toBeInstanceOf(Date);
    });
  });

  describe("edge cases", () => {
    it("should handle deal with minimal required fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Minimal Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "testuser5@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal with minimal fields
      const dealResult = await context.dealRepository.create({
        title: "Minimal Deal",
        amount: "1000",
        stage: "prospecting",
        probability: 25,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const result = await getDealDetails(context, deal.id);

      expect(result.isOk()).toBe(true);
      const dealDetails = result._unsafeUnwrap();

      expect(dealDetails.title).toBe("Minimal Deal");
      expect(dealDetails.amount).toBe("1000.00");
      expect(dealDetails.stage).toBe("prospecting");
      expect(dealDetails.probability).toBe(25);
      expect(dealDetails.customerId).toBe(customer.id);
    });

    it("should handle various deal stages", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "testuser6@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const stages = [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ] as const;

      for (const stage of stages) {
        const dealResult = await context.dealRepository.create({
          title: `Deal in ${stage}`,
          amount: "10000",
          stage,
          probability: 50,
          customerId: customer.id,
          competitors: [],
          assignedUserId: user.id,
        });
        expect(dealResult.isOk()).toBe(true);
        const deal = dealResult._unsafeUnwrap();

        const result = await getDealDetails(context, deal.id);

        expect(result.isOk()).toBe(true);
        const dealDetails = result._unsafeUnwrap();

        expect(dealDetails.stage).toBe(stage);
        expect(dealDetails.title).toBe(`Deal in ${stage}`);
      }
    });

    it("should handle deals with various amounts", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "testuser7@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hashedpassword",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const amounts = ["100", "1000", "10000", "100000", "1000000"];
      const expectedAmounts = [
        "100.00",
        "1000.00",
        "10000.00",
        "100000.00",
        "1000000.00",
      ];

      for (let i = 0; i < amounts.length; i++) {
        const amount = amounts[i];
        const expectedAmount = expectedAmounts[i];
        const dealResult = await context.dealRepository.create({
          title: `Deal worth ${amount}`,
          amount,
          stage: "prospecting",
          probability: 50,
          customerId: customer.id,
          competitors: [],
          assignedUserId: user.id,
        });
        expect(dealResult.isOk()).toBe(true);
        const deal = dealResult._unsafeUnwrap();

        const result = await getDealDetails(context, deal.id);

        expect(result.isOk()).toBe(true);
        const dealDetails = result._unsafeUnwrap();

        expect(dealDetails.amount).toBe(expectedAmount);
        expect(dealDetails.title).toBe(`Deal worth ${amount}`);
      }
    });
  });
});
