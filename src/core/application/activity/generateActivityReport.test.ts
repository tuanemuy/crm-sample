import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { createActivity } from "./createActivity";
import type { GenerateActivityReportInput } from "./generateActivityReport";
import { generateActivityReport } from "./generateActivityReport";

let db: Database;
let context: Context;

/**
 * generateActivityReport関数の基本的なテスト
 *
 * その他のテストは関心事別に以下のファイルに分割されています：
 * - generateActivityReport.validation.test.ts: 入力検証
 * - generateActivityReport.empty-report.test.ts: 空レポート生成
 * - generateActivityReport.statistics.test.ts: 統計計算
 * - generateActivityReport.filtering.test.ts: フィルタリング
 * - generateActivityReport.sections.test.ts: レポートセクション
 * - generateActivityReport.edge-cases.test.ts: エッジケース
 */
describe("generateActivityReport", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("基本的なレポート生成", () => {
    it("1件の活動が存在する場合、その活動を含むレポートが生成されること", async () => {
      // テスト用ユーザーを作成
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // 活動を作成
      const scheduledDate = new Date("2024-06-15T10:00:00Z");
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Test Call",
          description: "Test call description",
          priority: "high",
          scheduledAt: scheduledDate,
          duration: 30,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);

      const input: GenerateActivityReportInput = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        includeUserPerformance: true,
        includeDailyBreakdown: true,
        includeTopActivities: true,
        topActivitiesLimit: 20,
      };

      const result = await generateActivityReport(context, input);

      expect(result.isOk()).toBe(true);
      const report = result._unsafeUnwrap();

      // レポートに1件の活動が含まれることを検証
      expect(report.reportMetadata.totalActivities).toBe(1);
      expect(report.summary.totalActivities).toBe(1);
      expect(report.summary.pendingActivities).toBe(1);
      expect(report.summary.completedActivities).toBe(0);
      expect(report.summary.cancelledActivities).toBe(0);
      expect(report.summary.completionRate).toBe(0);
      expect(report.summary.averageDuration).toBe(30);

      // 活動タイプ別の集計を検証
      const callType = report.activityByType.find((t) => t.type === "call");
      expect(callType).toBeDefined();
      expect(callType?.count).toBe(1);

      // 優先度別の集計を検証
      const highPriority = report.activityByPriority.find(
        (p) => p.priority === "high",
      );
      expect(highPriority).toBeDefined();
      expect(highPriority?.count).toBe(1);
    });

    it("複数の活動が存在する場合、すべての活動を含むレポートが生成されること", async () => {
      // テスト用ユーザーを作成
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // 複数の活動を作成
      const activities = [
        {
          type: "call" as const,
          subject: "Call 1",
          priority: "high" as const,
          scheduledAt: new Date("2024-06-15T10:00:00Z"),
        },
        {
          type: "email" as const,
          subject: "Email 1",
          priority: "medium" as const,
          scheduledAt: new Date("2024-06-16T10:00:00Z"),
        },
        {
          type: "meeting" as const,
          subject: "Meeting 1",
          priority: "low" as const,
          scheduledAt: new Date("2024-06-17T10:00:00Z"),
        },
      ];

      for (const activity of activities) {
        const result = await createActivity(
          context,
          { ...activity, assignedUserId: user.id },
          user.id,
        );
        expect(result.isOk()).toBe(true);
      }

      const input: GenerateActivityReportInput = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      const result = await generateActivityReport(context, input);

      expect(result.isOk()).toBe(true);
      const report = result._unsafeUnwrap();

      // 3件の活動が含まれることを検証
      expect(report.reportMetadata.totalActivities).toBe(3);
      expect(report.summary.totalActivities).toBe(3);

      // 各活動タイプが含まれることを検証
      expect(report.activityByType).toHaveLength(3);
      expect(report.activityByType.map((t) => t.type).sort()).toEqual([
        "call",
        "email",
        "meeting",
      ]);

      // 各優先度が含まれることを検証
      expect(report.activityByPriority).toHaveLength(3);
      expect(report.activityByPriority.map((p) => p.priority).sort()).toEqual([
        "high",
        "low",
        "medium",
      ]);
    });
  });
});
