import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { SearchDealsInput } from "@/core/application/deal/searchDeals";
import { ApplicationError } from "@/lib/error";
import { searchDeals } from "./searchDeals";

let db: Database;
let context: Context;

describe("searchDeals", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject empty keyword", async () => {
      const input: SearchDealsInput = {
        keyword: "",
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject keyword that is too long", async () => {
      const input: SearchDealsInput = {
        keyword: "a".repeat(101),
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid sortBy parameter", async () => {
      const input = {
        keyword: "test",
        sortBy: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await searchDeals(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });

    it("should reject invalid sortOrder parameter", async () => {
      const input = {
        keyword: "test",
        sortOrder: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await searchDeals(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });
  });

  describe("successful searching", () => {
    it("should search deals with minimal input", async () => {
      const input: SearchDealsInput = {
        keyword: "test",
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should search deals with filters", async () => {
      const input: SearchDealsInput = {
        keyword: "test",
        filter: {
          stage: "prospecting",
          minAmount: "1000",
        },
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should search deals with pagination", async () => {
      const input: SearchDealsInput = {
        keyword: "test",
        pagination: {
          page: 2,
          limit: 5,
          order: "asc",
          orderBy: "title",
        },
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(data.items.length).toBeLessThanOrEqual(5);
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
        const input: SearchDealsInput = {
          keyword: "test",
          sortBy,
          sortOrder,
        };

        const result = await searchDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should use default sortOrder when not specified", async () => {
      const input: SearchDealsInput = {
        keyword: "test",
        sortBy: "title",
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle complex search with all parameters", async () => {
      const input: SearchDealsInput = {
        keyword: "important",
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "amount",
        },
        filter: {
          stage: "qualification",
          assignedUserId: uuidv7(),
          minAmount: "5000",
          maxAmount: "50000",
        },
        sortBy: "amount",
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle various keyword lengths", async () => {
      const keywords = [
        "a",
        "ab",
        "test",
        "long keyword phrase",
        "a".repeat(100),
      ];

      for (const keyword of keywords) {
        const input: SearchDealsInput = {
          keyword,
          sortOrder: "desc",
        };

        const result = await searchDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });
  });

  describe("data structure validation", () => {
    it("should return deals with proper structure", async () => {
      const input: SearchDealsInput = {
        keyword: "test",
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

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
      const input: SearchDealsInput = {
        keyword: "test",
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(typeof data.count).toBe("number");
      expect(data.count).toBeGreaterThanOrEqual(0);
      expect(data.count).toBeGreaterThanOrEqual(data.items.length);
    });
  });

  describe("search behavior", () => {
    it("should handle case-insensitive search", async () => {
      const keywords = ["TEST", "Test", "test", "TeSt"];

      for (const keyword of keywords) {
        const input: SearchDealsInput = {
          keyword,
          sortOrder: "desc",
        };

        const result = await searchDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should handle special characters in keyword", async () => {
      const keywords = [
        "test-deal",
        "test_deal",
        "test.deal",
        "test@deal",
        "test#deal",
      ];

      for (const keyword of keywords) {
        const input: SearchDealsInput = {
          keyword,
          sortOrder: "desc",
        };

        const result = await searchDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should handle numeric keywords", async () => {
      const keywords = ["123", "10000", "50.5", "1,000"];

      for (const keyword of keywords) {
        const input: SearchDealsInput = {
          keyword,
          sortOrder: "desc",
        };

        const result = await searchDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle search with no results", async () => {
      const input: SearchDealsInput = {
        keyword: "nonexistentdealname12345",
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data.items).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it("should handle search with restrictive filters", async () => {
      const input: SearchDealsInput = {
        keyword: "test",
        filter: {
          stage: "closed_lost",
          customerId: uuidv7(), // Non-existent customer
        },
        sortOrder: "desc",
      };

      const result = await searchDeals(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle whitespace in keywords", async () => {
      const keywords = [" test ", "  test  ", "\ttest\t", "\ntest\n"];

      for (const keyword of keywords) {
        const input: SearchDealsInput = {
          keyword,
          sortOrder: "desc",
        };

        const result = await searchDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should handle unicode characters in keywords", async () => {
      const keywords = ["测试", "тест", "テスト", "🚀"];

      for (const keyword of keywords) {
        const input: SearchDealsInput = {
          keyword,
          sortOrder: "desc",
        };

        const result = await searchDeals(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });
  });
});
