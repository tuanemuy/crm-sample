import { and, asc, desc, eq, inArray, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { CampaignRepository } from "@/core/domain/campaign/ports/campaignRepository";
import type {
  AssignLeadsToCampaignParams,
  Campaign,
  CampaignLead,
  CampaignWithStats,
  CreateCampaignParams,
  ListCampaignLeadsQuery,
  ListCampaignsQuery,
  UpdateCampaignParams,
} from "@/core/domain/campaign/types";
import {
  campaignLeadSchema,
  campaignSchema,
  campaignWithStatsSchema,
} from "@/core/domain/campaign/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { campaignLeads, campaigns } from "./schema";

export class DrizzlePgliteCampaignRepository implements CampaignRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateCampaignParams,
  ): Promise<Result<Campaign, RepositoryError>> {
    try {
      const result = await this.db
        .insert(campaigns)
        .values({
          name: params.name,
          description: params.description,
          type: params.type,
          startDate: params.startDate,
          endDate: params.endDate,
          budget: params.budget?.toString(),
          targetAudience: params.targetAudience,
          goal: params.goal,
          metadata: params.metadata,
          createdBy: params.createdBy,
        })
        .returning();

      const campaign = result[0];
      if (!campaign) {
        return err(new RepositoryError("Failed to create campaign"));
      }

      return validate(campaignSchema, {
        ...campaign,
        budget: campaign.budget
          ? Number.parseFloat(campaign.budget)
          : undefined,
      }).mapErr((error) => {
        return new RepositoryError("Invalid campaign data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create campaign", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Campaign | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const campaign = result[0];
      return validate(campaignSchema, {
        ...campaign,
        budget: campaign.budget
          ? Number.parseFloat(campaign.budget)
          : undefined,
      }).mapErr((error) => {
        return new RepositoryError("Invalid campaign data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find campaign", error));
    }
  }

  async findByIdWithStats(
    id: string,
  ): Promise<Result<CampaignWithStats | null, RepositoryError>> {
    try {
      const [campaignResult, statsResult] = await Promise.all([
        this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1),
        this.db
          .select({
            totalLeads: sql`count(*)::int`,
            assignedLeads: sql`sum(case when ${campaignLeads.status} = 'assigned' then 1 else 0 end)::int`,
            contactedLeads: sql`sum(case when ${campaignLeads.status} = 'contacted' then 1 else 0 end)::int`,
            respondedLeads: sql`sum(case when ${campaignLeads.status} = 'responded' then 1 else 0 end)::int`,
            convertedLeads: sql`sum(case when ${campaignLeads.status} = 'converted' then 1 else 0 end)::int`,
            excludedLeads: sql`sum(case when ${campaignLeads.status} = 'excluded' then 1 else 0 end)::int`,
          })
          .from(campaignLeads)
          .where(eq(campaignLeads.campaignId, id)),
      ]);

      if (campaignResult.length === 0) {
        return ok(null);
      }

      const campaign = campaignResult[0];
      const stats = statsResult[0];
      const totalLeads = Number(stats?.totalLeads || 0);
      const respondedLeads = Number(stats?.respondedLeads || 0);
      const convertedLeads = Number(stats?.convertedLeads || 0);

      const campaignWithStats = {
        ...campaign,
        budget: campaign.budget
          ? Number.parseFloat(campaign.budget)
          : undefined,
        totalLeads,
        assignedLeads: Number(stats?.assignedLeads || 0),
        contactedLeads: Number(stats?.contactedLeads || 0),
        respondedLeads,
        convertedLeads,
        excludedLeads: Number(stats?.excludedLeads || 0),
        responseRate: totalLeads > 0 ? (respondedLeads / totalLeads) * 100 : 0,
        conversionRate:
          totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      };

      return validate(campaignWithStatsSchema, campaignWithStats).mapErr(
        (error) => {
          return new RepositoryError("Invalid campaign with stats data", error);
        },
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find campaign with stats", error),
      );
    }
  }

  async update(
    params: UpdateCampaignParams,
  ): Promise<Result<Campaign, RepositoryError>> {
    try {
      const updateData: Partial<{
        name: string;
        description: string | null;
        type: string;
        status: string;
        startDate: Date | null;
        endDate: Date | null;
        budget: string | null;
        targetAudience: string | null;
        goal: string | null;
        metadata: Record<string, unknown>;
      }> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.type !== undefined) updateData.type = params.type;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.startDate !== undefined)
        updateData.startDate = params.startDate;
      if (params.endDate !== undefined) updateData.endDate = params.endDate;
      if (params.budget !== undefined)
        updateData.budget = params.budget?.toString();
      if (params.targetAudience !== undefined)
        updateData.targetAudience = params.targetAudience;
      if (params.goal !== undefined) updateData.goal = params.goal;
      if (params.metadata !== undefined) updateData.metadata = params.metadata;

      const result = await this.db
        .update(campaigns)
        .set(updateData)
        .where(eq(campaigns.id, params.id))
        .returning();

      const campaign = result[0];
      if (!campaign) {
        return err(new RepositoryError("Campaign not found"));
      }

      return validate(campaignSchema, {
        ...campaign,
        budget: campaign.budget
          ? Number.parseFloat(campaign.budget)
          : undefined,
      }).mapErr((error) => {
        return new RepositoryError("Invalid campaign data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update campaign", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // First delete all campaign leads
      await this.db
        .delete(campaignLeads)
        .where(eq(campaignLeads.campaignId, id));

      // Then delete the campaign
      const result = await this.db
        .delete(campaigns)
        .where(eq(campaigns.id, id))
        .returning({ id: campaigns.id });

      if (result.length === 0) {
        return err(new RepositoryError("Campaign not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete campaign", error));
    }
  }

  async list(
    query: ListCampaignsQuery,
  ): Promise<Result<{ items: Campaign[]; count: number }, RepositoryError>> {
    const { pagination, filter, sort } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword ? like(campaigns.name, `%${filter.keyword}%`) : undefined,
      filter?.type ? eq(campaigns.type, filter.type) : undefined,
      filter?.status ? eq(campaigns.status, filter.status) : undefined,
      filter?.createdBy ? eq(campaigns.createdBy, filter.createdBy) : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy = sort
      ? sort.order === "asc"
        ? asc(campaigns[sort.field])
        : desc(campaigns[sort.field])
      : desc(campaigns.createdAt);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(campaigns)
          .where(and(...filters))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(campaigns)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) =>
            validate(campaignSchema, {
              ...item,
              budget: item.budget ? Number.parseFloat(item.budget) : undefined,
            }).unwrapOr(null),
          )
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list campaigns", error));
    }
  }

  async assignLeads(
    params: AssignLeadsToCampaignParams,
  ): Promise<Result<CampaignLead[], RepositoryError>> {
    try {
      // Check if leads are already assigned to this campaign
      const existingAssignments = await this.db
        .select({ leadId: campaignLeads.leadId })
        .from(campaignLeads)
        .where(
          and(
            eq(campaignLeads.campaignId, params.campaignId),
            inArray(campaignLeads.leadId, params.leadIds),
          ),
        );

      const existingLeadIds = new Set(existingAssignments.map((a) => a.leadId));
      const newLeadIds = params.leadIds.filter(
        (id) => !existingLeadIds.has(id),
      );

      if (newLeadIds.length === 0) {
        return ok([]);
      }

      const assignmentsToCreate = newLeadIds.map((leadId) => ({
        campaignId: params.campaignId,
        leadId,
        assignedBy: params.assignedBy,
        notes: params.notes,
      }));

      const result = await this.db
        .insert(campaignLeads)
        .values(assignmentsToCreate)
        .returning();

      return ok(
        result
          .map((item) => validate(campaignLeadSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to assign leads to campaign", error),
      );
    }
  }

  async unassignLead(
    campaignId: string,
    leadId: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(campaignLeads)
        .where(
          and(
            eq(campaignLeads.campaignId, campaignId),
            eq(campaignLeads.leadId, leadId),
          ),
        )
        .returning({ id: campaignLeads.id });

      if (result.length === 0) {
        return err(new RepositoryError("Campaign lead assignment not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to unassign lead from campaign", error),
      );
    }
  }

  async updateLeadStatus(
    campaignId: string,
    leadId: string,
    status: CampaignLead["status"],
    notes?: string,
  ): Promise<Result<CampaignLead, RepositoryError>> {
    try {
      const updateData: Partial<{
        status: string;
        notes: string | null;
        lastContactedAt: Date | null;
        responseAt: Date | null;
      }> = { status };
      if (notes !== undefined) updateData.notes = notes;
      if (status === "contacted") updateData.lastContactedAt = new Date();
      if (status === "responded") updateData.responseAt = new Date();

      const result = await this.db
        .update(campaignLeads)
        .set(updateData)
        .where(
          and(
            eq(campaignLeads.campaignId, campaignId),
            eq(campaignLeads.leadId, leadId),
          ),
        )
        .returning();

      const campaignLead = result[0];
      if (!campaignLead) {
        return err(new RepositoryError("Campaign lead assignment not found"));
      }

      return validate(campaignLeadSchema, campaignLead).mapErr((error) => {
        return new RepositoryError("Invalid campaign lead data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update campaign lead status", error),
      );
    }
  }

  async listCampaignLeads(
    query: ListCampaignLeadsQuery,
  ): Promise<
    Result<{ items: CampaignLead[]; count: number }, RepositoryError>
  > {
    const { campaignId, pagination, filter, sort } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      eq(campaignLeads.campaignId, campaignId),
      filter?.status ? eq(campaignLeads.status, filter.status) : undefined,
      filter?.assignedBy
        ? eq(campaignLeads.assignedBy, filter.assignedBy)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy = sort
      ? sort.order === "asc"
        ? asc(campaignLeads[sort.field])
        : desc(campaignLeads[sort.field])
      : desc(campaignLeads.assignedAt);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(campaignLeads)
          .where(and(...filters))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(campaignLeads)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(campaignLeadSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list campaign leads", error));
    }
  }

  async findCampaignLead(
    campaignId: string,
    leadId: string,
  ): Promise<Result<CampaignLead | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(campaignLeads)
        .where(
          and(
            eq(campaignLeads.campaignId, campaignId),
            eq(campaignLeads.leadId, leadId),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(campaignLeadSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid campaign lead data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find campaign lead", error));
    }
  }

  async findLeadCampaigns(
    leadId: string,
  ): Promise<Result<Campaign[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: campaigns.id,
          name: campaigns.name,
          description: campaigns.description,
          type: campaigns.type,
          status: campaigns.status,
          startDate: campaigns.startDate,
          endDate: campaigns.endDate,
          budget: campaigns.budget,
          targetAudience: campaigns.targetAudience,
          goal: campaigns.goal,
          metadata: campaigns.metadata,
          createdBy: campaigns.createdBy,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
        })
        .from(campaigns)
        .innerJoin(campaignLeads, eq(campaigns.id, campaignLeads.campaignId))
        .where(eq(campaignLeads.leadId, leadId));

      return ok(
        result
          .map((item) =>
            validate(campaignSchema, {
              ...item,
              budget: item.budget ? Number.parseFloat(item.budget) : undefined,
            }).unwrapOr(null),
          )
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find lead campaigns", error));
    }
  }

  async getCampaignStats(
    campaignId: string,
  ): Promise<Result<Omit<CampaignWithStats, keyof Campaign>, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          totalLeads: sql`count(*)::int`,
          assignedLeads: sql`sum(case when ${campaignLeads.status} = 'assigned' then 1 else 0 end)::int`,
          contactedLeads: sql`sum(case when ${campaignLeads.status} = 'contacted' then 1 else 0 end)::int`,
          respondedLeads: sql`sum(case when ${campaignLeads.status} = 'responded' then 1 else 0 end)::int`,
          convertedLeads: sql`sum(case when ${campaignLeads.status} = 'converted' then 1 else 0 end)::int`,
          excludedLeads: sql`sum(case when ${campaignLeads.status} = 'excluded' then 1 else 0 end)::int`,
        })
        .from(campaignLeads)
        .where(eq(campaignLeads.campaignId, campaignId));

      const stats = result[0];
      const totalLeads = Number(stats?.totalLeads || 0);
      const respondedLeads = Number(stats?.respondedLeads || 0);
      const convertedLeads = Number(stats?.convertedLeads || 0);

      return ok({
        totalLeads,
        assignedLeads: Number(stats?.assignedLeads || 0),
        contactedLeads: Number(stats?.contactedLeads || 0),
        respondedLeads,
        convertedLeads,
        excludedLeads: Number(stats?.excludedLeads || 0),
        responseRate: totalLeads > 0 ? (respondedLeads / totalLeads) * 100 : 0,
        conversionRate:
          totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get campaign stats", error));
    }
  }
}
