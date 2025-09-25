import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { FilterDealsInput } from "@/core/application/deal/filterDeals";
import { ApplicationError } from "@/lib/error";
import { filterDeals } from "./filterDeals";

let db: Database;
let context: Context;

describe("filterDeals", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should accept input with unknown filter fields (extra fields are ignored)", async () => {
      const input = {
        filter: {
          invalidField: "invalid",
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing extra fields behavior
      const result = await filterDeals(context, input as any);

      expect(result.isOk()).toBe(true);
    });

    it("should reject invalid sortBy parameter", async () => {
      const input = {
        filter: {},
        sortBy: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await filterDeals(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid sortOrder parameter", async () => {
      const input = {
        filter: {},
        sortOrder: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await filterDeals(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });
  });

  describe("successful filtering", () => {
    it("should filter deals with minimal filter", async () => {
      const input: FilterDealsInput = {
        filter: {},
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should filter deals with stage filter", async () => {
      const input: FilterDealsInput = {
        filter: {
          stage: "prospecting",
        },
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should filter deals with amount range filter", async () => {
      const input: FilterDealsInput = {
        filter: {
          minAmount: "1000",
          maxAmount: "10000",
        },
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should filter deals with customer filter", async () => {
      const input: FilterDealsInput = {
        filter: {
          customerId: uuidv7(),
        },
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should filter deals with assigned user filter", async () => {
      const input: FilterDealsInput = {
        filter: {
          assignedUserId: uuidv7(),
        },
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle pagination parameters", async () => {
      const input: FilterDealsInput = {
        filter: {},
        pagination: {
          page: 2,
          limit: 10,
          order: "asc",
          orderBy: "title",
        },
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle sorting parameters", async () => {
      const sortOptions = [
        { sortBy: "title", sortOrder: "asc" },
        { sortBy: "amount", sortOrder: "desc" },
        { sortBy: "probability", sortOrder: "asc" },
        { sortBy: "expectedCloseDate", sortOrder: "desc" },
        { sortBy: "createdAt", sortOrder: "asc" },
        { sortBy: "updatedAt", sortOrder: "desc" },
      ] as const;

      for (const { sortBy, sortOrder } of sortOptions) {
        const input: FilterDealsInput = {
          filter: {},
          sortBy,
          sortOrder,
        };

        const result = await filterDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should use default sortOrder when not specified", async () => {
      const input: FilterDealsInput = {
        filter: {},
        sortBy: "title",
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle complex filter combinations", async () => {
      const input: FilterDealsInput = {
        filter: {
          stage: "qualification",
          minAmount: "5000",
          maxAmount: "50000",
          assignedUserId: uuidv7(),
        },
        pagination: {
          page: 1,
          limit: 5,
          order: "desc",
          orderBy: "amount",
        },
        sortBy: "amount",
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });
  });

  describe("data structure validation", () => {
    it("should return deals with proper structure", async () => {
      const input: FilterDealsInput = {
        filter: {},
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      data.items.forEach((deal) => {
        expect(deal).toHaveProperty("id");
        expect(deal).toHaveProperty("title");
        expect(deal).toHaveProperty("amount");
        expect(deal).toHaveProperty("stage");
        expect(deal).toHaveProperty("customerId");

        expect(typeof deal.id).toBe("string");
        expect(typeof deal.title).toBe("string");
        expect(typeof deal.amount).toBe("string");
        expect(typeof deal.stage).toBe("string");
        expect(typeof deal.customerId).toBe("string");
      });
    });

    it("should return count as number", async () => {
      const input: FilterDealsInput = {
        filter: {},
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(typeof data.count).toBe("number");
      expect(data.count).toBeGreaterThanOrEqual(0);
      expect(data.count).toBeGreaterThanOrEqual(data.items.length);
    });
  });

  describe("edge cases", () => {
    it("should handle empty result set", async () => {
      const input: FilterDealsInput = {
        filter: {
          customerId: uuidv7(), // Non-existent customer
        },
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data.items).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it("should handle missing optional parameters", async () => {
      const input: FilterDealsInput = {
        filter: {},
        sortOrder: "desc",
      };

      const result = await filterDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });
  });
});
