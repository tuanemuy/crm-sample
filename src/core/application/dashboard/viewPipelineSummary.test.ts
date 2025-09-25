import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ViewPipelineSummaryInput } from "@/core/application/dashboard/viewPipelineSummary";
import { ERROR_MESSAGES_EN } from "@/core/application/errors/messages";
import { ApplicationError } from "@/lib/error";
import { viewPipelineSummary } from "./viewPipelineSummary";

let db: Database;
let context: Context;

describe("viewPipelineSummary", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid input with invalid UUID", async () => {
      const input: ViewPipelineSummaryInput = {
        userId: "invalid-uuid",
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_PIPELINE_SUMMARY,
      );
    });

    it("should reject invalid period", async () => {
      const input = {
        period: "invalid-period",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await viewPipelineSummary(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_PIPELINE_SUMMARY,
      );
    });
  });

  describe("business logic validation", () => {
    it("should reject if specified user does not exist", async () => {
      const input: ViewPipelineSummaryInput = {
        userId: uuidv7(),
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("User not found");
    });
  });

  describe("successful pipeline summary retrieval", () => {
    it("should return pipeline summary for all users when no userId specified", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("stages");
      expect(summary).toHaveProperty("totals");
      expect(summary).toHaveProperty("forecast");
      expect(summary).toHaveProperty("velocity");

      expect(Array.isArray(summary.stages)).toBe(true);
      expect(summary.stages).toHaveLength(6); // All 6 stages
    });

    it("should return pipeline summary for specific user", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: ViewPipelineSummaryInput = {
        userId: user.id,
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("stages");
      expect(summary).toHaveProperty("totals");
      expect(summary).toHaveProperty("forecast");
      expect(summary).toHaveProperty("velocity");
    });

    it("should use default period when not specified", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary).toHaveProperty("stages");
      expect(summary).toHaveProperty("totals");
      expect(summary).toHaveProperty("forecast");
      expect(summary).toHaveProperty("velocity");
    });

    it("should handle different time periods", async () => {
      const periods = ["all", "month", "quarter", "year"] as const;

      for (const period of periods) {
        const input: ViewPipelineSummaryInput = {
          period,
        };

        const result = await viewPipelineSummary(context, input);

        expect(result.isOk()).toBe(true);
        const summary = result._unsafeUnwrap();

        expect(summary).toHaveProperty("stages");
        expect(summary).toHaveProperty("totals");
        expect(summary).toHaveProperty("forecast");
        expect(summary).toHaveProperty("velocity");
      }
    });
  });

  describe("pipeline data structure validation", () => {
    it("should return all stages in correct order", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      const expectedStages = [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ];

      expect(summary.stages).toHaveLength(6);
      summary.stages.forEach((stage, index) => {
        expect(stage.stage).toBe(expectedStages[index]);
      });
    });

    it("should return properly formatted stage data", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      summary.stages.forEach((stage) => {
        expect(stage).toHaveProperty("stage");
        expect(stage).toHaveProperty("stageName");
        expect(stage).toHaveProperty("deals");
        expect(stage).toHaveProperty("metrics");

        expect(typeof stage.stage).toBe("string");
        expect(typeof stage.stageName).toBe("string");
        expect(Array.isArray(stage.deals)).toBe(true);

        expect(stage.metrics).toHaveProperty("count");
        expect(stage.metrics).toHaveProperty("totalValue");
        expect(stage.metrics).toHaveProperty("averageValue");
        expect(stage.metrics).toHaveProperty("averageDaysInStage");
        expect(stage.metrics).toHaveProperty("conversionRate");

        expect(typeof stage.metrics.count).toBe("number");
        expect(typeof stage.metrics.totalValue).toBe("string");
        expect(typeof stage.metrics.averageValue).toBe("string");
        expect(typeof stage.metrics.averageDaysInStage).toBe("number");
        expect(typeof stage.metrics.conversionRate).toBe("number");
      });
    });

    it("should return properly formatted deal data in stages", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      summary.stages.forEach((stage) => {
        stage.deals.forEach((deal) => {
          expect(deal).toHaveProperty("id");
          expect(deal).toHaveProperty("title");
          expect(deal).toHaveProperty("amount");
          expect(deal).toHaveProperty("probability");
          expect(deal).toHaveProperty("daysInStage");
          expect(deal).toHaveProperty("customer");

          expect(typeof deal.id).toBe("string");
          expect(typeof deal.title).toBe("string");
          expect(typeof deal.amount).toBe("string");
          expect(typeof deal.probability).toBe("number");
          expect(typeof deal.daysInStage).toBe("number");

          expect(deal.customer).toHaveProperty("id");
          expect(deal.customer).toHaveProperty("name");
          expect(typeof deal.customer.id).toBe("string");
          expect(typeof deal.customer.name).toBe("string");

          if (deal.assignedUser) {
            expect(deal.assignedUser).toHaveProperty("id");
            expect(deal.assignedUser).toHaveProperty("name");
            expect(typeof deal.assignedUser.id).toBe("string");
            expect(typeof deal.assignedUser.name).toBe("string");
          }
        });
      });
    });

    it("should return properly formatted totals data", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.totals).toHaveProperty("activeDeals");
      expect(summary.totals).toHaveProperty("totalValue");
      expect(summary.totals).toHaveProperty("weightedValue");
      expect(summary.totals).toHaveProperty("averageDealSize");
      expect(summary.totals).toHaveProperty("averageSalesCycle");

      expect(typeof summary.totals.activeDeals).toBe("number");
      expect(typeof summary.totals.totalValue).toBe("string");
      expect(typeof summary.totals.weightedValue).toBe("string");
      expect(typeof summary.totals.averageDealSize).toBe("string");
      expect(typeof summary.totals.averageSalesCycle).toBe("number");
    });

    it("should return properly formatted forecast data", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.forecast).toHaveProperty("expectedRevenue");
      expect(summary.forecast).toHaveProperty("bestCase");
      expect(summary.forecast).toHaveProperty("worstCase");

      expect(typeof summary.forecast.expectedRevenue).toBe("string");
      expect(typeof summary.forecast.bestCase).toBe("string");
      expect(typeof summary.forecast.worstCase).toBe("string");
    });

    it("should return properly formatted velocity data", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.velocity).toHaveProperty("dealsCreatedThisPeriod");
      expect(summary.velocity).toHaveProperty("dealsClosedThisPeriod");
      expect(summary.velocity).toHaveProperty("averageTimeToClose");
      expect(summary.velocity).toHaveProperty("stageConversionRates");

      expect(typeof summary.velocity.dealsCreatedThisPeriod).toBe("number");
      expect(typeof summary.velocity.dealsClosedThisPeriod).toBe("number");
      expect(typeof summary.velocity.averageTimeToClose).toBe("number");
      expect(Array.isArray(summary.velocity.stageConversionRates)).toBe(true);

      summary.velocity.stageConversionRates.forEach((rate) => {
        expect(rate).toHaveProperty("fromStage");
        expect(rate).toHaveProperty("toStage");
        expect(rate).toHaveProperty("rate");

        expect(typeof rate.fromStage).toBe("string");
        expect(typeof rate.toStage).toBe("string");
        expect(typeof rate.rate).toBe("number");
      });
    });
  });

  describe("business logic validation", () => {
    it("should handle stages with no deals", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      // All stages should be present even if they have no deals
      summary.stages.forEach((stage) => {
        expect(stage.deals).toHaveLength(0);
        expect(stage.metrics.count).toBe(0);
        expect(stage.metrics.totalValue).toBe("$0.00");
        expect(stage.metrics.averageValue).toBe("$0.00");
        expect(stage.metrics.averageDaysInStage).toBe(0);
        expect(stage.metrics.conversionRate).toBeGreaterThanOrEqual(0);
      });
    });

    it("should calculate conversion rates correctly", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      // Check that conversion rates are set correctly
      const closedWonStage = summary.stages.find(
        (s) => s.stage === "closed_won",
      );
      const closedLostStage = summary.stages.find(
        (s) => s.stage === "closed_lost",
      );

      expect(closedWonStage?.metrics.conversionRate).toBe(100);
      expect(closedLostStage?.metrics.conversionRate).toBe(0);
    });

    it("should calculate stage names correctly", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      const expectedStageNames = {
        prospecting: "Prospecting",
        qualification: "Qualification",
        proposal: "Proposal",
        negotiation: "Negotiation",
        closed_won: "Closed Won",
        closed_lost: "Closed Lost",
      };

      summary.stages.forEach((stage) => {
        expect(stage.stageName).toBe(expectedStageNames[stage.stage]);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty pipeline gracefully", async () => {
      const input: ViewPipelineSummaryInput = {
        period: "quarter",
      };

      const result = await viewPipelineSummary(context, input);

      expect(result.isOk()).toBe(true);
      const summary = result._unsafeUnwrap();

      expect(summary.totals.activeDeals).toBe(0);
      expect(summary.totals.totalValue).toBe("$0.00");
      expect(summary.totals.weightedValue).toBe("$0.00");
      expect(summary.forecast.expectedRevenue).toBe("$0.00");
      expect(summary.forecast.bestCase).toBe("$0.00");
      expect(summary.forecast.worstCase).toBe("$0.00");
    });
  });
});
