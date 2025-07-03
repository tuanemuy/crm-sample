import { and, asc, count, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { DealRepository } from "@/core/domain/deal/ports/dealRepository";
import {
  type CreateDealParams,
  type Deal,
  type DealStats,
  type DealWithRelations,
  dealSchema,
  dealWithRelationsSchema,
  type ListDealsQuery,
  type PipelineData,
  type PipelineStage,
  type UpdateDealParams,
  type UpdateDealStageInput,
} from "@/core/domain/deal/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { activities, contacts, customers, deals, users } from "./schema";

export class DrizzlePqliteDealRepository implements DealRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateDealParams,
  ): Promise<Result<Deal, RepositoryError>> {
    try {
      const result = await this.db.insert(deals).values(params).returning();

      const deal = result[0];
      if (!deal) {
        return err(new RepositoryError("Failed to create deal"));
      }

      return validate(dealSchema, deal).mapErr((error) => {
        return new RepositoryError("Invalid deal data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create deal", error));
    }
  }

  async findById(id: string): Promise<Result<Deal | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(deals)
        .where(eq(deals.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(dealSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid deal data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find deal", error));
    }
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<Result<DealWithRelations | null, RepositoryError>> {
    try {
      const [
        dealResult,
        customerResult,
        contactResult,
        assignedUserResult,
        activitiesResult,
      ] = await Promise.all([
        this.db.select().from(deals).where(eq(deals.id, id)).limit(1),
        this.db
          .select({
            id: customers.id,
            name: customers.name,
            industry: customers.industry,
          })
          .from(customers)
          .innerJoin(deals, eq(deals.customerId, customers.id))
          .where(eq(deals.id, id))
          .limit(1),
        this.db
          .select({
            id: contacts.id,
            name: contacts.name,
            email: contacts.email,
            title: contacts.title,
          })
          .from(contacts)
          .innerJoin(deals, eq(deals.contactId, contacts.id))
          .where(eq(deals.id, id))
          .limit(1),
        this.db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .innerJoin(deals, eq(deals.assignedUserId, users.id))
          .where(eq(deals.id, id))
          .limit(1),
        this.db
          .select({
            id: activities.id,
            type: activities.type,
            subject: activities.subject,
            scheduledAt: activities.scheduledAt,
            status: activities.status,
          })
          .from(activities)
          .where(eq(activities.dealId, id))
          .orderBy(desc(activities.scheduledAt))
          .limit(10),
      ]);

      if (dealResult.length === 0) {
        return ok(null);
      }

      const deal = dealResult[0];

      // Transform database data to match domain schema
      const dealWithRelations = {
        ...deal,
        contactId: deal.contactId || undefined,
        expectedCloseDate: deal.expectedCloseDate || undefined,
        actualCloseDate: deal.actualCloseDate || undefined,
        description: deal.description || undefined,
        competitors: deal.competitors || [],
        customer: {
          ...customerResult[0],
          industry: customerResult[0].industry || undefined,
        },
        contact: contactResult[0]
          ? {
              ...contactResult[0],
              email: contactResult[0].email || undefined,
              title: contactResult[0].title || undefined,
            }
          : undefined,
        assignedUser: assignedUserResult[0],
        activities: activitiesResult.map((activity) => ({
          ...activity,
          scheduledAt: activity.scheduledAt || undefined,
        })),
      };

      return validate(dealWithRelationsSchema, dealWithRelations).mapErr(
        (error) => new RepositoryError("Invalid deal data", error),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find deal with relations", error),
      );
    }
  }

  async list(
    query: ListDealsQuery,
  ): Promise<Result<{ items: Deal[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword ? like(deals.title, `%${filter.keyword}%`) : undefined,
      filter?.stage ? eq(deals.stage, filter.stage) : undefined,
      filter?.customerId ? eq(deals.customerId, filter.customerId) : undefined,
      filter?.assignedUserId
        ? eq(deals.assignedUserId, filter.assignedUserId)
        : undefined,
      filter?.minAmount ? gte(deals.amount, filter.minAmount) : undefined,
      filter?.maxAmount ? lte(deals.amount, filter.maxAmount) : undefined,
      filter?.minProbability
        ? gte(deals.probability, filter.minProbability)
        : undefined,
      filter?.maxProbability
        ? lte(deals.probability, filter.maxProbability)
        : undefined,
      filter?.expectedCloseBefore
        ? lte(deals.expectedCloseDate, filter.expectedCloseBefore)
        : undefined,
      filter?.expectedCloseAfter
        ? gte(deals.expectedCloseDate, filter.expectedCloseAfter)
        : undefined,
      filter?.createdAfter
        ? gte(deals.createdAt, filter.createdAfter)
        : undefined,
      filter?.createdBefore
        ? lte(deals.createdAt, filter.createdBefore)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "title"
        ? deals.title
        : sortBy === "amount"
          ? deals.amount
          : sortBy === "probability"
            ? deals.probability
            : sortBy === "expectedCloseDate"
              ? deals.expectedCloseDate
              : sortBy === "updatedAt"
                ? deals.updatedAt
                : deals.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(deals)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(deals)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(dealSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list deals", error));
    }
  }

  async update(
    id: string,
    params: UpdateDealParams,
  ): Promise<Result<Deal, RepositoryError>> {
    try {
      const result = await this.db
        .update(deals)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(deals.id, id))
        .returning();

      const deal = result[0];
      if (!deal) {
        return err(new RepositoryError("Deal not found"));
      }

      return validate(dealSchema, deal).mapErr((error) => {
        return new RepositoryError("Invalid deal data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update deal", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(deals)
        .where(eq(deals.id, id))
        .returning({ id: deals.id });

      if (result.length === 0) {
        return err(new RepositoryError("Deal not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete deal", error));
    }
  }

  async findByCustomerId(
    customerId: string,
  ): Promise<Result<Deal[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(deals)
        .where(eq(deals.customerId, customerId))
        .orderBy(desc(deals.updatedAt));

      return ok(
        result
          .map((item) => validate(dealSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find deals by customer", error),
      );
    }
  }

  async findByAssignedUser(
    userId: string,
  ): Promise<Result<Deal[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(deals)
        .where(eq(deals.assignedUserId, userId))
        .orderBy(desc(deals.updatedAt));

      return ok(
        result
          .map((item) => validate(dealSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find deals by assigned user", error),
      );
    }
  }

  async updateStage(
    id: string,
    params: UpdateDealStageInput,
  ): Promise<Result<Deal, RepositoryError>> {
    const updateParams: UpdateDealParams = {
      stage: params.stage,
      probability: params.probability,
      actualCloseDate: params.actualCloseDate,
    };

    return this.update(id, updateParams);
  }

  async findByStage(stage: string): Promise<Result<Deal[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(deals)
        .where(eq(deals.stage, stage))
        .orderBy(desc(deals.updatedAt));

      return ok(
        result
          .map((item) => validate(dealSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find deals by stage", error));
    }
  }

  async getPipelineData(
    userId?: string,
  ): Promise<Result<PipelineData, RepositoryError>> {
    try {
      const baseQuery = this.db
        .select({
          stage: deals.stage,
          deal: deals,
          customer: {
            id: customers.id,
            name: customers.name,
            industry: customers.industry,
          },
          assignedUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(deals)
        .innerJoin(customers, eq(deals.customerId, customers.id))
        .innerJoin(users, eq(deals.assignedUserId, users.id));

      const query = userId
        ? baseQuery.where(eq(deals.assignedUserId, userId))
        : baseQuery;

      const dealsData = await query.orderBy(asc(deals.expectedCloseDate));

      const stages: Array<{
        stage: string;
        name: string;
      }> = [
        { stage: "prospecting", name: "Prospecting" },
        { stage: "qualification", name: "Qualification" },
        { stage: "proposal", name: "Proposal" },
        { stage: "negotiation", name: "Negotiation" },
        { stage: "closed_won", name: "Closed Won" },
        { stage: "closed_lost", name: "Closed Lost" },
      ];

      const pipelineStages: PipelineStage[] = stages.map((stageInfo) => {
        const stageDeals = dealsData.filter(
          (item) => item.stage === stageInfo.stage,
        );

        const dealWithRelations = stageDeals
          .map((item) => {
            const deal = item.deal;
            const transformedDeal = {
              ...deal,
              contactId: deal.contactId || undefined,
              expectedCloseDate: deal.expectedCloseDate || undefined,
              actualCloseDate: deal.actualCloseDate || undefined,
              description: deal.description || undefined,
              competitors: deal.competitors || [],
            };

            // Validate the deal data first
            const validatedDeal = validate(dealSchema, transformedDeal);
            if (validatedDeal.isErr()) {
              return null;
            }

            return {
              ...validatedDeal.value,
              customer: {
                ...item.customer,
                industry: item.customer.industry || undefined,
              },
              assignedUser: item.assignedUser,
            };
          })
          .filter((deal) => deal !== null);

        const totalValue = stageDeals
          .reduce((sum, deal) => sum + Number.parseFloat(deal.deal.amount), 0)
          .toString();

        return {
          stage: stageInfo.stage as PipelineStage["stage"],
          name: stageInfo.name,
          deals: dealWithRelations,
          totalValue,
          dealCount: stageDeals.length,
        };
      });

      const totalValue = dealsData
        .reduce((sum, deal) => sum + Number.parseFloat(deal.deal.amount), 0)
        .toString();

      const totalDeals = dealsData.length;

      // Calculate conversion rates between stages
      const conversionRates: Record<string, number> = {};
      for (let i = 0; i < stages.length - 1; i++) {
        const currentStage = stages[i].stage;
        const nextStage = stages[i + 1].stage;
        const currentCount = pipelineStages[i].dealCount;
        const nextCount = pipelineStages[i + 1].dealCount;

        if (currentCount > 0) {
          conversionRates[`${currentStage}_to_${nextStage}`] =
            (nextCount / currentCount) * 100;
        }
      }

      return ok({
        stages: pipelineStages,
        totalValue,
        totalDeals,
        conversionRates,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get pipeline data", error));
    }
  }

  async getStats(userId?: string): Promise<Result<DealStats, RepositoryError>> {
    try {
      const baseQuery = userId
        ? and(eq(deals.assignedUserId, userId))
        : undefined;

      const [totalCount, stageCounts, valueStats, monthlyTrend, topPerformers] =
        await Promise.all([
          this.db.select({ count: count() }).from(deals).where(baseQuery),
          this.db
            .select({ stage: deals.stage, count: count() })
            .from(deals)
            .where(baseQuery)
            .groupBy(deals.stage),
          this.db
            .select({
              totalValue: sql<string>`COALESCE(SUM(${deals.amount}), '0')`,
              wonValue: sql<string>`COALESCE(SUM(CASE WHEN ${deals.stage} = 'closed_won' THEN ${deals.amount} ELSE 0 END), '0')`,
              lostValue: sql<string>`COALESCE(SUM(CASE WHEN ${deals.stage} = 'closed_lost' THEN ${deals.amount} ELSE 0 END), '0')`,
              avgDealSize: sql<string>`COALESCE(AVG(${deals.amount}), '0')`,
            })
            .from(deals)
            .where(baseQuery),
          this.db
            .select({
              month: sql<string>`TO_CHAR(${deals.createdAt}, 'YYYY-MM')`,
              count: count(),
              value: sql<string>`COALESCE(SUM(${deals.amount}), '0')`,
            })
            .from(deals)
            .where(baseQuery)
            .groupBy(sql`TO_CHAR(${deals.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${deals.createdAt}, 'YYYY-MM') DESC`)
            .limit(12),
          this.db
            .select({
              userId: users.id,
              userName: users.name,
              dealCount: count(),
              totalValue: sql<string>`COALESCE(SUM(${deals.amount}), '0')`,
            })
            .from(deals)
            .innerJoin(users, eq(deals.assignedUserId, users.id))
            .where(baseQuery)
            .groupBy(users.id, users.name)
            .orderBy(sql`SUM(${deals.amount}) DESC`)
            .limit(10),
        ]);

      const totalDeals = totalCount[0]?.count || 0;
      const activeDeals = stageCounts
        .filter((s) => !["closed_won", "closed_lost"].includes(s.stage))
        .reduce((sum, s) => sum + s.count, 0);
      const wonDeals =
        stageCounts.find((s) => s.stage === "closed_won")?.count || 0;
      const lostDeals =
        stageCounts.find((s) => s.stage === "closed_lost")?.count || 0;

      const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

      // Calculate average sales cycle (simplified)
      const avgSalesCycle = 30; // This would need more complex calculation in real implementation

      const stats = {
        totalDeals,
        activeDeals,
        wonDeals,
        lostDeals,
        totalValue: valueStats[0]?.totalValue || "0",
        wonValue: valueStats[0]?.wonValue || "0",
        lostValue: valueStats[0]?.lostValue || "0",
        avgDealSize: valueStats[0]?.avgDealSize || "0",
        winRate,
        avgSalesCycle,
        dealsByStage: Object.fromEntries(
          stageCounts.map((item) => [item.stage, item.count]),
        ),
        monthlyTrend,
        topPerformers,
      };

      return ok(stats);
    } catch (error) {
      return err(new RepositoryError("Failed to get deal stats", error));
    }
  }

  async search(
    keyword: string,
    limit = 10,
  ): Promise<Result<Deal[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(deals)
        .where(
          sql`${deals.title} ILIKE ${`%${keyword}%`} OR ${deals.description} ILIKE ${`%${keyword}%`}`,
        )
        .orderBy(desc(deals.updatedAt))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(dealSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to search deals", error));
    }
  }

  async findExpiredDeals(): Promise<Result<Deal[], RepositoryError>> {
    try {
      const now = new Date();
      const result = await this.db
        .select()
        .from(deals)
        .where(
          and(
            lte(deals.expectedCloseDate, now),
            sql`${deals.stage} NOT IN ('closed_won', 'closed_lost')`,
          ),
        )
        .orderBy(asc(deals.expectedCloseDate));

      return ok(
        result
          .map((item) => validate(dealSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find expired deals", error));
    }
  }

  async findUpcomingDeals(
    days: number,
  ): Promise<Result<Deal[], RepositoryError>> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      const result = await this.db
        .select()
        .from(deals)
        .where(
          and(
            gte(deals.expectedCloseDate, now),
            lte(deals.expectedCloseDate, futureDate),
            sql`${deals.stage} NOT IN ('closed_won', 'closed_lost')`,
          ),
        )
        .orderBy(asc(deals.expectedCloseDate));

      return ok(
        result
          .map((item) => validate(dealSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find upcoming deals", error));
    }
  }
}
