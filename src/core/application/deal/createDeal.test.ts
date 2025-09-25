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
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { CreateDealInput } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { createDeal } from "./createDeal";

let db: Database;
let context: Context;

describe("createDeal", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate required deal information", async () => {
      const invalidInputs = [
        {
          title: "",
          customerId: uuidv7(),
          assignedUserId: uuidv7(),
          stage: "prospecting",
          amount: "0",
          probability: 0,
          competitors: [],
        }, // Empty title
        {
          title: "Valid Deal",
          customerId: "invalid-uuid",
          assignedUserId: uuidv7(),
          stage: "prospecting",
          amount: "0",
          probability: 0,
          competitors: [],
        }, // Invalid customer UUID
        {
          title: "Valid Deal",
          customerId: uuidv7(),
          assignedUserId: "invalid-uuid",
          stage: "prospecting",
          amount: "0",
          probability: 0,
          competitors: [],
        }, // Invalid assigned user UUID
        {
          title: "Valid Deal",
          customerId: uuidv7(),
          assignedUserId: uuidv7(),
          contactId: "invalid-uuid",
          stage: "prospecting",
          amount: "0",
          probability: 0,
          competitors: [],
        }, // Invalid contact UUID
        {
          title: "Valid Deal",
          customerId: uuidv7(),
          assignedUserId: uuidv7(),
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
          stage: "invalid_stage" as any,
          amount: "0",
          probability: 0,
          competitors: [],
        }, // Invalid stage
        {
          title: "Valid Deal",
          customerId: uuidv7(),
          assignedUserId: uuidv7(),
          stage: "prospecting",
          amount: "0",
          probability: -1,
          competitors: [],
        }, // Negative probability
        {
          title: "Valid Deal",
          customerId: uuidv7(),
          assignedUserId: uuidv7(),
          stage: "prospecting",
          amount: "0",
          probability: 101,
          competitors: [],
        }, // Probability over 100
      ];

      for (const input of invalidInputs) {
        const result = await createDeal(context, input as CreateDealInput);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toBe(
          ERROR_MESSAGES.DEAL_INVALID_INPUT,
        );
      }
    });
  });

  describe("customer validation", () => {
    it("should reject creation if customer does not exist", async () => {
      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: uuidv7(),
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer does not exist");
    });

    // Repository error handling tests are not needed with real adapters
    // as they test database-level error scenarios that are hard to simulate
  });

  describe("user validation", () => {
    it("should reject creation if assigned user does not exist", async () => {
      // Create a customer first using test factory
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: customer.id,
        assignedUserId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Assigned user does not exist",
      );
    });

    // Repository error handling tests are not needed with real adapters
    // as they test database-level error scenarios that are hard to simulate
  });

  describe("contact validation", () => {
    it("should reject creation if contact does not exist", async () => {
      // Create a customer first using test factory
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user first using test factory
      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        contactId: uuidv7(),
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact does not exist");
    });

    it("should reject creation if contact belongs to different customer", async () => {
      // Create two customers using test factory
      const customerData = createCustomerTestData({
        overrides: { name: "Test Company" },
      });
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const otherCustomerData = createCustomerTestData({
        overrides: { name: "Other Company" },
      });
      const otherCustomerResult = await context.customerRepository.create({
        ...otherCustomerData,
        status: "active",
      });
      expect(otherCustomerResult.isOk()).toBe(true);
      const otherCustomer = otherCustomerResult._unsafeUnwrap();

      // Create a user using test factory
      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a contact for the other customer
      const contactResult = await context.contactRepository.create({
        customerId: otherCustomer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: true,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Valid Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        contactId: contact.id,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Contact does not belong to the specified customer",
      );
    });

    // Repository error handling tests are not needed with real adapters
    // as they test database-level error scenarios that are hard to simulate
  });

  // Repository error handling tests are not needed with real adapters
  // as they test database-level error scenarios that are hard to simulate

  describe("successful creation", () => {
    it("should create deal with minimal required fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
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

      const input: CreateDealInput = {
        title: "Simple Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const createdDeal = result._unsafeUnwrap();
      expect(createdDeal.title).toBe("Simple Deal");
      expect(createdDeal.customerId).toBe(customer.id);
      expect(createdDeal.assignedUserId).toBe(user.id);
      expect(createdDeal.stage).toBe("prospecting");
      expect(createdDeal.amount).toBe("0.00");
      expect(createdDeal.probability).toBe(0);
      expect(createdDeal.competitors).toEqual([]);
      expect(createdDeal.id).toBeDefined();
      expect(createdDeal.createdAt).toBeDefined();
      expect(createdDeal.updatedAt).toBeDefined();
    });

    it("should create deal with all optional fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
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

      // Create a contact first
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: true,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Complex Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        contactId: contact.id,
        stage: "qualification",
        amount: "50000",
        probability: 75,
        description: "A complex business deal",
        expectedCloseDate: new Date("2024-12-31"),
        competitors: ["Competitor A", "Competitor B"],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const createdDeal = result._unsafeUnwrap();
      expect(createdDeal.title).toBe("Complex Deal");
      expect(createdDeal.customerId).toBe(customer.id);
      expect(createdDeal.assignedUserId).toBe(user.id);
      expect(createdDeal.contactId).toBe(contact.id);
      expect(createdDeal.stage).toBe("qualification");
      expect(createdDeal.amount).toBe("50000.00");
      expect(createdDeal.probability).toBe(75);
      expect(createdDeal.description).toBe("A complex business deal");
      expect(createdDeal.expectedCloseDate).toEqual(new Date("2024-12-31"));
      expect(createdDeal.competitors).toEqual(["Competitor A", "Competitor B"]);
    });

    it("should create deal without contactId", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
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

      const input: CreateDealInput = {
        title: "No Contact Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "negotiation",
        amount: "25000",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const createdDeal = result._unsafeUnwrap();
      expect(createdDeal.title).toBe("No Contact Deal");
      expect(createdDeal.customerId).toBe(customer.id);
      expect(createdDeal.assignedUserId).toBe(user.id);
      expect(createdDeal.stage).toBe("negotiation");
      expect(createdDeal.amount).toBe("25000.00");
      expect(createdDeal.probability).toBe(50);
      expect(createdDeal.competitors).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle all valid deal stages", async () => {
      const testCases: Array<
        "prospecting" | "qualification" | "proposal" | "negotiation"
      > = ["prospecting", "qualification", "proposal", "negotiation"];

      for (const stage of testCases) {
        // Create a customer first
        const customerResult = await context.customerRepository.create({
          name: `Test Company ${stage}`,
          status: "active",
        });
        expect(customerResult.isOk()).toBe(true);
        const customer = customerResult._unsafeUnwrap();

        // Create a user first
        const userResult = await context.userRepository.create({
          name: "Test User",
          email: `test-${stage}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const input: CreateDealInput = {
          title: `Deal in ${stage}`,
          customerId: customer.id,
          assignedUserId: user.id,
          stage: stage as
            | "prospecting"
            | "qualification"
            | "proposal"
            | "negotiation",
          amount: "0",
          probability: 0,
          competitors: [],
        };

        const result = await createDeal(context, input);

        expect(result.isOk()).toBe(true);
        const createdDeal = result._unsafeUnwrap();
        expect(createdDeal.title).toBe(`Deal in ${stage}`);
        expect(createdDeal.stage).toBe(stage);
      }
    });

    it("should handle boundary probability values", async () => {
      const testCases = [0, 50, 100];

      for (const probability of testCases) {
        // Create a customer first
        const customerResult = await context.customerRepository.create({
          name: `Test Company ${probability}`,
          status: "active",
        });
        expect(customerResult.isOk()).toBe(true);
        const customer = customerResult._unsafeUnwrap();

        // Create a user first
        const userResult = await context.userRepository.create({
          name: "Test User",
          email: `test-${probability}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        const input: CreateDealInput = {
          title: `Deal with probability ${probability}`,
          customerId: customer.id,
          assignedUserId: user.id,
          stage: "prospecting",
          amount: "0",
          probability,
          competitors: [],
        };

        const result = await createDeal(context, input);

        expect(result.isOk()).toBe(true);
        const createdDeal = result._unsafeUnwrap();
        expect(createdDeal.title).toBe(`Deal with probability ${probability}`);
        expect(createdDeal.probability).toBe(probability);
      }
    });

    it("should handle empty competitors array", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
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

      const input: CreateDealInput = {
        title: "Deal with no competitors",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const createdDeal = result._unsafeUnwrap();
      expect(createdDeal.title).toBe("Deal with no competitors");
      expect(createdDeal.competitors).toEqual([]);
    });

    it("should handle future expected close date", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
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

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const input: CreateDealInput = {
        title: "Future deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
        expectedCloseDate: futureDate,
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const createdDeal = result._unsafeUnwrap();
      expect(createdDeal.title).toBe("Future deal");
      expect(createdDeal.expectedCloseDate).toEqual(futureDate);
    });
  });
});
