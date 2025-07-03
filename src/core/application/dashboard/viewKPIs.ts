import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";

// Input schema for viewing KPIs
export const viewKPIsInputSchema = z.object({
  userId: z.string().uuid().optional(), // Optional: view all KPIs or user-specific
  period: z
    .enum(["today", "week", "month", "quarter", "year"])
    .optional()
    .default("month"),
});

export type ViewKPIsInput = z.infer<typeof viewKPIsInputSchema>;

export type KPISummary = {
  revenue: {
    total: string;
    won: string;
    lost: string;
    pending: string;
    winRate: number;
    averageDealSize: string;
  };
  deals: {
    total: number;
    active: number;
    won: number;
    lost: number;
    averageSalesCycle: number;
  };
  customers: {
    total: number;
    active: number;
    new: number; // New this period
    growthRate: number; // Percentage
  };
  leads: {
    total: number;
    new: number;
    qualified: number;
    converted: number;
    conversionRate: number;
    averageScore: number;
  };
  activity: {
    tasksCompleted: number;
    meetingsHeld: number;
    callsMade: number;
    emailsSent: number;
  };
  topPerformers: Array<{
    userId: string;
    userName: string;
    wonDeals: number;
    revenue: string;
  }>;
};

export async function viewKPIs(
  context: Context,
  input: ViewKPIsInput,
): Promise<Result<KPISummary, ApplicationError>> {
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

  // Fetch all statistics in parallel
  const [dealStatsResult, customerStatsResult, leadStatsResult] =
    await Promise.all([
      context.dealRepository.getStats(input.userId),
      context.customerRepository.getStats(),
      context.leadRepository.getStats(),
    ]);

  // Check for errors
  if (dealStatsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get deal statistics",
        dealStatsResult.error,
      ),
    );
  }
  if (customerStatsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get customer statistics",
        customerStatsResult.error,
      ),
    );
  }
  if (leadStatsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get lead statistics",
        leadStatsResult.error,
      ),
    );
  }

  const dealStats = dealStatsResult.value;
  const customerStats = customerStatsResult.value;
  const leadStats = leadStatsResult.value;

  // Calculate customer growth rate (simplified - would need historical data for accurate calculation)
  const customerGrowthRate = customerStats.recentCustomers.length > 0 ? 10 : 0; // Placeholder

  // Get activity stats (simplified - would need to implement activity stats in repository)
  // For now, using placeholder data
  const activityStats = {
    tasksCompleted: 0,
    meetingsHeld: 0,
    callsMade: 0,
    emailsSent: 0,
  };

  // Build KPI summary
  const kpiSummary: KPISummary = {
    revenue: {
      total: dealStats.totalValue,
      won: dealStats.wonValue,
      lost: dealStats.lostValue,
      pending: (
        Number.parseFloat(dealStats.totalValue.replace(/[^0-9.-]+/g, "")) -
        Number.parseFloat(dealStats.wonValue.replace(/[^0-9.-]+/g, "")) -
        Number.parseFloat(dealStats.lostValue.replace(/[^0-9.-]+/g, ""))
      ).toFixed(2),
      winRate: dealStats.winRate,
      averageDealSize: dealStats.avgDealSize,
    },
    deals: {
      total: dealStats.totalDeals,
      active: dealStats.activeDeals,
      won: dealStats.wonDeals,
      lost: dealStats.lostDeals,
      averageSalesCycle: dealStats.avgSalesCycle,
    },
    customers: {
      total: customerStats.totalCustomers,
      active: customerStats.activeCustomers,
      new: customerStats.recentCustomers.length,
      growthRate: customerGrowthRate,
    },
    leads: {
      total: leadStats.totalLeads,
      new: leadStats.newLeads,
      qualified: leadStats.qualifiedLeads,
      converted: leadStats.convertedLeads,
      conversionRate: leadStats.conversionRate,
      averageScore: leadStats.averageScore,
    },
    activity: activityStats,
    topPerformers: dealStats.topPerformers.map((performer) => ({
      userId: performer.userId,
      userName: performer.userName,
      wonDeals: performer.dealCount,
      revenue: performer.totalValue,
    })),
  };

  return ok(kpiSummary);
}
