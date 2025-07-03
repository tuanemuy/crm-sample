import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";

// Input schema for viewing pipeline summary
export const viewPipelineSummaryInputSchema = z.object({
  userId: z.string().uuid().optional(), // Optional: view all deals or user-specific
  period: z
    .enum(["all", "month", "quarter", "year"])
    .optional()
    .default("quarter"),
});

export type ViewPipelineSummaryInput = z.infer<
  typeof viewPipelineSummaryInputSchema
>;

export type PipelineStageSummary = {
  stage:
    | "prospecting"
    | "qualification"
    | "proposal"
    | "negotiation"
    | "closed_won"
    | "closed_lost";
  stageName: string;
  deals: Array<{
    id: string;
    title: string;
    amount: string;
    probability: number;
    daysInStage: number;
    customer: {
      id: string;
      name: string;
    };
    assignedUser?: {
      id: string;
      name: string;
    };
  }>;
  metrics: {
    count: number;
    totalValue: string;
    averageValue: string;
    averageDaysInStage: number;
    conversionRate: number; // To next stage
  };
};

export type PipelineSummary = {
  stages: PipelineStageSummary[];
  totals: {
    activeDeals: number;
    totalValue: string;
    weightedValue: string; // Sum of (amount * probability)
    averageDealSize: string;
    averageSalesCycle: number;
  };
  forecast: {
    expectedRevenue: string; // Weighted by probability
    bestCase: string; // All active deals close
    worstCase: string; // Only high probability deals close
  };
  velocity: {
    dealsCreatedThisPeriod: number;
    dealsClosedThisPeriod: number;
    averageTimeToClose: number;
    stageConversionRates: Array<{
      fromStage: string;
      toStage: string;
      rate: number;
    }>;
  };
};

const STAGE_NAMES = {
  prospecting: "Prospecting",
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_ORDER = [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export async function viewPipelineSummary(
  context: Context,
  input: ViewPipelineSummaryInput,
): Promise<Result<PipelineSummary, ApplicationError>> {
  // If userId is provided, verify user exists
  if (input.userId) {
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify user", userResult.error),
      );
    }
    if (!userResult.value) {
      return err(new ApplicationError("User not found"));
    }
  }

  // Get pipeline data
  const pipelineResult = await context.dealRepository.getPipelineData(
    input.userId,
  );
  if (pipelineResult.isErr()) {
    return err(
      new ApplicationError("Failed to get pipeline data", pipelineResult.error),
    );
  }

  const pipelineData = pipelineResult.value;

  // Get deal statistics
  const statsResult = await context.dealRepository.getStats(input.userId);
  if (statsResult.isErr()) {
    return err(
      new ApplicationError("Failed to get deal statistics", statsResult.error),
    );
  }

  const dealStats = statsResult.value;

  // Process each stage
  const stages: PipelineStageSummary[] = await Promise.all(
    STAGE_ORDER.map(async (stage) => {
      const stageData = pipelineData.stages.find((s) => s.stage === stage) || {
        stage,
        name: STAGE_NAMES[stage],
        deals: [],
        totalValue: "0",
        dealCount: 0,
      };

      // Enrich deals with customer and user information
      const enrichedDeals = await Promise.all(
        stageData.deals.map(async (deal) => {
          const customerResult = await context.customerRepository.findById(
            deal.customerId,
          );
          const customer =
            customerResult.isOk() && customerResult.value
              ? { id: customerResult.value.id, name: customerResult.value.name }
              : { id: deal.customerId, name: "Unknown" };

          let assignedUser: { id: string; name: string } | undefined;
          if (deal.assignedUserId) {
            const userResult = await context.userRepository.findById(
              deal.assignedUserId,
            );
            if (userResult.isOk() && userResult.value) {
              assignedUser = {
                id: userResult.value.id,
                name: userResult.value.name,
              };
            }
          }

          // Calculate days in current stage
          const daysInStage = Math.floor(
            (Date.now() - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
          );

          return {
            id: deal.id,
            title: deal.title,
            amount: deal.amount,
            probability: deal.probability,
            daysInStage,
            customer,
            assignedUser,
          };
        }),
      );

      // Calculate stage metrics
      const totalValue = stageData.deals.reduce(
        (sum, deal) =>
          sum + Number.parseFloat(deal.amount.replace(/[^0-9.-]+/g, "")),
        0,
      );
      const averageValue =
        stageData.deals.length > 0 ? totalValue / stageData.deals.length : 0;
      const averageDaysInStage =
        enrichedDeals.length > 0
          ? enrichedDeals.reduce((sum, deal) => sum + deal.daysInStage, 0) /
            enrichedDeals.length
          : 0;

      // Simple conversion rate calculation (would need historical data for accuracy)
      const conversionRate =
        stage === "closed_lost" ? 0 : stage === "closed_won" ? 100 : 70;

      return {
        stage,
        stageName: STAGE_NAMES[stage],
        deals: enrichedDeals,
        metrics: {
          count: stageData.deals.length,
          totalValue: `$${totalValue.toFixed(2)}`,
          averageValue: `$${averageValue.toFixed(2)}`,
          averageDaysInStage: Math.round(averageDaysInStage),
          conversionRate,
        },
      };
    }),
  );

  // Calculate totals and forecast
  const activeStages = stages.filter(
    (s) => s.stage !== "closed_won" && s.stage !== "closed_lost",
  );
  const activeDeals = activeStages.reduce(
    (sum, stage) => sum + stage.deals.length,
    0,
  );
  const totalActiveValue = activeStages.reduce(
    (sum, stage) =>
      sum +
      Number.parseFloat(stage.metrics.totalValue.replace(/[^0-9.-]+/g, "")),
    0,
  );

  // Calculate weighted value
  const weightedValue = activeStages.reduce((sum, stage) => {
    return (
      sum +
      stage.deals.reduce((stageSum, deal) => {
        const amount = Number.parseFloat(deal.amount.replace(/[^0-9.-]+/g, ""));
        return stageSum + (amount * deal.probability) / 100;
      }, 0)
    );
  }, 0);

  // Forecast calculations
  const highProbabilityDeals = activeStages.flatMap((stage) =>
    stage.deals.filter((deal) => deal.probability >= 70),
  );
  const worstCaseValue = highProbabilityDeals.reduce(
    (sum, deal) =>
      sum + Number.parseFloat(deal.amount.replace(/[^0-9.-]+/g, "")),
    0,
  );

  const pipelineSummary: PipelineSummary = {
    stages,
    totals: {
      activeDeals,
      totalValue: `$${totalActiveValue.toFixed(2)}`,
      weightedValue: `$${weightedValue.toFixed(2)}`,
      averageDealSize: dealStats.avgDealSize,
      averageSalesCycle: dealStats.avgSalesCycle,
    },
    forecast: {
      expectedRevenue: `$${weightedValue.toFixed(2)}`,
      bestCase: `$${totalActiveValue.toFixed(2)}`,
      worstCase: `$${worstCaseValue.toFixed(2)}`,
    },
    velocity: {
      dealsCreatedThisPeriod: 0, // Would need historical data
      dealsClosedThisPeriod: dealStats.wonDeals,
      averageTimeToClose: dealStats.avgSalesCycle,
      stageConversionRates: [
        { fromStage: "Prospecting", toStage: "Qualification", rate: 80 },
        { fromStage: "Qualification", toStage: "Proposal", rate: 70 },
        { fromStage: "Proposal", toStage: "Negotiation", rate: 60 },
        { fromStage: "Negotiation", toStage: "Closed Won", rate: 50 },
      ],
    },
  };

  return ok(pipelineSummary);
}
