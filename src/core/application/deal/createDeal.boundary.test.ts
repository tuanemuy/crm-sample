import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createCustomerTestData,
  createUserTestData,
} from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { CreateDealInput } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { createDeal } from "./createDeal";

let db: Database;
let context: Context;

describe("createDeal - Boundary Value Tests", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("Title Boundary Values", () => {
    it("should reject deal with empty title", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.DEAL_INVALID_INPUT,
      );
    });

    it("should create deal with minimum title length (1 character)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "A",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.title).toBe("A");
    });

    it("should create deal with maximum title length (255 characters)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const longTitle = "A".repeat(255);
      const input: CreateDealInput = {
        title: longTitle,
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.title).toBe(longTitle);
    });

    it("should reject deal with title exceeding maximum length (256 characters)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const tooLongTitle = "A".repeat(256);
      const input: CreateDealInput = {
        title: tooLongTitle,
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.DEAL_INVALID_INPUT,
      );
    });
  });

  describe("Probability Boundary Values", () => {
    it("should create deal with minimum probability (0)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Zero Probability Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 0,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.probability).toBe(0);
    });

    it("should create deal with maximum probability (100)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Certain Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 100,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.probability).toBe(100);
    });

    it("should reject deal with negative probability (-1)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Negative Probability Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: -1,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.DEAL_INVALID_INPUT,
      );
    });

    it("should reject deal with probability exceeding maximum (101)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Over 100% Probability Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 101,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.DEAL_INVALID_INPUT,
      );
    });
  });

  describe("Amount Boundary Values", () => {
    it("should create deal with minimum amount (0)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Zero Amount Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "0",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.amount).toBe("0.00");
    });

    it("should create deal with decimal amount (two decimal places)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Decimal Amount Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "1234.56",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.amount).toBe("1234.56");
    });

    it("should create deal with large amount", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Large Amount Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "9999999.99",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.amount).toBe("9999999.99");
    });

    it("should reject deal with invalid amount format (negative)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Negative Amount Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "-100.00",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.DEAL_INVALID_INPUT,
      );
    });

    it("should reject deal with invalid amount format (too many decimal places)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Too Many Decimals Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "100.123",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.DEAL_INVALID_INPUT,
      );
    });

    it("should reject deal with invalid amount format (non-numeric)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Non-numeric Amount Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "abc.def",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.DEAL_INVALID_INPUT,
      );
    });
  });

  describe("Date Boundary Values", () => {
    it("should create deal with expected close date in the future", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const input: CreateDealInput = {
        title: "Future Close Date Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
        expectedCloseDate: futureDate,
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.expectedCloseDate).toEqual(futureDate);
    });

    it("should create deal with expected close date in the past", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const input: CreateDealInput = {
        title: "Past Close Date Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
        expectedCloseDate: pastDate,
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.expectedCloseDate).toEqual(pastDate);
    });

    it("should create deal with expected close date as today", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const today = new Date();
      const input: CreateDealInput = {
        title: "Today Close Date Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
        expectedCloseDate: today,
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.expectedCloseDate).toEqual(today);
    });
  });

  describe("Competitors Array Boundary Values", () => {
    it("should create deal with empty competitors array", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "No Competitors Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.competitors).toEqual([]);
    });

    it("should create deal with single competitor", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateDealInput = {
        title: "Single Competitor Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: ["Competitor A"],
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.competitors).toEqual(["Competitor A"]);
    });

    it("should create deal with multiple competitors", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const competitors = ["Competitor A", "Competitor B", "Competitor C"];
      const input: CreateDealInput = {
        title: "Multiple Competitors Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: competitors,
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.competitors).toEqual(competitors);
    });

    it("should create deal with many competitors (stress test)", async () => {
      // Create test data
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const competitors = Array.from(
        { length: 50 },
        (_, i) => `Competitor ${i + 1}`,
      );
      const input: CreateDealInput = {
        title: "Many Competitors Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: competitors,
      };

      const result = await createDeal(context, input);

      expect(result.isOk()).toBe(true);
      const deal = result._unsafeUnwrap();
      expect(deal.competitors).toEqual(competitors);
    });
  });
});
