import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createBatchTestData,
  createCustomerTestData,
  createDealTestData,
  createTestContext,
  createTestContextWithData,
  createTestScenario,
  createUserTestData,
  measureTestPerformance,
  setupTestDatabase,
  withTestTiming,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { createCustomer } from "@/core/application/customer/createCustomer";
import { createDeal } from "@/core/application/deal/createDeal";
import { createUser } from "@/core/application/user/createUser";

let db: Database;
let context: Context;

describe("Test Factories Example", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("Basic Factory Usage", () => {
    it("should create user with factory defaults", async () => {
      const userData = createUserTestData();
      const result = await createUser(context, userData);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Test User");
      expect(user.email).toContain("test-");
      expect(user.role).toBe("user");
    });

    it("should create user with custom overrides", async () => {
      const userData = createUserTestData({
        overrides: {
          name: "Custom Manager",
          role: "manager",
        },
      });
      const result = await createUser(context, userData);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe("Custom Manager");
      expect(user.role).toBe("manager");
    });

    it("should create customer with factory defaults", async () => {
      const customerData = createCustomerTestData();
      const result = await createCustomer(context, customerData);

      expect(result.isOk()).toBe(true);
      const customer = result._unsafeUnwrap();
      expect(customer.name).toContain("Test Customer");
      expect(customer.industry).toBe("Technology");
      expect(customer.size).toBe("medium");
    });

    it("should create deal with dependencies", async () => {
      // Create required dependencies using factories
      const userData = createUserTestData();
      const userResult = await createUser(context, userData);
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const customerData = createCustomerTestData();
      const customerResult = await createCustomer(context, customerData);
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create deal with dependencies
      const dealData = createDealTestData({
        overrides: {
          customerId: customer.id,
          assignedUserId: user.id,
          title: "Factory Deal",
          amount: "25000.00",
        },
      });
      const dealResult = await createDeal(context, dealData);

      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();
      expect(deal.title).toBe("Factory Deal");
      expect(deal.amount).toBe("25000.00");
      expect(deal.customerId).toBe(customer.id);
      expect(deal.assignedUserId).toBe(user.id);
    });
  });

  describe("Test Scenarios", () => {
    it("should create sales scenario", async () => {
      const { context: testContext, seedData } =
        await createTestContextWithData("sales");

      expect(seedData.users).toBeDefined();
      expect(seedData.customers).toBeDefined();
      expect(seedData.deals).toBeDefined();

      expect(seedData.users.salesUser).toBeDefined();
      expect(seedData.users.manager).toBeDefined();
      expect(seedData.customers).toHaveLength(2);
      expect(seedData.deals).toHaveLength(2);

      // Verify deals are properly linked
      const deal = seedData.deals[0];
      expect(deal.customerId).toBe(seedData.customers[0].id);
      expect(deal.assignedUserId).toBe(seedData.users.salesUser.id);
    });

    it("should create lead conversion scenario", async () => {
      const { context: testContext, seedData } =
        await createTestContextWithData("lead_conversion");

      expect(seedData.users).toBeDefined();
      expect(seedData.customers).toBeDefined();
      expect(seedData.leads).toBeDefined();

      expect(seedData.leads).toHaveLength(2);
      expect(seedData.leads[0].firstName).toBe("Jane");
      expect(seedData.leads[0].status).toBe("qualified");
      expect(seedData.leads[1].firstName).toBe("Bob");
      expect(seedData.leads[1].status).toBe("new");
    });
  });

  describe("Performance Testing", () => {
    it("should measure test execution time", async () => {
      const timer = measureTestPerformance("create user performance test");

      const userData = createUserTestData();
      const result = await createUser(context, userData);

      expect(result.isOk()).toBe(true);
      const duration = timer.end();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should create batch test data efficiently", async () => {
      const { result: batchData, duration } = await withTestTiming(async () => {
        return await createBatchTestData(context, {
          users: 5,
          customers: 10,
          deals: 15,
        });
      });

      expect(batchData.users).toHaveLength(5);
      expect(batchData.customers).toHaveLength(10);
      expect(batchData.deals).toHaveLength(15);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify relationships
      const deal = batchData.deals[0];
      expect(batchData.customers.some((c) => c.id === deal.customerId)).toBe(
        true,
      );
      expect(batchData.users.some((u) => u.id === deal.assignedUserId)).toBe(
        true,
      );
    });
  });

  describe("Complex Test Scenarios", () => {
    it("should simulate complete sales workflow", async () => {
      const timer = measureTestPerformance("complete sales workflow");

      // Create sales scenario
      const scenario = await createTestScenario(context, "sales");
      const { users, customers, deals } = scenario;

      // Simulate workflow steps
      const deal = deals[0];
      expect(deal.stage).toBe("qualification");

      // Update deal stage
      const updatedDeal = await context.dealRepository.update(deal.id, {
        stage: "proposal",
        probability: 85,
      });
      expect(updatedDeal.isOk()).toBe(true);

      // Create activity for the deal
      const activityResult = await context.activityRepository.create({
        type: "meeting",
        subject: "Proposal presentation",
        description: "Presented solution to client",
        status: "completed",
        priority: "high",
        assignedUserId: users.salesUser.id,
        dealId: deal.id,
        customerId: customers[0].id,
        createdByUserId: users.salesUser.id,
        completedAt: new Date(),
        scheduledAt: new Date(),
      });
      expect(activityResult.isOk()).toBe(true);

      const duration = timer.end();
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it("should handle concurrent test data creation", async () => {
      const { result: results, duration } = await withTestTiming(async () => {
        // Create multiple test scenarios concurrently
        const scenarios = await Promise.all([
          createTestScenario(context, "sales"),
          createTestScenario(context, "lead_conversion"),
          createTestScenario(context, "customer_management"),
        ]);
        return scenarios;
      });

      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds

      // Verify each scenario has the expected data
      const [salesScenario, leadScenario, customerScenario] = results;
      expect(salesScenario.deals).toBeDefined();
      expect(leadScenario.leads).toBeDefined();
      expect(customerScenario.customers).toBeDefined();
    });
  });

  describe("Data Consistency Tests", () => {
    it("should maintain referential integrity across entities", async () => {
      const batchData = await createBatchTestData(context, {
        users: 3,
        customers: 5,
        deals: 10,
      });

      // Verify all deals have valid customer and user references
      for (const deal of batchData.deals) {
        const customer = batchData.customers.find(
          (c) => c.id === deal.customerId,
        );
        const user = batchData.users.find((u) => u.id === deal.assignedUserId);

        expect(customer).toBeDefined();
        expect(user).toBeDefined();
      }

      // Verify all customers have valid user assignments
      for (const customer of batchData.customers) {
        if (customer.assignedUserId) {
          const user = batchData.users.find(
            (u) => u.id === customer.assignedUserId,
          );
          expect(user).toBeDefined();
        }
      }
    });

    it("should generate unique identifiers", async () => {
      const userData1 = createUserTestData();
      const userData2 = createUserTestData();

      expect(userData1.email).not.toBe(userData2.email);

      const customerData1 = createCustomerTestData();
      const customerData2 = createCustomerTestData();

      expect(customerData1.name).not.toBe(customerData2.name);
    });
  });
});
