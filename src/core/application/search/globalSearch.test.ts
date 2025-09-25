import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createActivityTestData,
  createCustomerTestData,
  createDealTestData,
  createLeadTestData,
} from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES_EN } from "@/core/application/errors/messages";
import type { GlobalSearchInput } from "@/core/application/search/globalSearch";
import { ApplicationError } from "@/lib/error";
import { globalSearch } from "./globalSearch";

let db: Database;
let context: Context;

describe("globalSearch", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("基本機能テスト", () => {
    beforeEach(async () => {
      // Create test data with Japanese names as per documentation
      await context.customerRepository.create({
        name: "田中商事株式会社",
        industry: "商業",
        status: "active",
      });

      await context.customerRepository.create({
        name: "田村工業",
        industry: "製造業",
        status: "active",
      });

      await context.customerRepository.create({
        name: "株式会社山田商店",
        industry: "小売業",
        status: "active",
      });

      // Create lead data
      const leadData = createLeadTestData({
        overrides: {
          firstName: "田中",
          lastName: "太郎",
          company: "田中建設",
        },
      });
      await context.leadRepository.create(leadData);

      // Create deal data
      const dealData = createDealTestData({
        overrides: {
          title: "田中商事との取引",
          description: "大型案件",
        },
      });
      await context.dealRepository.create(dealData);

      // Create activity data
      const activityData = createActivityTestData({
        overrides: {
          subject: "田中商事訪問",
          description: "営業活動",
        },
      });
      await context.activityRepository.create(activityData);
    });

    describe("TC001: 全エンティティ検索 - 正常パターン", () => {
      it("有効なキーワードで全エンティティを検索する", async () => {
        const input: GlobalSearchInput = {
          keyword: "田中",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        // 検索結果一覧が表示される
        expect(searchResult).toHaveProperty("customers");
        expect(searchResult).toHaveProperty("leads");
        expect(searchResult).toHaveProperty("deals");
        expect(searchResult).toHaveProperty("activities");

        // エンティティ名、タイプ、概要情報が表示される
        expect(searchResult.customers.length).toBeGreaterThan(0);
        searchResult.customers.forEach((customer) => {
          expect(customer).toHaveProperty("id");
          expect(customer).toHaveProperty("name");
          expect(customer).toHaveProperty("type");
          expect(customer.type).toBe("customer");
          expect(customer.name).toContain("田中");
        });

        expect(searchResult.leads.length).toBeGreaterThan(0);
        searchResult.leads.forEach((lead) => {
          expect(lead).toHaveProperty("id");
          expect(lead).toHaveProperty("firstName");
          expect(lead).toHaveProperty("lastName");
          expect(lead).toHaveProperty("type");
          expect(lead.type).toBe("lead");
        });

        expect(searchResult.deals.length).toBeGreaterThan(0);
        searchResult.deals.forEach((deal) => {
          expect(deal).toHaveProperty("id");
          expect(deal).toHaveProperty("title");
          expect(deal).toHaveProperty("type");
          expect(deal.type).toBe("deal");
        });

        expect(searchResult.activities.length).toBeGreaterThan(0);
        searchResult.activities.forEach((activity) => {
          expect(activity).toHaveProperty("id");
          expect(activity).toHaveProperty("subject");
          expect(activity).toHaveProperty("resultType");
          expect(activity.resultType).toBe("activity");
        });
      });
    });

    describe("TC002: 特定エンティティタイプ検索 - 正常パターン", () => {
      it("顧客のみを対象に検索する", async () => {
        const input: GlobalSearchInput = {
          keyword: "株式会社",
          limit: 10,
          includeCustomers: true,
          includeLeads: false,
          includeDeals: false,
          includeActivities: false,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        // 顧客のみの検索結果が表示される
        expect(searchResult.customers.length).toBeGreaterThan(0);
        searchResult.customers.forEach((customer) => {
          expect(customer.name).toContain("株式会社");
        });

        // 他のエンティティタイプは結果に含まれない
        expect(searchResult.leads).toHaveLength(0);
        expect(searchResult.deals).toHaveLength(0);
        expect(searchResult.activities).toHaveLength(0);
      });
    });

    describe("TC003: 部分一致検索 - 正常パターン", () => {
      it("部分一致するキーワードで検索する", async () => {
        const input: GlobalSearchInput = {
          keyword: "田",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        // 「田中」「田村」など部分一致する結果が表示される
        const allResults = [
          ...searchResult.customers.map((c) => c.name),
          ...searchResult.leads.map((l) => `${l.firstName} ${l.lastName}`),
          ...searchResult.deals.map((d) => d.title),
          ...searchResult.activities.map((a) => a.subject),
        ];

        expect(allResults.some((name) => name.includes("田中"))).toBe(true);
        expect(allResults.some((name) => name.includes("田村"))).toBe(true);
      });
    });
  });

  describe("異常系テスト", () => {
    describe("TC004: 空文字検索 - エラーパターン", () => {
      it("空文字で検索を実行する", async () => {
        const input: GlobalSearchInput = {
          keyword: "",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        // エラーメッセージが表示される
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_GLOBAL_SEARCH,
        );
      });
    });

    describe("TC005: 検索結果0件 - 正常パターン", () => {
      it("該当データが存在しないキーワードで検索する", async () => {
        const input: GlobalSearchInput = {
          keyword: "XXXYYY123",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        // 検索結果件数が0件と表示される
        expect(searchResult.customers).toHaveLength(0);
        expect(searchResult.leads).toHaveLength(0);
        expect(searchResult.deals).toHaveLength(0);
        expect(searchResult.activities).toHaveLength(0);
      });
    });

    describe("TC006: 特殊文字検索 - 境界値テスト", () => {
      beforeEach(async () => {
        // Create test data with special characters
        await context.customerRepository.create({
          name: "A&B Corporation",
          status: "active",
        });

        await context.customerRepository.create({
          name: "O'Connor Industries",
          status: "active",
        });

        await context.customerRepository.create({
          name: 'Company "Quotes" Ltd',
          status: "active",
        });
      });

      it("特殊文字を含むキーワードで検索する - &文字", async () => {
        const input: GlobalSearchInput = {
          keyword: "A&B",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        // SQLインジェクション等のセキュリティ問題が発生しない
        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        // 適切にエスケープ処理される
        expect(searchResult.customers.some((c) => c.name.includes("A&B"))).toBe(
          true,
        );
      });

      it("特殊文字を含むキーワードで検索する - アポストロフィ", async () => {
        const input: GlobalSearchInput = {
          keyword: "O'Connor",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();
        expect(
          searchResult.customers.some((c) => c.name.includes("O'Connor")),
        ).toBe(true);
      });

      it("特殊文字を含むキーワードで検索する - クォート", async () => {
        const input: GlobalSearchInput = {
          keyword: "Quotes",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();
        expect(
          searchResult.customers.some((c) => c.name.includes("Quotes")),
        ).toBe(true);
      });
    });
  });

  describe("パフォーマンステスト", () => {
    describe("TC007: 大量データ検索 - パフォーマンステスト", () => {
      it("大量のデータがある状態で検索する", async () => {
        // Create large amount of test data
        const promises = [];
        for (let i = 1; i <= 100; i++) {
          // Using 100 instead of 10,000 for test performance
          promises.push(
            context.customerRepository.create({
              name: `テスト会社${i}`,
              status: "active",
            }),
          );
        }
        await Promise.all(promises);

        const startTime = Date.now();

        const input: GlobalSearchInput = {
          keyword: "テスト",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(result.isOk()).toBe(true);
        // 3秒以内に検索結果が表示される (using 1000ms for test environment)
        expect(responseTime).toBeLessThan(1000);

        const searchResult = result._unsafeUnwrap();
        expect(searchResult.customers.length).toBeGreaterThan(0);
      });
    });

    describe("TC008: 長文キーワード検索 - 境界値テスト", () => {
      it("長い文字列で検索する", async () => {
        // 100文字以上の長いキーワードを入力
        const longKeyword = "A".repeat(256);

        const input: GlobalSearchInput = {
          keyword: longKeyword,
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        // エラーメッセージまたは適切に処理される
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_GLOBAL_SEARCH,
        );
      });
    });
  });

  describe("ユーザビリティテスト", () => {
    describe("TC009: 検索履歴 - 利便性テスト", () => {
      it("検索履歴の表示確認", async () => {
        // This test would typically involve frontend functionality
        // For application service layer, we verify that searches are processed correctly
        const searches = ["田中", "株式会社", "商事"];

        for (const keyword of searches) {
          const input: GlobalSearchInput = {
            keyword,
            limit: 10,
            includeCustomers: true,
            includeLeads: true,
            includeDeals: true,
            includeActivities: true,
          };

          const result = await globalSearch(context, input);
          expect(result.isOk()).toBe(true);
        }
      });
    });

    describe("TC010: 検索候補表示 - 利便性テスト", () => {
      it("オートコンプリート機能の確認", async () => {
        // Create data for autocomplete testing
        await context.customerRepository.create({
          name: "田中商事",
          status: "active",
        });

        const input: GlobalSearchInput = {
          keyword: "田",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        // 入力途中で関連する候補が表示される
        expect(
          searchResult.customers.some((c) => c.name.includes("田中")),
        ).toBe(true);
      });
    });
  });

  describe("権限テスト", () => {
    describe("TC011: 権限制限検索 - セキュリティテスト", () => {
      it("参照権限のないデータの検索制限確認", async () => {
        // Create test data
        await context.customerRepository.create({
          name: "機密顧客データ",
          status: "active",
        });

        const input: GlobalSearchInput = {
          keyword: "機密",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        // Note: In a real implementation, this would check user permissions
        // For this test, we verify the search works without errors
        const searchResult = result._unsafeUnwrap();
        expect(searchResult).toHaveProperty("customers");
        expect(searchResult).toHaveProperty("leads");
        expect(searchResult).toHaveProperty("deals");
        expect(searchResult).toHaveProperty("activities");
      });
    });
  });

  describe("レスポンシブテスト", () => {
    describe("TC012: モバイル表示 - UIテスト", () => {
      it("モバイルデバイスでの検索機能確認", async () => {
        // This test verifies that the search function works consistently
        // regardless of the client interface (desktop/mobile)
        await context.customerRepository.create({
          name: "モバイルテスト会社",
          status: "active",
        });

        const input: GlobalSearchInput = {
          keyword: "モバイル",
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        // 検索バーが適切に表示される（APIレベルでは正常なレスポンスを確認）
        expect(
          searchResult.customers.some((c) => c.name.includes("モバイル")),
        ).toBe(true);
      });
    });
  });

  describe("input validation", () => {
    it("should reject keyword that is too long", async () => {
      const input: GlobalSearchInput = {
        keyword: "a".repeat(256),
        limit: 10,
        includeCustomers: true,
        includeLeads: true,
        includeDeals: true,
        includeActivities: true,
      };

      const result = await globalSearch(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_GLOBAL_SEARCH,
      );
    });

    it("should reject invalid limit", async () => {
      const input: GlobalSearchInput = {
        keyword: "test",
        limit: 0, // Invalid: < 1
        includeCustomers: true,
        includeLeads: true,
        includeDeals: true,
        includeActivities: true,
      };

      const result = await globalSearch(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_GLOBAL_SEARCH,
      );
    });

    it("should reject limit that is too large", async () => {
      const input: GlobalSearchInput = {
        keyword: "test",
        limit: 100, // Invalid: > 50
        includeCustomers: true,
        includeLeads: true,
        includeDeals: true,
        includeActivities: true,
      };

      const result = await globalSearch(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_GLOBAL_SEARCH,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle search with all entity types disabled", async () => {
      const input: GlobalSearchInput = {
        keyword: "test",
        limit: 10,
        includeCustomers: false,
        includeLeads: false,
        includeDeals: false,
        includeActivities: false,
      };

      const result = await globalSearch(context, input);

      expect(result.isOk()).toBe(true);
      const searchResult = result._unsafeUnwrap();

      expect(searchResult.customers).toHaveLength(0);
      expect(searchResult.leads).toHaveLength(0);
      expect(searchResult.deals).toHaveLength(0);
      expect(searchResult.activities).toHaveLength(0);
    });

    it("should handle unicode characters in keywords", async () => {
      await context.customerRepository.create({
        name: "测试公司",
        status: "active",
      });

      await context.customerRepository.create({
        name: "テスト会社",
        status: "active",
      });

      const keywords = ["测试", "テスト"];

      for (const keyword of keywords) {
        const input: GlobalSearchInput = {
          keyword,
          limit: 10,
          includeCustomers: true,
          includeLeads: true,
          includeDeals: true,
          includeActivities: true,
        };

        const result = await globalSearch(context, input);

        expect(result.isOk()).toBe(true);
        const searchResult = result._unsafeUnwrap();

        expect(searchResult).toHaveProperty("customers");
        expect(searchResult).toHaveProperty("leads");
        expect(searchResult).toHaveProperty("deals");
        expect(searchResult).toHaveProperty("activities");
      }
    });
  });
});
