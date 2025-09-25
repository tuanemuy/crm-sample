import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { EmailMarketingRepository } from "@/core/domain/emailMarketing/ports/emailMarketingRepository";
import type {
  CreateEmailCampaignParams,
  CreateEmailTemplateParams,
  EmailCampaign,
  EmailCampaignWithStats,
  EmailHistory,
  EmailHistoryWithLead,
  EmailTemplate,
  ListEmailCampaignsQuery,
  ListEmailHistoryQuery,
  ListEmailTemplatesQuery,
  RecordEmailHistoryParams,
  UpdateEmailCampaignParams,
  UpdateEmailStatusParams,
  UpdateEmailTemplateParams,
} from "@/core/domain/emailMarketing/types";
import {
  emailCampaignSchema,
  emailCampaignWithStatsSchema,
  emailHistorySchema,
  emailHistoryWithLeadSchema,
  emailTemplateSchema,
} from "@/core/domain/emailMarketing/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { emailCampaigns, emailHistory, emailTemplates, leads } from "./schema";

export class DrizzlePgliteEmailMarketingRepository
  implements EmailMarketingRepository
{
  constructor(private readonly db: Database) {}

  async createTemplate(
    params: CreateEmailTemplateParams,
  ): Promise<Result<EmailTemplate, RepositoryError>> {
    try {
      const result = await this.db
        .insert(emailTemplates)
        .values({
          name: params.name,
          description: params.description,
          subject: params.subject,
          content: params.content,
          type: params.type,
          createdBy: params.createdBy,
        })
        .returning();

      const template = result[0];
      if (!template) {
        return err(new RepositoryError("Failed to create email template"));
      }

      return validate(emailTemplateSchema, template).mapErr((error) => {
        return new RepositoryError("Invalid email template data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create email template", error));
    }
  }

  async findTemplateById(
    id: string,
  ): Promise<Result<EmailTemplate | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(emailTemplateSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid email template data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find email template", error));
    }
  }

  async updateTemplate(
    params: UpdateEmailTemplateParams,
  ): Promise<Result<EmailTemplate, RepositoryError>> {
    try {
      const updateData: Partial<{
        name: string;
        description: string | null;
        subject: string;
        content: string;
        type: string;
        isActive: boolean;
      }> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.subject !== undefined) updateData.subject = params.subject;
      if (params.content !== undefined) updateData.content = params.content;
      if (params.type !== undefined) updateData.type = params.type;
      if (params.isActive !== undefined) updateData.isActive = params.isActive;

      const result = await this.db
        .update(emailTemplates)
        .set(updateData)
        .where(eq(emailTemplates.id, params.id))
        .returning();

      const template = result[0];
      if (!template) {
        return err(new RepositoryError("Email template not found"));
      }

      return validate(emailTemplateSchema, template).mapErr((error) => {
        return new RepositoryError("Invalid email template data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update email template", error));
    }
  }

  async deleteTemplate(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .returning({ id: emailTemplates.id });

      if (result.length === 0) {
        return err(new RepositoryError("Email template not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete email template", error));
    }
  }

  async listTemplates(
    query: ListEmailTemplatesQuery,
  ): Promise<
    Result<{ items: EmailTemplate[]; count: number }, RepositoryError>
  > {
    const { pagination, filter, sort } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword
        ? like(emailTemplates.name, `%${filter.keyword}%`)
        : undefined,
      filter?.type ? eq(emailTemplates.type, filter.type) : undefined,
      filter?.isActive !== undefined
        ? eq(emailTemplates.isActive, filter.isActive)
        : undefined,
      filter?.createdBy
        ? eq(emailTemplates.createdBy, filter.createdBy)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy = sort
      ? sort.order === "asc"
        ? asc(emailTemplates[sort.field])
        : desc(emailTemplates[sort.field])
      : desc(emailTemplates.createdAt);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(emailTemplates)
          .where(and(...filters))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(emailTemplates)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(emailTemplateSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list email templates", error));
    }
  }

  async createCampaign(
    params: CreateEmailCampaignParams,
  ): Promise<Result<EmailCampaign, RepositoryError>> {
    try {
      const result = await this.db
        .insert(emailCampaigns)
        .values({
          campaignId: params.campaignId,
          templateId: params.templateId,
          subject: params.subject,
          content: params.content,
          scheduledAt: params.scheduledAt,
          metadata: params.metadata,
          createdBy: params.createdBy,
        })
        .returning();

      const campaign = result[0];
      if (!campaign) {
        return err(new RepositoryError("Failed to create email campaign"));
      }

      return validate(emailCampaignSchema, campaign).mapErr((error) => {
        return new RepositoryError("Invalid email campaign data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create email campaign", error));
    }
  }

  async findCampaignById(
    id: string,
  ): Promise<Result<EmailCampaign | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(emailCampaignSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid email campaign data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find email campaign", error));
    }
  }

  async findCampaignByIdWithStats(
    id: string,
  ): Promise<Result<EmailCampaignWithStats | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const campaign = result[0];
      const sentCount = campaign.sentCount || 0;
      const deliveredCount = campaign.deliveredCount || 0;
      const openedCount = campaign.openedCount || 0;
      const clickedCount = campaign.clickedCount || 0;
      const bouncedCount = campaign.bouncedCount || 0;
      const unsubscribedCount = campaign.unsubscribedCount || 0;

      const campaignWithStats = {
        ...campaign,
        deliveryRate: sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0,
        openRate: deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0,
        clickRate: openedCount > 0 ? (clickedCount / openedCount) * 100 : 0,
        bounceRate: sentCount > 0 ? (bouncedCount / sentCount) * 100 : 0,
        unsubscribeRate:
          sentCount > 0 ? (unsubscribedCount / sentCount) * 100 : 0,
      };

      return validate(emailCampaignWithStatsSchema, campaignWithStats).mapErr(
        (error) => {
          return new RepositoryError(
            "Invalid email campaign with stats data",
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find email campaign with stats", error),
      );
    }
  }

  async updateCampaign(
    params: UpdateEmailCampaignParams,
  ): Promise<Result<EmailCampaign, RepositoryError>> {
    try {
      const updateData: Partial<{
        subject: string;
        content: string;
        status: string;
        scheduledAt: Date | null;
        sentAt: Date | null;
        totalRecipients: number;
        sentCount: number;
        deliveredCount: number;
        openedCount: number;
        clickedCount: number;
        bouncedCount: number;
        unsubscribedCount: number;
        metadata: Record<string, unknown>;
      }> = {};
      if (params.subject !== undefined) updateData.subject = params.subject;
      if (params.content !== undefined) updateData.content = params.content;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.scheduledAt !== undefined)
        updateData.scheduledAt = params.scheduledAt;
      if (params.sentAt !== undefined) updateData.sentAt = params.sentAt;
      if (params.totalRecipients !== undefined)
        updateData.totalRecipients = params.totalRecipients;
      if (params.sentCount !== undefined)
        updateData.sentCount = params.sentCount;
      if (params.deliveredCount !== undefined)
        updateData.deliveredCount = params.deliveredCount;
      if (params.openedCount !== undefined)
        updateData.openedCount = params.openedCount;
      if (params.clickedCount !== undefined)
        updateData.clickedCount = params.clickedCount;
      if (params.bouncedCount !== undefined)
        updateData.bouncedCount = params.bouncedCount;
      if (params.unsubscribedCount !== undefined)
        updateData.unsubscribedCount = params.unsubscribedCount;
      if (params.metadata !== undefined) updateData.metadata = params.metadata;

      const result = await this.db
        .update(emailCampaigns)
        .set(updateData)
        .where(eq(emailCampaigns.id, params.id))
        .returning();

      const campaign = result[0];
      if (!campaign) {
        return err(new RepositoryError("Email campaign not found"));
      }

      return validate(emailCampaignSchema, campaign).mapErr((error) => {
        return new RepositoryError("Invalid email campaign data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update email campaign", error));
    }
  }

  async deleteCampaign(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // First delete all email history
      await this.db
        .delete(emailHistory)
        .where(eq(emailHistory.emailCampaignId, id));

      // Then delete the campaign
      const result = await this.db
        .delete(emailCampaigns)
        .where(eq(emailCampaigns.id, id))
        .returning({ id: emailCampaigns.id });

      if (result.length === 0) {
        return err(new RepositoryError("Email campaign not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete email campaign", error));
    }
  }

  async listCampaigns(
    query: ListEmailCampaignsQuery,
  ): Promise<
    Result<{ items: EmailCampaign[]; count: number }, RepositoryError>
  > {
    const { pagination, filter, sort } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.campaignId
        ? eq(emailCampaigns.campaignId, filter.campaignId)
        : undefined,
      filter?.templateId
        ? eq(emailCampaigns.templateId, filter.templateId)
        : undefined,
      filter?.status ? eq(emailCampaigns.status, filter.status) : undefined,
      filter?.createdBy
        ? eq(emailCampaigns.createdBy, filter.createdBy)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy = sort
      ? sort.order === "asc"
        ? asc(emailCampaigns[sort.field])
        : desc(emailCampaigns[sort.field])
      : desc(emailCampaigns.createdAt);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(emailCampaigns)
          .where(and(...filters))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(emailCampaigns)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(emailCampaignSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list email campaigns", error));
    }
  }

  async recordEmailHistory(
    params: RecordEmailHistoryParams,
  ): Promise<Result<EmailHistory, RepositoryError>> {
    try {
      const result = await this.db
        .insert(emailHistory)
        .values({
          emailCampaignId: params.emailCampaignId,
          leadId: params.leadId,
          customerId: params.customerId,
          contactId: params.contactId,
          emailAddress: params.emailAddress,
          subject: params.subject,
          content: params.content,
          metadata: params.metadata,
        })
        .returning();

      const history = result[0];
      if (!history) {
        return err(new RepositoryError("Failed to record email history"));
      }

      return validate(emailHistorySchema, history).mapErr((error) => {
        return new RepositoryError("Invalid email history data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to record email history", error));
    }
  }

  async updateEmailStatus(
    params: UpdateEmailStatusParams,
  ): Promise<Result<EmailHistory, RepositoryError>> {
    try {
      const updateData: Partial<{
        status: string;
        errorMessage: string | null;
        metadata: Record<string, unknown>;
        sentAt: Date | null;
        deliveredAt: Date | null;
        openedAt: Date | null;
        clickedAt: Date | null;
        bouncedAt: Date | null;
        unsubscribedAt: Date | null;
      }> = { status: params.status };
      if (params.errorMessage !== undefined)
        updateData.errorMessage = params.errorMessage;
      if (params.metadata !== undefined) updateData.metadata = params.metadata;

      // Set timestamps based on status
      const now = new Date();
      if (params.status === "sent") updateData.sentAt = now;
      if (params.status === "delivered") updateData.deliveredAt = now;
      if (params.status === "opened") updateData.openedAt = now;
      if (params.status === "clicked") updateData.clickedAt = now;
      if (params.status === "bounced") updateData.bouncedAt = now;
      if (params.status === "unsubscribed") updateData.unsubscribedAt = now;

      const result = await this.db
        .update(emailHistory)
        .set(updateData)
        .where(eq(emailHistory.id, params.id))
        .returning();

      const history = result[0];
      if (!history) {
        return err(new RepositoryError("Email history not found"));
      }

      return validate(emailHistorySchema, history).mapErr((error) => {
        return new RepositoryError("Invalid email history data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update email status", error));
    }
  }

  async findEmailHistoryById(
    id: string,
  ): Promise<Result<EmailHistory | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailHistory)
        .where(eq(emailHistory.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(emailHistorySchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid email history data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find email history", error));
    }
  }

  async listEmailHistory(
    query: ListEmailHistoryQuery,
  ): Promise<
    Result<{ items: EmailHistory[]; count: number }, RepositoryError>
  > {
    const { pagination, filter, sort } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.emailCampaignId
        ? eq(emailHistory.emailCampaignId, filter.emailCampaignId)
        : undefined,
      filter?.leadId ? eq(emailHistory.leadId, filter.leadId) : undefined,
      filter?.customerId
        ? eq(emailHistory.customerId, filter.customerId)
        : undefined,
      filter?.contactId
        ? eq(emailHistory.contactId, filter.contactId)
        : undefined,
      filter?.emailAddress
        ? eq(emailHistory.emailAddress, filter.emailAddress)
        : undefined,
      filter?.status ? eq(emailHistory.status, filter.status) : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy = sort
      ? sort.order === "asc"
        ? asc(emailHistory[sort.field])
        : desc(emailHistory[sort.field])
      : desc(emailHistory.createdAt);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(emailHistory)
          .where(and(...filters))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(emailHistory)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(emailHistorySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list email history", error));
    }
  }

  async listEmailHistoryWithLeads(
    query: ListEmailHistoryQuery,
  ): Promise<
    Result<{ items: EmailHistoryWithLead[]; count: number }, RepositoryError>
  > {
    const { pagination, filter, sort } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.emailCampaignId
        ? eq(emailHistory.emailCampaignId, filter.emailCampaignId)
        : undefined,
      filter?.leadId ? eq(emailHistory.leadId, filter.leadId) : undefined,
      filter?.customerId
        ? eq(emailHistory.customerId, filter.customerId)
        : undefined,
      filter?.contactId
        ? eq(emailHistory.contactId, filter.contactId)
        : undefined,
      filter?.emailAddress
        ? eq(emailHistory.emailAddress, filter.emailAddress)
        : undefined,
      filter?.status ? eq(emailHistory.status, filter.status) : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy = sort
      ? sort.order === "asc"
        ? asc(emailHistory[sort.field])
        : desc(emailHistory[sort.field])
      : desc(emailHistory.createdAt);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            // Email history fields
            id: emailHistory.id,
            emailCampaignId: emailHistory.emailCampaignId,
            leadId: emailHistory.leadId,
            customerId: emailHistory.customerId,
            contactId: emailHistory.contactId,
            emailAddress: emailHistory.emailAddress,
            subject: emailHistory.subject,
            content: emailHistory.content,
            status: emailHistory.status,
            sentAt: emailHistory.sentAt,
            deliveredAt: emailHistory.deliveredAt,
            openedAt: emailHistory.openedAt,
            clickedAt: emailHistory.clickedAt,
            bouncedAt: emailHistory.bouncedAt,
            unsubscribedAt: emailHistory.unsubscribedAt,
            errorMessage: emailHistory.errorMessage,
            metadata: emailHistory.metadata,
            createdAt: emailHistory.createdAt,
            updatedAt: emailHistory.updatedAt,
            // Lead fields
            leadFirstName: leads.firstName,
            leadLastName: leads.lastName,
            leadEmail: leads.email,
            leadCompany: leads.company,
            leadStatus: leads.status,
          })
          .from(emailHistory)
          .leftJoin(leads, eq(emailHistory.leadId, leads.id))
          .where(and(...filters))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(emailHistory)
          .leftJoin(leads, eq(emailHistory.leadId, leads.id))
          .where(and(...filters)),
      ]);

      const processedItems = items.map((item) => {
        const lead = item.leadFirstName
          ? {
              id: item.leadId,
              firstName: item.leadFirstName,
              lastName: item.leadLastName,
              email: item.leadEmail,
              company: item.leadCompany,
              status: item.leadStatus,
            }
          : undefined;

        return {
          id: item.id,
          emailCampaignId: item.emailCampaignId,
          leadId: item.leadId,
          customerId: item.customerId,
          contactId: item.contactId,
          emailAddress: item.emailAddress,
          subject: item.subject,
          content: item.content,
          status: item.status,
          sentAt: item.sentAt,
          deliveredAt: item.deliveredAt,
          openedAt: item.openedAt,
          clickedAt: item.clickedAt,
          bouncedAt: item.bouncedAt,
          unsubscribedAt: item.unsubscribedAt,
          errorMessage: item.errorMessage,
          metadata: item.metadata,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          lead,
        };
      });

      return ok({
        items: processedItems
          .map((item) =>
            validate(emailHistoryWithLeadSchema, item).unwrapOr(null),
          )
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to list email history with leads", error),
      );
    }
  }

  async getCampaignStats(
    campaignId: string,
  ): Promise<Result<EmailCampaignWithStats, RepositoryError>> {
    const result = await this.findCampaignByIdWithStats(campaignId);
    if (result.isErr()) {
      return err(result.error);
    }
    if (!result.value) {
      return err(new RepositoryError("Email campaign not found"));
    }
    return ok(result.value);
  }

  async getLeadEmailHistory(
    leadId: string,
  ): Promise<Result<EmailHistory[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailHistory)
        .where(eq(emailHistory.leadId, leadId))
        .orderBy(desc(emailHistory.createdAt));

      return ok(
        result
          .map((item) => validate(emailHistorySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to get lead email history", error),
      );
    }
  }

  async getCustomerEmailHistory(
    customerId: string,
  ): Promise<Result<EmailHistory[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailHistory)
        .where(eq(emailHistory.customerId, customerId))
        .orderBy(desc(emailHistory.createdAt));

      return ok(
        result
          .map((item) => validate(emailHistorySchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to get customer email history", error),
      );
    }
  }

  async findCampaignsByParentCampaign(
    campaignId: string,
  ): Promise<Result<EmailCampaign[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.campaignId, campaignId))
        .orderBy(desc(emailCampaigns.createdAt));

      return ok(
        result
          .map((item) => validate(emailCampaignSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError(
          "Failed to find campaigns by parent campaign",
          error,
        ),
      );
    }
  }
}
