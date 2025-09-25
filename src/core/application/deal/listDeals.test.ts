import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { ListDealsQuery } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { listDeals } from "./listDeals";

let db: Database;
let context: Context;

describe("listDeals", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid query with invalid pagination", async () => {
      const query = {
        pagination: {
          page: -1,
          limit: 10,
          order: "asc",
          orderBy: "title",
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await listDeals(context, query as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });

    it("should reject invalid sortBy parameter", async () => {
      const query = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "title",
        },
        sortBy: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await listDeals(context, query as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });

    it("should reject invalid sortOrder parameter", async () => {
      const query = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "title",
        },
        sortOrder: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await listDeals(context, query as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });
  });

  describe("successful listing", () => {
    it("should list deals with minimal query", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should list deals with filters", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          stage: "prospecting",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle different sorting options", async () => {
      const sortOptions = [
        { sortBy: "title", sortOrder: "asc" },
        { sortBy: "amount", sortOrder: "desc" },
        { sortBy: "probability", sortOrder: "asc" },
        { sortBy: "expectedCloseDate", sortOrder: "desc" },
        { sortBy: "createdAt", sortOrder: "asc" },
        { sortBy: "updatedAt", sortOrder: "desc" },
      ] as const;

      for (const { sortBy, sortOrder } of sortOptions) {
        const query: ListDealsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: sortOrder,
            orderBy: sortBy,
          },
          sortBy,
          sortOrder,
        };

        const result = await listDeals(context, query);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should handle pagination correctly", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 2,
          limit: 5,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(data.items.length).toBeLessThanOrEqual(5);
    });

    it("should handle filters correctly", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          stage: "qualification",
          minAmount: "1000",
          maxAmount: "100000",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });
  });

  describe("data structure validation", () => {
    it("should return deals with proper structure", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      data.items.forEach((deal) => {
        expect(deal).toHaveProperty("id");
        expect(deal).toHaveProperty("title");
        expect(deal).toHaveProperty("amount");
        expect(deal).toHaveProperty("stage");
        expect(deal).toHaveProperty("probability");
        expect(deal).toHaveProperty("customerId");

        expect(typeof deal.id).toBe("string");
        expect(typeof deal.title).toBe("string");
        expect(typeof deal.amount).toBe("string");
        expect(typeof deal.stage).toBe("string");
        expect(typeof deal.probability).toBe("number");
        expect(typeof deal.customerId).toBe("string");
      });
    });

    it("should return count as number", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(typeof data.count).toBe("number");
      expect(data.count).toBeGreaterThanOrEqual(0);
      expect(data.count).toBeGreaterThanOrEqual(data.items.length);
    });
  });

  describe("edge cases", () => {
    it("should handle empty result set", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          stage: "closed_lost",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data.items).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it("should handle large page numbers", async () => {
      const query: ListDealsQuery = {
        pagination: {
          page: 999,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listDeals(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle different limit values", async () => {
      const limits = [1, 5, 10, 20, 50, 100];

      for (const limit of limits) {
        const query: ListDealsQuery = {
          pagination: {
            page: 1,
            limit,
            order: "desc",
            orderBy: "createdAt",
          },
          sortOrder: "desc",
        };

        const result = await listDeals(context, query);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data.items.length).toBeLessThanOrEqual(limit);
      }
    });
  });
});
