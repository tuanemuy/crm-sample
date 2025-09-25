import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";

let db: Database;
let context: Context;

describe("Customer Test", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("basic functionality", () => {
    it("should work with real adapters", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });

      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();
      expect(customer.name).toBe("Test Customer");
      expect(customer.status).toBe("active");
      expect(customer.id).toBeDefined();
    });

    it("should handle non-existent entities", async () => {
      const nonExistentId = uuidv7();

      const result = await context.customerRepository.findById(nonExistentId);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });
});
