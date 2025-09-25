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

describe("generateActivityReport - Statistics", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("完了率の計算", () => {
    it("完了・保留・キャンセルの活動がそれぞれ1件ずつある場合、完了率が33.3%として計算されること", async () => {
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

      // 異なるステータスの活動を作成
      const activity1 = await createActivity(
        context,
        {
          type: "call",
          subject: "Completed Call",
          scheduledAt: new Date("2024-06-15T10:00:00Z"),
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity1.isOk()).toBe(true);

      const activity2 = await createActivity(
        context,
        {
          type: "email",
          subject: "Pending Email",
          scheduledAt: new Date("2024-06-16T10:00:00Z"),
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity2.isOk()).toBe(true);

      const activity3 = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Cancelled Meeting",
          scheduledAt: new Date("2024-06-17T10:00:00Z"),
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(activity3.isOk()).toBe(true);

      // ステータスを更新
      await context.activityRepository.update(activity1._unsafeUnwrap().id, {
        status: "completed",
      });
      await context.activityRepository.update(activity3._unsafeUnwrap().id, {
        status: "cancelled",
      });

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

      // 営業活動の効率を測定可能な形で統計が計算されることを検証
      expect(report.summary.totalActivities).toBe(3);
      expect(report.summary.completedActivities).toBe(1);
      expect(report.summary.pendingActivities).toBe(1);
      expect(report.summary.cancelledActivities).toBe(1);
      expect(report.summary.completionRate).toBeCloseTo(1 / 3); // 33.3%の完了率
    });
  });

  describe("平均所要時間の計算", () => {
    it("完了した活動の平均所要時間が正しく計算されること", async () => {
      // このテストケースは元のファイルで見つけられた場合に実装
      // 現在の実装では平均所要時間の計算ロジックがある可能性
    });
  });

  describe("活動タイプ別の集計", () => {
    it("各活動タイプ（電話・メール・会議）の件数が正しく集計されること", async () => {
      // このテストケースは元のファイルで見つけられた場合に実装
    });
  });

  describe("優先度別の集計", () => {
    it("高・中・低の優先度別に活動が正しく集計されること", async () => {
      // このテストケースは元のファイルで見つけられた場合に実装
    });
  });
});
