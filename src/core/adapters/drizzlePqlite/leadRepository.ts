import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { LeadRepository } from "@/core/domain/lead/ports/leadRepository";
import {
  type CreateLeadBehaviorParams,
  type CreateLeadParams,
  type Lead,
  type LeadBehavior,
  type LeadStats,
  type LeadWithUser,
  type ListLeadsQuery,
  leadBehaviorSchema,
  leadSchema,
  leadWithUserSchema,
  type UpdateLeadParams,
} from "@/core/domain/lead/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { customers, leadBehavior, leads, users } from "./schema";

export class DrizzlePqliteLeadRepository implements LeadRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateLeadParams,
  ): Promise<Result<Lead, RepositoryError>> {
    try {
      const result = await this.db.insert(leads).values(params).returning();

      const lead = result[0];
      if (!lead) {
        return err(new RepositoryError("Failed to create lead"));
      }

      return validate(leadSchema, lead).mapErr((error) => {
        return new RepositoryError("Invalid lead data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create lead", error));
    }
  }

  async findById(id: string): Promise<Result<Lead | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(leads)
        .where(eq(leads.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(leadSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid lead data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find lead", error));
    }
  }

  async findByIdWithUser(
    id: string,
  ): Promise<Result<LeadWithUser | null, RepositoryError>> {
    try {
      const [leadResult, assignedUserResult, convertedCustomerResult] =
        await Promise.all([
          this.db.select().from(leads).where(eq(leads.id, id)).limit(1),
          this.db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(users)
            .innerJoin(leads, eq(leads.assignedUserId, users.id))
            .where(eq(leads.id, id))
            .limit(1),
          this.db
            .select({
              id: customers.id,
              name: customers.name,
            })
            .from(customers)
            .innerJoin(leads, eq(leads.convertedCustomerId, customers.id))
            .where(eq(leads.id, id))
            .limit(1),
        ]);

      if (leadResult.length === 0) {
        return ok(null);
      }

      const lead = leadResult[0];

      // Transform database data to match domain schema
      const leadWithUser = {
        ...lead,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        company: lead.company || undefined,
        title: lead.title || undefined,
        industry: lead.industry || undefined,
        source: lead.source || undefined,
        notes: lead.notes || undefined,
        assignedUserId: lead.assignedUserId || undefined,
        convertedCustomerId: lead.convertedCustomerId || undefined,
        convertedAt: lead.convertedAt || undefined,
        tags: lead.tags || [],
        assignedUser: assignedUserResult[0] || undefined,
        convertedCustomer: convertedCustomerResult[0] || undefined,
      };

      return validate(leadWithUserSchema, leadWithUser).mapErr(
        (error) => new RepositoryError("Invalid lead data", error),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find lead with user", error));
    }
  }

  async list(
    query: ListLeadsQuery,
  ): Promise<Result<{ items: Lead[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword
        ? sql`${leads.firstName} ILIKE ${`%${filter.keyword}%`} OR ${leads.lastName} ILIKE ${`%${filter.keyword}%`} OR ${leads.company} ILIKE ${`%${filter.keyword}%`} OR ${leads.email} ILIKE ${`%${filter.keyword}%`}`
        : undefined,
      filter?.status ? eq(leads.status, filter.status) : undefined,
      filter?.source ? eq(leads.source, filter.source) : undefined,
      filter?.industry ? eq(leads.industry, filter.industry) : undefined,
      filter?.assignedUserId
        ? eq(leads.assignedUserId, filter.assignedUserId)
        : undefined,
      filter?.minScore ? gte(leads.score, filter.minScore) : undefined,
      filter?.maxScore ? lte(leads.score, filter.maxScore) : undefined,
      filter?.createdAfter
        ? gte(leads.createdAt, filter.createdAfter)
        : undefined,
      filter?.createdBefore
        ? lte(leads.createdAt, filter.createdBefore)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "firstName"
        ? leads.firstName
        : sortBy === "lastName"
          ? leads.lastName
          : sortBy === "company"
            ? leads.company
            : sortBy === "score"
              ? leads.score
              : sortBy === "updatedAt"
                ? leads.updatedAt
                : leads.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(leads)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(leads)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(leadSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list leads", error));
    }
  }

  async update(
    id: string,
    params: UpdateLeadParams,
  ): Promise<Result<Lead, RepositoryError>> {
    try {
      const result = await this.db
        .update(leads)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(leads.id, id))
        .returning();

      const lead = result[0];
      if (!lead) {
        return err(new RepositoryError("Lead not found"));
      }

      return validate(leadSchema, lead).mapErr((error) => {
        return new RepositoryError("Invalid lead data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update lead", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(leads)
        .where(eq(leads.id, id))
        .returning({ id: leads.id });

      if (result.length === 0) {
        return err(new RepositoryError("Lead not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete lead", error));
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Result<Lead | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(leads)
        .where(eq(leads.email, email))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(leadSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid lead data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find lead by email", error));
    }
  }

  async findByAssignedUser(
    userId: string,
  ): Promise<Result<Lead[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(leads)
        .where(eq(leads.assignedUserId, userId))
        .orderBy(desc(leads.updatedAt));

      return ok(
        result
          .map((item) => validate(leadSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find leads by assigned user", error),
      );
    }
  }

  async updateScore(
    id: string,
    score: number,
  ): Promise<Result<Lead, RepositoryError>> {
    return this.update(id, { score });
  }

  async updateStatus(
    id: string,
    status: "new" | "contacted" | "qualified" | "converted" | "rejected",
  ): Promise<Result<Lead, RepositoryError>> {
    return this.update(id, { status });
  }

  async convert(
    id: string,
    customerId: string,
  ): Promise<Result<Lead, RepositoryError>> {
    return this.update(id, {
      status: "converted",
      convertedCustomerId: customerId,
      convertedAt: new Date(),
    });
  }

  async getStats(): Promise<Result<LeadStats, RepositoryError>> {
    try {
      const [
        totalCount,
        statusCounts,
        sourceCounts,
        industryCounts,
        averageScore,
        conversionCount,
        recentLeads,
      ] = await Promise.all([
        this.db.select({ count: count() }).from(leads),
        this.db
          .select({ status: leads.status, count: count() })
          .from(leads)
          .groupBy(leads.status),
        this.db
          .select({ source: leads.source, count: count() })
          .from(leads)
          .where(sql`${leads.source} IS NOT NULL`)
          .groupBy(leads.source),
        this.db
          .select({ industry: leads.industry, count: count() })
          .from(leads)
          .where(sql`${leads.industry} IS NOT NULL`)
          .groupBy(leads.industry),
        this.db
          .select({ avgScore: sql<number>`AVG(${leads.score})` })
          .from(leads),
        this.db
          .select({ count: count() })
          .from(leads)
          .where(eq(leads.status, "converted")),
        this.db.select().from(leads).orderBy(desc(leads.createdAt)).limit(5),
      ]);

      const totalLeads = totalCount[0]?.count || 0;
      const convertedLeads = conversionCount[0]?.count || 0;
      const conversionRate =
        totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const stats = {
        totalLeads,
        newLeads: statusCounts.find((s) => s.status === "new")?.count || 0,
        contactedLeads:
          statusCounts.find((s) => s.status === "contacted")?.count || 0,
        qualifiedLeads:
          statusCounts.find((s) => s.status === "qualified")?.count || 0,
        convertedLeads,
        rejectedLeads:
          statusCounts.find((s) => s.status === "rejected")?.count || 0,
        averageScore: averageScore[0]?.avgScore || 0,
        conversionRate,
        leadsBySource: Object.fromEntries(
          sourceCounts.map((item) => [item.source || "Unknown", item.count]),
        ),
        leadsByIndustry: Object.fromEntries(
          industryCounts.map((item) => [
            item.industry || "Unknown",
            item.count,
          ]),
        ),
        recentLeads: recentLeads
          .map((item) => validate(leadSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      };

      return ok(stats);
    } catch (error) {
      return err(new RepositoryError("Failed to get lead stats", error));
    }
  }

  async search(
    keyword: string,
    limit = 10,
  ): Promise<Result<Lead[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(leads)
        .where(
          sql`${leads.firstName} ILIKE ${`%${keyword}%`} OR ${leads.lastName} ILIKE ${`%${keyword}%`} OR ${leads.company} ILIKE ${`%${keyword}%`} OR ${leads.email} ILIKE ${`%${keyword}%`}`,
        )
        .orderBy(desc(leads.score), desc(leads.updatedAt))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(leadSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to search leads", error));
    }
  }

  async createBehavior(
    params: CreateLeadBehaviorParams,
  ): Promise<Result<LeadBehavior, RepositoryError>> {
    try {
      const result = await this.db
        .insert(leadBehavior)
        .values(params)
        .returning();

      const behavior = result[0];
      if (!behavior) {
        return err(new RepositoryError("Failed to create lead behavior"));
      }

      return validate(leadBehaviorSchema, behavior).mapErr((error) => {
        return new RepositoryError("Invalid lead behavior data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create lead behavior", error));
    }
  }

  async getBehaviorByLeadId(
    leadId: string,
  ): Promise<Result<LeadBehavior[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(leadBehavior)
        .where(eq(leadBehavior.leadId, leadId))
        .orderBy(desc(leadBehavior.occurredAt));

      return ok(
        result
          .map((item) => validate(leadBehaviorSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to get lead behavior", error));
    }
  }
}
