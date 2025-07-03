import { and, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ReportRepository } from "@/core/domain/report/ports/reportRepository";
import type {
  CreateReportParams,
  FavoriteReport,
  GenerateReportQuery,
  ListFavoriteReportsQuery,
  ListReportsQuery,
  Report,
  ReportData,
  ReportFilter,
  UpdateReportParams,
} from "@/core/domain/report/types";
import { favoriteReportSchema, reportSchema } from "@/core/domain/report/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import {
  activities,
  customers,
  deals,
  favoriteReports,
  leads,
  reports,
  users,
} from "./schema";

export class DrizzlePqliteReportRepository implements ReportRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateReportParams,
  ): Promise<Result<Report, RepositoryError>> {
    try {
      const result = await this.db.insert(reports).values(params).returning();

      const report = result[0];
      if (!report) {
        return err(new RepositoryError("Failed to create report"));
      }

      return validate(reportSchema, report).mapErr((error) => {
        return new RepositoryError("Invalid report data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create report", error));
    }
  }

  async update(
    params: UpdateReportParams,
  ): Promise<Result<Report, RepositoryError>> {
    try {
      const { id, ...updateData } = params;
      const result = await this.db
        .update(reports)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(reports.id, id))
        .returning();

      const report = result[0];
      if (!report) {
        return err(new RepositoryError("Report not found"));
      }

      return validate(reportSchema, report).mapErr((error) => {
        return new RepositoryError("Invalid report data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update report", error));
    }
  }

  async findById(id: string): Promise<Result<Report | null, RepositoryError>> {
    try {
      const report = await this.db
        .select()
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);

      if (report.length === 0) {
        return ok(null);
      }

      return validate(reportSchema, report[0]).mapErr((error) => {
        return new RepositoryError("Invalid report data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find report", error));
    }
  }

  async list(
    query: ListReportsQuery,
  ): Promise<Result<{ items: Report[]; count: number }, RepositoryError>> {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.type ? eq(reports.type, filter.type) : undefined,
      filter?.category ? eq(reports.category, filter.category) : undefined,
      filter?.isTemplate !== undefined
        ? eq(reports.isTemplate, filter.isTemplate)
        : undefined,
      filter?.isPublic !== undefined
        ? eq(reports.isPublic, filter.isPublic)
        : undefined,
      filter?.createdBy ? eq(reports.createdBy, filter.createdBy) : undefined,
      filter?.keyword ? like(reports.name, `%${filter.keyword}%`) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            id: reports.id,
            name: reports.name,
            description: reports.description,
            type: reports.type,
            category: reports.category,
            config: reports.config,
            isTemplate: reports.isTemplate,
            isPublic: reports.isPublic,
            createdBy: reports.createdBy,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
          })
          .from(reports)
          .where(and(...filters))
          .orderBy(desc(reports.updatedAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(reports)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(reportSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list reports", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(reports).where(eq(reports.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete report", error));
    }
  }

  async generate(
    query: GenerateReportQuery,
  ): Promise<Result<ReportData, RepositoryError>> {
    try {
      const report = await this.findById(query.reportId);
      if (report.isErr()) {
        return err(report.error);
      }

      const reportData = report.value;
      if (!reportData) {
        return err(new RepositoryError("Report not found"));
      }

      // Generate report data based on report type
      switch (reportData.type) {
        case "sales_performance":
          return this.generateSalesPerformanceReport(query.filter);
        case "sales_activity":
          return this.generateSalesActivityReport(query.filter);
        case "customer_analysis":
          return this.generateCustomerAnalysisReport(query.filter);
        case "roi_analysis":
          return this.generateROIAnalysisReport(query.filter);
        case "lead_conversion":
          return this.generateLeadConversionReport(query.filter);
        case "deal_pipeline":
          return this.generateDealPipelineReport(query.filter);
        case "user_activity":
          return this.generateUserActivityReport(query.filter);
        default:
          return err(new RepositoryError("Unsupported report type"));
      }
    } catch (error) {
      return err(new RepositoryError("Failed to generate report", error));
    }
  }

  async addToFavorites(
    userId: string,
    reportId: string,
  ): Promise<Result<FavoriteReport, RepositoryError>> {
    try {
      const result = await this.db
        .insert(favoriteReports)
        .values({ userId, reportId })
        .returning();

      const favorite = result[0];
      if (!favorite) {
        return err(new RepositoryError("Failed to add to favorites"));
      }

      return validate(favoriteReportSchema, favorite).mapErr((error) => {
        return new RepositoryError("Invalid favorite report data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to add to favorites", error));
    }
  }

  async removeFromFavorites(
    userId: string,
    reportId: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(favoriteReports)
        .where(
          and(
            eq(favoriteReports.userId, userId),
            eq(favoriteReports.reportId, reportId),
          ),
        );
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to remove from favorites", error));
    }
  }

  async listFavorites(
    query: ListFavoriteReportsQuery,
  ): Promise<Result<{ items: Report[]; count: number }, RepositoryError>> {
    const { userId, pagination } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            id: reports.id,
            name: reports.name,
            description: reports.description,
            type: reports.type,
            category: reports.category,
            config: reports.config,
            isTemplate: reports.isTemplate,
            isPublic: reports.isPublic,
            createdBy: reports.createdBy,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
          })
          .from(favoriteReports)
          .innerJoin(reports, eq(favoriteReports.reportId, reports.id))
          .where(eq(favoriteReports.userId, userId))
          .orderBy(desc(favoriteReports.createdAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(favoriteReports)
          .where(eq(favoriteReports.userId, userId)),
      ]);

      return ok({
        items: items
          .map((item) => validate(reportSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list favorite reports", error));
    }
  }

  async isFavorite(
    userId: string,
    reportId: string,
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const result = await this.db
        .select({ id: favoriteReports.id })
        .from(favoriteReports)
        .where(
          and(
            eq(favoriteReports.userId, userId),
            eq(favoriteReports.reportId, reportId),
          ),
        )
        .limit(1);

      return ok(result.length > 0);
    } catch (error) {
      return err(new RepositoryError("Failed to check favorite status", error));
    }
  }

  // Private methods for generating different types of reports
  private async generateSalesPerformanceReport(
    _filter?: ReportFilter,
  ): Promise<Result<ReportData, RepositoryError>> {
    try {
      // Example: Generate sales performance data from deals
      const salesData = await this.db
        .select({
          month: sql`EXTRACT(MONTH FROM ${deals.createdAt})`.as("month"),
          totalAmount: sql`SUM(${deals.amount})`.as("totalAmount"),
          dealCount: sql`COUNT(*)`.as("dealCount"),
        })
        .from(deals)
        .where(eq(deals.stage, "closed_won"))
        .groupBy(sql`EXTRACT(MONTH FROM ${deals.createdAt})`)
        .orderBy(sql`EXTRACT(MONTH FROM ${deals.createdAt})`);

      const labels = salesData.map((data) => `Month ${data.month}`);
      const amounts = salesData.map((data) => Number(data.totalAmount || 0));
      const counts = salesData.map((data) => Number(data.dealCount || 0));

      return ok({
        labels,
        datasets: [
          {
            name: "Sales Amount",
            data: amounts,
            color: "#3B82F6",
          },
          {
            name: "Deal Count",
            data: counts,
            color: "#10B981",
          },
        ],
        summary: {
          totalSales: amounts.reduce((sum, amount) => sum + amount, 0),
          totalDeals: counts.reduce((sum, count) => sum + count, 0),
        },
      });
    } catch (error) {
      return err(
        new RepositoryError(
          "Failed to generate sales performance report",
          error,
        ),
      );
    }
  }

  private async generateSalesActivityReport(
    _filter?: ReportFilter,
  ): Promise<Result<ReportData, RepositoryError>> {
    try {
      const activityData = await this.db
        .select({
          type: activities.type,
          count: sql`COUNT(*)`.as("count"),
        })
        .from(activities)
        .groupBy(activities.type);

      const labels = activityData.map((data) => data.type);
      const counts = activityData.map((data) => Number(data.count || 0));

      return ok({
        labels,
        datasets: [
          {
            name: "Activity Count",
            data: counts,
            color: "#8B5CF6",
          },
        ],
        summary: {
          totalActivities: counts.reduce((sum, count) => sum + count, 0),
        },
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to generate sales activity report", error),
      );
    }
  }

  private async generateCustomerAnalysisReport(
    _filter?: ReportFilter,
  ): Promise<Result<ReportData, RepositoryError>> {
    try {
      const customerData = await this.db
        .select({
          industry: customers.industry,
          count: sql`COUNT(*)`.as("count"),
        })
        .from(customers)
        .where(eq(customers.status, "active"))
        .groupBy(customers.industry);

      const labels = customerData.map((data) => data.industry || "Unknown");
      const counts = customerData.map((data) => Number(data.count || 0));

      return ok({
        labels,
        datasets: [
          {
            name: "Customer Count",
            data: counts,
            color: "#EF4444",
          },
        ],
        summary: {
          totalCustomers: counts.reduce((sum, count) => sum + count, 0),
        },
      });
    } catch (error) {
      return err(
        new RepositoryError(
          "Failed to generate customer analysis report",
          error,
        ),
      );
    }
  }

  private async generateROIAnalysisReport(
    _filter?: ReportFilter,
  ): Promise<Result<ReportData, RepositoryError>> {
    // Simplified ROI calculation
    return ok({
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          name: "ROI %",
          data: [15, 22, 18, 25],
          color: "#F59E0B",
        },
      ],
      summary: {
        averageROI: 20,
      },
    });
  }

  private async generateLeadConversionReport(
    _filter?: ReportFilter,
  ): Promise<Result<ReportData, RepositoryError>> {
    try {
      const conversionData = await this.db
        .select({
          status: leads.status,
          count: sql`COUNT(*)`.as("count"),
        })
        .from(leads)
        .groupBy(leads.status);

      const labels = conversionData.map((data) => data.status);
      const counts = conversionData.map((data) => Number(data.count || 0));

      return ok({
        labels,
        datasets: [
          {
            name: "Lead Count",
            data: counts,
            color: "#06B6D4",
          },
        ],
        summary: {
          totalLeads: counts.reduce((sum, count) => sum + count, 0),
        },
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to generate lead conversion report", error),
      );
    }
  }

  private async generateDealPipelineReport(
    _filter?: ReportFilter,
  ): Promise<Result<ReportData, RepositoryError>> {
    try {
      const pipelineData = await this.db
        .select({
          stage: deals.stage,
          count: sql`COUNT(*)`.as("count"),
          totalAmount: sql`SUM(${deals.amount})`.as("totalAmount"),
        })
        .from(deals)
        .groupBy(deals.stage);

      const labels = pipelineData.map((data) => data.stage);
      const counts = pipelineData.map((data) => Number(data.count || 0));
      const amounts = pipelineData.map((data) => Number(data.totalAmount || 0));

      return ok({
        labels,
        datasets: [
          {
            name: "Deal Count",
            data: counts,
            color: "#84CC16",
          },
          {
            name: "Total Amount",
            data: amounts,
            color: "#EC4899",
          },
        ],
        summary: {
          totalDeals: counts.reduce((sum, count) => sum + count, 0),
          totalValue: amounts.reduce((sum, amount) => sum + amount, 0),
        },
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to generate deal pipeline report", error),
      );
    }
  }

  private async generateUserActivityReport(
    _filter?: ReportFilter,
  ): Promise<Result<ReportData, RepositoryError>> {
    try {
      const userActivityData = await this.db
        .select({
          userId: activities.assignedUserId,
          count: sql`COUNT(*)`.as("count"),
        })
        .from(activities)
        .innerJoin(users, eq(activities.assignedUserId, users.id))
        .groupBy(activities.assignedUserId);

      const labels = userActivityData.map(
        (_data, index) => `User ${index + 1}`,
      );
      const counts = userActivityData.map((data) => Number(data.count || 0));

      return ok({
        labels,
        datasets: [
          {
            name: "Activity Count",
            data: counts,
            color: "#6366F1",
          },
        ],
        summary: {
          totalActivities: counts.reduce((sum, count) => sum + count, 0),
          activeUsers: counts.length,
        },
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to generate user activity report", error),
      );
    }
  }
}
