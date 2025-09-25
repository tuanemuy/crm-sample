import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createCustomerTestData,
  createUserTestData,
} from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { UpdateDealInput } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { updateDeal } from "./updateDeal";

let db: Database;
let context: Context;

// Helper function to create test entities
async function createTestEntities() {
  // Create a customer
  const customerData = createCustomerTestData({
    overrides: { name: "Test Customer" },
  });
  const customerResult = await context.customerRepository.create({
    ...customerData,
    status: "active",
  });
  if (customerResult.isErr()) throw new Error("Failed to create customer");
  const customer = customerResult.value;

  // Create a user
  const userData = createUserTestData();
  const userResult = await context.userRepository.create({
    ...userData,
    passwordHash: "hash",
    isActive: true,
  });
  if (userResult.isErr()) throw new Error("Failed to create user");
  const user = userResult.value;

  return { customer, user };
}

describe("updateDeal", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate deal update requirements", async () => {
      // Setup test entities
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const invalidInputs = [
        { dealId: "", input: { title: "Updated Deal" } }, // Empty deal ID
        { dealId: deal.id, input: { title: "a".repeat(256) } }, // Title too long
        { dealId: deal.id, input: { stage: "invalid_stage" } }, // Invalid stage
        { dealId: deal.id, input: { probability: 150 } }, // Probability > 100
      ];

      for (const { dealId, input } of invalidInputs) {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        const result = await updateDeal(context, dealId, input as any);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      }
    });
  });

  describe("business logic validation", () => {
    it("should reject if deal does not exist", async () => {
      const input: UpdateDealInput = {
        title: "Updated Deal",
      };

      const result = await updateDeal(context, uuidv7(), input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Deal not found");
    });

    it("should reject if customer does not exist", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {
        customerId: uuidv7(),
      };

      const result = await updateDeal(context, deal.id, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer not found");
    });

    it("should reject if contact does not exist", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {
        contactId: uuidv7(),
      };

      const result = await updateDeal(context, deal.id, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact not found");
    });

    it("should reject if assigned user does not exist", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {
        assignedUserId: uuidv7(),
      };

      const result = await updateDeal(context, deal.id, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Assigned user not found");
    });
  });

  describe("successful updates", () => {
    it("should update deal with minimal fields", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {
        title: "Updated Deal",
      };

      const result = await updateDeal(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.title).toBe("Updated Deal");
      expect(updatedDeal.id).toBe(deal.id);
    });

    it("should update deal with all fields", async () => {
      // Create customer, contact, and user
      const { customer, user } = await createTestEntities();

      const contactResult = await context.contactRepository.create({
        name: "Test Contact",
        email: "contact@example.com",
        customerId: customer.id,
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      // Create original deal
      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {
        title: "Completely Updated Deal",
        customerId: customer.id,
        contactId: contact.id,
        stage: "qualification",
        amount: "25000.00",
        probability: 75,
        expectedCloseDate: new Date("2024-12-31"),
        description: "Updated description",
        competitors: ["Competitor A", "Competitor B"],
        assignedUserId: user.id,
      };

      const result = await updateDeal(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.title).toBe("Completely Updated Deal");
      expect(updatedDeal.customerId).toBe(customer.id);
      expect(updatedDeal.contactId).toBe(contact.id);
      expect(updatedDeal.stage).toBe("qualification");
      expect(updatedDeal.amount).toBe("25000.00");
      expect(updatedDeal.probability).toBe(75);
      expect(updatedDeal.description).toBe("Updated description");
      expect(updatedDeal.assignedUserId).toBe(user.id);
    });

    it("should handle stage transitions", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 25,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const stages = [
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ] as const;

      for (const stage of stages) {
        const input: UpdateDealInput = {
          stage,
        };

        const result = await updateDeal(context, deal.id, input);

        expect(result.isOk()).toBe(true);
        const updatedDeal = result._unsafeUnwrap();

        expect(updatedDeal.stage).toBe(stage);
      }
    });

    it("should handle probability updates", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 25,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const probabilities = [0, 25, 50, 75, 100];

      for (const probability of probabilities) {
        const input: UpdateDealInput = {
          probability,
        };

        const result = await updateDeal(context, deal.id, input);

        expect(result.isOk()).toBe(true);
        const updatedDeal = result._unsafeUnwrap();

        expect(updatedDeal.probability).toBe(probability);
      }
    });

    it("should handle amount updates", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const amounts = [
        { input: "5000.00", expected: "5000.00" },
        { input: "15000.00", expected: "15000.00" },
        { input: "100000.00", expected: "100000.00" },
        { input: "1000000.00", expected: "1000000.00" },
      ];

      for (const amount of amounts) {
        const input: UpdateDealInput = {
          amount: amount.input,
        };

        const result = await updateDeal(context, deal.id, input);

        expect(result.isOk()).toBe(true);
        const updatedDeal = result._unsafeUnwrap();

        expect(updatedDeal.amount).toBe(amount.expected);
      }
    });
  });

  describe("data structure validation", () => {
    it("should return updated deal with proper structure", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {
        title: "Updated Deal",
        stage: "qualification",
        probability: 75,
      };

      const result = await updateDeal(context, deal.id, input);

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
    it("should handle empty update input", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {};

      const result = await updateDeal(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      // Should return the deal unchanged
      expect(updatedDeal.id).toBe(deal.id);
    });

    it("should handle undefined optional fields", async () => {
      // Create a deal first
      const { customer, user } = await createTestEntities();

      const dealResult = await context.dealRepository.create({
        title: "Original Deal",
        amount: "10000.00",
        stage: "prospecting",
        probability: 50,
        customerId: customer.id,
        competitors: [],
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: UpdateDealInput = {
        title: "Updated Deal",
        contactId: undefined,
        assignedUserId: undefined,
        expectedCloseDate: undefined,
        actualCloseDate: undefined,
        description: undefined,
        competitors: undefined,
      };

      const result = await updateDeal(context, deal.id, input);

      expect(result.isOk()).toBe(true);
      const updatedDeal = result._unsafeUnwrap();

      expect(updatedDeal.title).toBe("Updated Deal");
    });
  });
});
