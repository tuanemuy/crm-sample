import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { ListContactsQuery } from "@/core/domain/contact/types";
import { ApplicationError } from "@/lib/error";
import { listContacts } from "./listContacts";

let db: Database;
let context: Context;

/**
 * listContacts関数の入力検証テスト
 *
 * その他のテストは以下のファイルに分割されています：
 * - listContacts.test.ts: 基本的な機能テスト
 * - listContacts.pagination.test.ts: ページネーション機能
 * - listContacts.filtering.test.ts: フィルタリング機能
 * - listContacts.edge-cases.test.ts: エッジケース
 */
describe("listContacts - Input Validation", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("pagination validation", () => {
    it("should reject invalid pagination parameters", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: -1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });

    it("should reject zero page number", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 0,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });

    it("should reject zero limit", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 0,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });

    it("should reject limit exceeding maximum", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 1001,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });

    it("should reject invalid sort order", async () => {
      const query = {
        pagination: {
          page: 1,
          limit: 10,
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
          order: "invalid" as any,
          orderBy: "name",
        },
        sortOrder: "asc" as const,
      };

      const result = await listContacts(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });
  });

  describe("filter validation", () => {
    it("should reject invalid filter with invalid UUID", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
        filter: {
          customerId: "invalid-uuid",
        },
      };

      const result = await listContacts(context, query);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.VALIDATION_ERROR,
      );
    });

    it("should accept valid query", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
    });
  });
});
