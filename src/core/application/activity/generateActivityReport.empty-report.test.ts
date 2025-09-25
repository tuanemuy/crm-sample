import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { GenerateActivityReportInput } from "./generateActivityReport";
import { generateActivityReport } from "./generateActivityReport";

let db: Database;
let context: Context;

describe("generateActivityReport - Empty Report", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("データが存在しない場合のレポート生成", () => {
    it("活動が1件も存在しない場合でも正常にレポートが生成されること", async () => {
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

      // レポートのメタデータが0件を示すことを検証
      expect(report.reportMetadata.totalActivities).toBe(0);

      // サマリーがすべて0件を示すことを検証
      expect(report.summary.totalActivities).toBe(0);
      expect(report.summary.completedActivities).toBe(0);
      expect(report.summary.pendingActivities).toBe(0);
      expect(report.summary.cancelledActivities).toBe(0);
      expect(report.summary.completionRate).toBe(0);
      expect(report.summary.averageDuration).toBe(0);

      // 各セクションが空であることを検証
      expect(report.activityByType).toHaveLength(0);
      expect(report.activityByPriority).toHaveLength(0);
      expect(report.userPerformance).toHaveLength(0);
      expect(report.dailyActivity).toHaveLength(0);
      expect(report.topActivities).toHaveLength(0);
    });
  });
});
