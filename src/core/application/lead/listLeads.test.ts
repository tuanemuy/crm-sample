import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { ListLeadsQuery } from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { listLeads } from "./listLeads";

let db: Database;
let context: Context;

describe("listLeads", () => {
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
          orderBy: "firstName",
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await listLeads(context, query as any);

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
          orderBy: "firstName",
        },
        sortBy: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await listLeads(context, query as any);

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
          orderBy: "firstName",
        },
        sortOrder: "invalid",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await listLeads(context, query as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });
  });

  describe("successful listing", () => {
    it("should list leads with minimal query", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should list leads with filters", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          status: "qualified",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle different sorting options", async () => {
      const sortOptions = [
        { sortBy: "firstName", sortOrder: "asc" },
        { sortBy: "lastName", sortOrder: "desc" },
        { sortBy: "company", sortOrder: "desc" },
        { sortBy: "score", sortOrder: "asc" },
        { sortBy: "createdAt", sortOrder: "desc" },
        { sortBy: "updatedAt", sortOrder: "asc" },
      ] as const;

      for (const { sortBy, sortOrder } of sortOptions) {
        const query: ListLeadsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: sortOrder,
            orderBy: sortBy,
          },
          sortBy,
          sortOrder,
        };

        const result = await listLeads(context, query);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should handle pagination correctly", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 2,
          limit: 5,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
      expect(data.items.length).toBeLessThanOrEqual(5);
    });

    it("should handle various filters", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          status: "qualified",
          source: "website",
          minScore: 50,
          maxScore: 100,
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });
  });

  describe("data structure validation", () => {
    it("should return leads with proper structure", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      data.items.forEach((lead) => {
        expect(lead).toHaveProperty("id");
        expect(lead).toHaveProperty("firstName");
        expect(lead).toHaveProperty("lastName");
        expect(lead).toHaveProperty("email");
        expect(lead).toHaveProperty("company");
        expect(lead).toHaveProperty("source");
        expect(lead).toHaveProperty("status");
        expect(lead).toHaveProperty("score");

        expect(typeof lead.id).toBe("string");
        expect(typeof lead.firstName).toBe("string");
        expect(typeof lead.lastName).toBe("string");
        expect(typeof lead.email).toBe("string");
        expect(typeof lead.company).toBe("string");
        expect(typeof lead.source).toBe("string");
        expect(typeof lead.status).toBe("string");
        expect(typeof lead.score).toBe("number");
      });
    });

    it("should return count as number", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(typeof data.count).toBe("number");
      expect(data.count).toBeGreaterThanOrEqual(0);
      expect(data.count).toBeGreaterThanOrEqual(data.items.length);
    });
  });

  describe("edge cases", () => {
    it("should handle empty result set", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          status: "rejected",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data.items).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it("should handle large page numbers", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 999,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle different limit values", async () => {
      const limits = [1, 5, 10, 20, 50, 100];

      for (const limit of limits) {
        const query: ListLeadsQuery = {
          pagination: {
            page: 1,
            limit,
            order: "desc",
            orderBy: "createdAt",
          },
          sortOrder: "desc",
        };

        const result = await listLeads(context, query);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data.items.length).toBeLessThanOrEqual(limit);
      }
    });

    it("should handle score range filters", async () => {
      const query: ListLeadsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "score",
        },
        filter: {
          minScore: 75,
          maxScore: 100,
        },
        sortOrder: "desc",
      };

      const result = await listLeads(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();

      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("count");
    });

    it("should handle various status filters", async () => {
      const statuses = [
        "new",
        "contacted",
        "qualified",
        "rejected",
        "converted",
      ] as const;

      for (const status of statuses) {
        const query: ListLeadsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: {
            status,
          },
          sortOrder: "desc",
        };

        const result = await listLeads(context, query);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });

    it("should handle various source filters", async () => {
      const sources = [
        "website",
        "email",
        "phone",
        "referral",
        "social",
        "advertisement",
        "other",
      ];

      for (const source of sources) {
        const query: ListLeadsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: {
            source,
          },
          sortOrder: "desc",
        };

        const result = await listLeads(context, query);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("count");
      }
    });
  });
});
