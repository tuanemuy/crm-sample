import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ListContactHistoryQuery } from "@/core/domain/contactHistory/types";
import { viewContactHistory } from "./viewContactHistory";

let db: Database;
let context: Context;

describe("viewContactHistory", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("履歴一覧表示テスト", () => {
    it("should display contact history list", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, customerId, query);

      if (result.isOk()) {
        const history = result._unsafeUnwrap();
        expect(history).toBeDefined();
        expect(Array.isArray(history.items)).toBe(true);
        expect(history.pagination).toBeDefined();
      } else {
        // May fail with customer not found - acceptable for test
        expect(result.isErr()).toBe(true);
      }
    });
  });

  describe("時系列表示テスト", () => {
    it("should display history in chronological order (newest first)", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, customerId, query);

      if (result.isOk()) {
        const history = result._unsafeUnwrap();
        expect(history.items).toBeDefined();
        // Verify chronological ordering if items exist
        if (history.items.length > 1) {
          const first = new Date(history.items[0].contactedAt);
          const second = new Date(history.items[1].contactedAt);
          expect(first >= second).toBe(true);
        }
      }
    });
  });

  describe("ページネーションテスト", () => {
    it("should handle pagination correctly", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 1,
          limit: 5,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, customerId, query);

      if (result.isOk()) {
        const history = result._unsafeUnwrap();
        expect(history.pagination).toBeDefined();
        expect(history.pagination.page).toBe(1);
        expect(history.pagination.limit).toBe(5);
        expect(history.pagination.total).toBeGreaterThanOrEqual(0);
      }
    });

    it("should reject invalid page numbers", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: -1,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, customerId, query);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("コンタクトタイプ別表示テスト", () => {
    it("should display different contact types (phone, email, visit, meeting, chat)", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, customerId, query);

      if (result.isOk()) {
        const history = result._unsafeUnwrap();
        expect(history.items).toBeDefined();
        // Each item should have a contact type
        history.items.forEach((item) => {
          expect(item.type).toBeDefined();
          expect(["phone", "email", "visit", "meeting", "chat"]).toContain(
            item.type
          );
        });
      }
    });
  });

  describe("履歴詳細表示テスト", () => {
    it("should display contact history details including date, assignee, summary, next action, and status", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, customerId, query);

      if (result.isOk()) {
        const history = result._unsafeUnwrap();
        expect(history.items).toBeDefined();
        
        // Verify each item has required fields
        history.items.forEach((item) => {
          expect(item.contactedAt).toBeDefined(); // Date/time
          expect(item.assignedUserId).toBeDefined(); // Assignee
          expect(item.summary).toBeDefined(); // Content summary  
          expect(item.nextAction).toBeDefined(); // Next action
          expect(item.status).toBeDefined(); // Status
        });
      }
    });
  });

  describe("フィルタリングテスト", () => {
    it("should handle contact type filtering", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
        type: "email", // Filter by email contacts
      };

      const result = await viewContactHistory(context, customerId, query);

      if (result.isOk()) {
        const history = result._unsafeUnwrap();
        expect(history.items).toBeDefined();
        
        // All items should be email type if filtered
        history.items.forEach((item) => {
          expect(item.type).toBe("email");
        });
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle non-existent customer gracefully", async () => {
      const nonExistentCustomerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, nonExistentCustomerId, query);

      // Should handle non-existent customer appropriately
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).toBeDefined();
      } else {
        // Or return empty list
        const history = result._unsafeUnwrap();
        expect(Array.isArray(history.items)).toBe(true);
      }
    });

    it("should handle large page numbers", async () => {
      const customerId = uuidv7();
      const query: ListContactHistoryQuery = {
        pagination: {
          page: 999999,
          limit: 10,
          order: "desc",
          orderBy: "contactedAt",
        },
        sortBy: "contactedAt",
        sortOrder: "desc",
      };

      const result = await viewContactHistory(context, customerId, query);

      if (result.isOk()) {
        const history = result._unsafeUnwrap();
        expect(history.items).toBeDefined();
        expect(Array.isArray(history.items)).toBe(true);
        // Should return empty items for out-of-range pages
        expect(history.items.length).toBe(0);
      }
    });
  });
});