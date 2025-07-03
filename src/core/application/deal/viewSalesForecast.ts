import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Sales forecast data schema
export const salesForecastSchema = z.object({
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  totalPipelineValue: z.string(),
  weightedPipelineValue: z.string(),
  stageBreakdown: z.array(
    z.object({
      stage: z.string(),
      dealCount: z.number(),
      totalValue: z.string(),
      weightedValue: z.string(),
      averageProbability: z.number(),
    }),
  ),
  monthlyForecast: z.array(
    z.object({
      month: z.string(),
      totalValue: z.string(),
      weightedValue: z.string(),
      dealCount: z.number(),
      averageCloseRate: z.number(),
    }),
  ),
  topDeals: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      amount: z.string(),
      probability: z.number(),
      stage: z.string(),
      expectedCloseDate: z.date().optional(),
      customer: z.object({
        id: z.string(),
        name: z.string(),
      }),
    }),
  ),
  trends: z.object({
    dealVelocity: z.number(), // Average days in pipeline
    conversionRates: z.record(z.string(), z.number()),
    averageDealSize: z.string(),
    winRate: z.number(),
  }),
});

export type SalesForecast = z.infer<typeof salesForecastSchema>;

// Input schema for sales forecast request
export const viewSalesForecastInputSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  includeMonthlyBreakdown: z.boolean().default(true),
  includeTopDeals: z.boolean().default(true),
  topDealsLimit: z.number().int().min(1).max(50).default(10),
  assignedUserId: z.string().uuid().optional(),
});

export type ViewSalesForecastInput = z.infer<
  typeof viewSalesForecastInputSchema
>;

export async function viewSalesForecast(
  context: Context,
  input: ViewSalesForecastInput = {
    includeMonthlyBreakdown: true,
    includeTopDeals: true,
    topDealsLimit: 10,
  },
): Promise<Result<SalesForecast, ApplicationError>> {
  // Validate input
  const validationResult = validate(viewSalesForecastInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for sales forecast",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Set default date range if not provided (next 3 months)
  const defaultStartDate = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);

  const startDate = validInput.startDate || defaultStartDate;
  const endDate = validInput.endDate || defaultEndDate;

  try {
    // Build filter for deals within the forecast period
    const dealFilter = {
      expectedCloseAfter: startDate,
      expectedCloseBefore: endDate,
      assignedUserId: validInput.assignedUserId,
    };

    // Get deals for the forecast period
    const dealsResult = await context.dealRepository.list({
      pagination: {
        page: 1,
        limit: 1000,
        order: "asc",
        orderBy: "expectedCloseDate",
      }, // Get all relevant deals
      filter: dealFilter,
      sortBy: "expectedCloseDate",
      sortOrder: "asc" as const,
    });

    if (dealsResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to fetch deals for forecast",
          dealsResult.error,
        ),
      );
    }

    const deals = dealsResult.value.items;

    // Calculate total pipeline values
    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;

    deals.forEach((deal) => {
      const amount = Number.parseFloat(deal.amount);
      totalPipelineValue += amount;
      weightedPipelineValue += amount * (deal.probability / 100);
    });

    // Calculate stage breakdown
    const stageMap = new Map<
      string,
      {
        dealCount: number;
        totalValue: number;
        totalProbability: number;
      }
    >();

    deals.forEach((deal) => {
      const stage = deal.stage;
      const amount = Number.parseFloat(deal.amount);

      if (!stageMap.has(stage)) {
        stageMap.set(stage, {
          dealCount: 0,
          totalValue: 0,
          totalProbability: 0,
        });
      }

      const stageData = stageMap.get(stage);
      if (!stageData) return;
      stageData.dealCount++;
      stageData.totalValue += amount;
      stageData.totalProbability += deal.probability;
    });

    const stageBreakdown = Array.from(stageMap.entries()).map(
      ([stage, data]) => ({
        stage,
        dealCount: data.dealCount,
        totalValue: data.totalValue.toFixed(2),
        weightedValue: (
          (data.totalValue * (data.totalProbability / data.dealCount)) /
          100
        ).toFixed(2),
        averageProbability: Math.round(data.totalProbability / data.dealCount),
      }),
    );

    // Calculate monthly forecast
    const monthlyMap = new Map<
      string,
      {
        totalValue: number;
        weightedValue: number;
        dealCount: number;
        totalProbability: number;
      }
    >();

    if (validInput.includeMonthlyBreakdown) {
      deals.forEach((deal) => {
        if (!deal.expectedCloseDate) return;

        const monthKey = `${deal.expectedCloseDate.getFullYear()}-${String(deal.expectedCloseDate.getMonth() + 1).padStart(2, "0")}`;
        const amount = Number.parseFloat(deal.amount);

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            totalValue: 0,
            weightedValue: 0,
            dealCount: 0,
            totalProbability: 0,
          });
        }

        const monthData = monthlyMap.get(monthKey);
        if (!monthData) return;
        monthData.totalValue += amount;
        monthData.weightedValue += amount * (deal.probability / 100);
        monthData.dealCount++;
        monthData.totalProbability += deal.probability;
      });
    }

    const monthlyForecast = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        totalValue: data.totalValue.toFixed(2),
        weightedValue: data.weightedValue.toFixed(2),
        dealCount: data.dealCount,
        averageCloseRate: Math.round(data.totalProbability / data.dealCount),
      }),
    );

    // Get top deals by weighted value
    const topDeals = validInput.includeTopDeals
      ? deals
          .map((deal) => ({
            ...deal,
            weightedAmount:
              Number.parseFloat(deal.amount) * (deal.probability / 100),
          }))
          .sort((a, b) => b.weightedAmount - a.weightedAmount)
          .slice(0, validInput.topDealsLimit)
          .map((deal) => ({
            id: deal.id,
            title: deal.title,
            amount: deal.amount,
            probability: deal.probability,
            stage: deal.stage,
            expectedCloseDate: deal.expectedCloseDate,
            customer: {
              id: deal.customerId,
              name: `Customer ${deal.customerId}`, // Simplified - in real app, would join with customer data
            },
          }))
      : [];

    // Calculate trends (simplified calculations)
    const activeDeals = deals.filter(
      (deal) => deal.stage !== "closed_won" && deal.stage !== "closed_lost",
    );
    const wonDeals = deals.filter((deal) => deal.stage === "closed_won");

    const trends = {
      dealVelocity: 30, // Simplified - would calculate actual average days in pipeline
      conversionRates: {
        prospecting: 0.2,
        qualification: 0.4,
        proposal: 0.6,
        negotiation: 0.8,
      },
      averageDealSize:
        activeDeals.length > 0
          ? (totalPipelineValue / activeDeals.length).toFixed(2)
          : "0",
      winRate: deals.length > 0 ? wonDeals.length / deals.length : 0,
    };

    const forecast: SalesForecast = {
      period: {
        startDate,
        endDate,
      },
      totalPipelineValue: totalPipelineValue.toFixed(2),
      weightedPipelineValue: weightedPipelineValue.toFixed(2),
      stageBreakdown,
      monthlyForecast,
      topDeals,
      trends,
    };

    return ok(forecast);
  } catch (error) {
    return err(
      new ApplicationError("Failed to generate sales forecast", error),
    );
  }
}
