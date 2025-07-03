import { and, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ProposalRepository } from "@/core/domain/proposal/ports/proposalRepository";
import type {
  CreateProposalItemParams,
  CreateProposalParams,
  CreateProposalTemplateParams,
  ListProposalsQuery,
  Proposal,
  ProposalAnalytics,
  ProposalItem,
  ProposalTemplate,
  ProposalWithItems,
  UpdateProposalItemParams,
  UpdateProposalParams,
} from "@/core/domain/proposal/types";
import {
  proposalAnalyticsSchema,
  proposalItemSchema,
  proposalSchema,
  proposalTemplateSchema,
  proposalWithItemsSchema,
} from "@/core/domain/proposal/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import {
  contacts,
  customers,
  deals,
  proposalItems,
  proposals,
  proposalTemplates,
} from "./schema";

export class DrizzlePqliteProposalRepository implements ProposalRepository {
  constructor(private readonly db: Database) {}

  async createProposal(
    params: CreateProposalParams,
  ): Promise<Result<Proposal, RepositoryError>> {
    try {
      const result = await this.db.insert(proposals).values(params).returning();

      const proposal = result[0];
      if (!proposal) {
        return err(new RepositoryError("Failed to create proposal"));
      }

      return validate(proposalSchema, {
        ...proposal,
        subtotal: Number(proposal.subtotal),
        discountAmount: Number(proposal.discountAmount),
        discountPercent: Number(proposal.discountPercent),
        taxAmount: Number(proposal.taxAmount),
        taxPercent: Number(proposal.taxPercent),
        totalAmount: Number(proposal.totalAmount),
      }).mapErr((error) => {
        return new RepositoryError("Invalid proposal data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create proposal", error));
    }
  }

  async updateProposal(
    params: UpdateProposalParams,
  ): Promise<Result<Proposal, RepositoryError>> {
    try {
      const { id, ...updateData } = params;
      const result = await this.db
        .update(proposals)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, id))
        .returning();

      const proposal = result[0];
      if (!proposal) {
        return err(new RepositoryError("Proposal not found"));
      }

      return validate(proposalSchema, {
        ...proposal,
        subtotal: Number(proposal.subtotal),
        discountAmount: Number(proposal.discountAmount),
        discountPercent: Number(proposal.discountPercent),
        taxAmount: Number(proposal.taxAmount),
        taxPercent: Number(proposal.taxPercent),
        totalAmount: Number(proposal.totalAmount),
      }).mapErr((error) => {
        return new RepositoryError("Invalid proposal data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update proposal", error));
    }
  }

  async findProposalById(
    id: string,
  ): Promise<Result<Proposal | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(proposals)
        .where(eq(proposals.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(proposalSchema, {
        ...result[0],
        subtotal: Number(result[0].subtotal),
        discountAmount: Number(result[0].discountAmount),
        discountPercent: Number(result[0].discountPercent),
        taxAmount: Number(result[0].taxAmount),
        taxPercent: Number(result[0].taxPercent),
        totalAmount: Number(result[0].totalAmount),
      }).mapErr((error) => {
        return new RepositoryError("Invalid proposal data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find proposal", error));
    }
  }

  async findProposalWithItems(
    id: string,
  ): Promise<Result<ProposalWithItems | null, RepositoryError>> {
    try {
      // Get proposal with related data
      const proposalResult = await this.db
        .select({
          id: proposals.id,
          dealId: proposals.dealId,
          customerId: proposals.customerId,
          contactId: proposals.contactId,
          title: proposals.title,
          description: proposals.description,
          status: proposals.status,
          type: proposals.type,
          templateId: proposals.templateId,
          validUntil: proposals.validUntil,
          sentAt: proposals.sentAt,
          viewedAt: proposals.viewedAt,
          respondedAt: proposals.respondedAt,
          subtotal: proposals.subtotal,
          discountAmount: proposals.discountAmount,
          discountPercent: proposals.discountPercent,
          taxAmount: proposals.taxAmount,
          taxPercent: proposals.taxPercent,
          totalAmount: proposals.totalAmount,
          currency: proposals.currency,
          terms: proposals.terms,
          notes: proposals.notes,
          version: proposals.version,
          parentProposalId: proposals.parentProposalId,
          createdBy: proposals.createdBy,
          approvedBy: proposals.approvedBy,
          approvedAt: proposals.approvedAt,
          createdAt: proposals.createdAt,
          updatedAt: proposals.updatedAt,
          dealTitle: deals.title,
          dealStage: deals.stage,
          customerName: customers.name,
          contactName: contacts.name,
          contactEmail: contacts.email,
        })
        .from(proposals)
        .leftJoin(deals, eq(proposals.dealId, deals.id))
        .leftJoin(customers, eq(proposals.customerId, customers.id))
        .leftJoin(contacts, eq(proposals.contactId, contacts.id))
        .where(eq(proposals.id, id))
        .limit(1);

      if (proposalResult.length === 0) {
        return ok(null);
      }

      const proposalData = proposalResult[0];

      // Get proposal items
      const itemsResult = await this.db
        .select()
        .from(proposalItems)
        .where(eq(proposalItems.proposalId, id))
        .orderBy(proposalItems.sortOrder, proposalItems.createdAt);

      const items = itemsResult.map((item) => ({
        ...item,
        productId: item.productId || undefined,
        description: item.description || undefined,
        category: item.category || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
        discountPercent: Number(item.discountPercent),
        lineTotal: Number(item.lineTotal),
        metadata: (item.metadata || {}) as Record<string, unknown>,
      }));

      const proposalWithItems: ProposalWithItems = {
        id: proposalData.id,
        dealId: proposalData.dealId,
        customerId: proposalData.customerId,
        contactId: proposalData.contactId || undefined,
        title: proposalData.title,
        description: proposalData.description || undefined,
        status: proposalData.status as Proposal["status"],
        type: proposalData.type as Proposal["type"],
        templateId: proposalData.templateId || undefined,
        validUntil: proposalData.validUntil || undefined,
        sentAt: proposalData.sentAt || undefined,
        viewedAt: proposalData.viewedAt || undefined,
        respondedAt: proposalData.respondedAt || undefined,
        subtotal: Number(proposalData.subtotal),
        discountAmount: Number(proposalData.discountAmount),
        discountPercent: Number(proposalData.discountPercent),
        taxAmount: Number(proposalData.taxAmount),
        taxPercent: Number(proposalData.taxPercent),
        totalAmount: Number(proposalData.totalAmount),
        currency: proposalData.currency,
        terms: proposalData.terms || undefined,
        notes: proposalData.notes || undefined,
        version: proposalData.version,
        parentProposalId: proposalData.parentProposalId || undefined,
        createdBy: proposalData.createdBy,
        approvedBy: proposalData.approvedBy || undefined,
        approvedAt: proposalData.approvedAt || undefined,
        createdAt: proposalData.createdAt,
        updatedAt: proposalData.updatedAt,
        items,
        deal: proposalData.dealTitle
          ? {
              id: proposalData.dealId,
              title: proposalData.dealTitle,
              stage: proposalData.dealStage || "",
            }
          : undefined,
        customer: proposalData.customerName
          ? {
              id: proposalData.customerId,
              name: proposalData.customerName,
            }
          : undefined,
        contact:
          proposalData.contactId && proposalData.contactName
            ? {
                id: proposalData.contactId,
                name: proposalData.contactName,
                email: proposalData.contactEmail || "",
              }
            : undefined,
      };

      return validate(proposalWithItemsSchema, proposalWithItems).mapErr(
        (error) => {
          return new RepositoryError("Invalid proposal with items data", error);
        },
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find proposal with items", error),
      );
    }
  }

  async deleteProposal(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // Delete proposal items first
      await this.db
        .delete(proposalItems)
        .where(eq(proposalItems.proposalId, id));

      // Delete proposal
      await this.db.delete(proposals).where(eq(proposals.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete proposal", error));
    }
  }

  async listProposals(
    query: ListProposalsQuery,
  ): Promise<Result<{ items: Proposal[]; count: number }, RepositoryError>> {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.dealId ? eq(proposals.dealId, filter.dealId) : undefined,
      filter?.customerId
        ? eq(proposals.customerId, filter.customerId)
        : undefined,
      filter?.status ? eq(proposals.status, filter.status) : undefined,
      filter?.type ? eq(proposals.type, filter.type) : undefined,
      filter?.createdBy ? eq(proposals.createdBy, filter.createdBy) : undefined,
      filter?.dateFrom
        ? sql`${proposals.createdAt} >= ${filter.dateFrom}`
        : undefined,
      filter?.dateTo
        ? sql`${proposals.createdAt} <= ${filter.dateTo}`
        : undefined,
      filter?.keyword
        ? like(proposals.title, `%${filter.keyword}%`)
        : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(proposals)
          .where(and(...filters))
          .orderBy(desc(proposals.updatedAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(proposals)
          .where(and(...filters)),
      ]);

      const validatedItems = items
        .map((item) =>
          validate(proposalSchema, {
            ...item,
            subtotal: Number(item.subtotal),
            discountAmount: Number(item.discountAmount),
            discountPercent: Number(item.discountPercent),
            taxAmount: Number(item.taxAmount),
            taxPercent: Number(item.taxPercent),
            totalAmount: Number(item.totalAmount),
          }).unwrapOr(null),
        )
        .filter((item) => item !== null);

      return ok({
        items: validatedItems,
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list proposals", error));
    }
  }

  async createProposalItem(
    params: CreateProposalItemParams,
  ): Promise<Result<ProposalItem, RepositoryError>> {
    try {
      // Calculate line total
      const quantity = params.quantity;
      const unitPrice = params.unitPrice;
      const discountAmount = params.discountAmount || 0;
      const discountPercent = params.discountPercent || 0;

      const grossTotal = quantity * unitPrice;
      const discountAmountTotal =
        discountAmount + (grossTotal * discountPercent) / 100;
      const lineTotal = grossTotal - discountAmountTotal;

      const values = {
        ...params,
        quantity: params.quantity.toString(),
        unitPrice: params.unitPrice.toString(),
        discountAmount: (params.discountAmount || 0).toString(),
        discountPercent: (params.discountPercent || 0).toString(),
        lineTotal: lineTotal.toString(),
      };

      const result = await this.db
        .insert(proposalItems)
        .values(values)
        .returning();

      const item = result[0];
      if (!item) {
        return err(new RepositoryError("Failed to create proposal item"));
      }

      // Recalculate proposal totals
      await this.calculateProposalTotals(params.proposalId);

      return validate(proposalItemSchema, {
        ...item,
        productId: item.productId || undefined,
        description: item.description || undefined,
        category: item.category || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
        discountPercent: Number(item.discountPercent),
        lineTotal: Number(item.lineTotal),
        metadata: (item.metadata || {}) as Record<string, unknown>,
      }).mapErr((error) => {
        return new RepositoryError("Invalid proposal item data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create proposal item", error));
    }
  }

  async updateProposalItem(
    params: UpdateProposalItemParams,
  ): Promise<Result<ProposalItem, RepositoryError>> {
    try {
      const { id, ...updateData } = params;

      // Get current item to calculate new line total
      const currentItem = await this.db
        .select()
        .from(proposalItems)
        .where(eq(proposalItems.id, id))
        .limit(1);

      if (currentItem.length === 0) {
        return err(new RepositoryError("Proposal item not found"));
      }

      const current = currentItem[0];
      const quantity = updateData.quantity ?? Number(current.quantity);
      const unitPrice = updateData.unitPrice ?? Number(current.unitPrice);
      const discountAmount =
        updateData.discountAmount ?? Number(current.discountAmount);
      const discountPercent =
        updateData.discountPercent ?? Number(current.discountPercent);

      const grossTotal = quantity * unitPrice;
      const discountAmountTotal =
        discountAmount + (grossTotal * discountPercent) / 100;
      const lineTotal = grossTotal - discountAmountTotal;

      const updateValues = {
        ...updateData,
        quantity: updateData.quantity?.toString(),
        unitPrice: updateData.unitPrice?.toString(),
        discountAmount: updateData.discountAmount?.toString(),
        discountPercent: updateData.discountPercent?.toString(),
        lineTotal: lineTotal.toString(),
        updatedAt: new Date(),
      };

      const result = await this.db
        .update(proposalItems)
        .set(updateValues)
        .where(eq(proposalItems.id, id))
        .returning();

      const item = result[0];
      if (!item) {
        return err(new RepositoryError("Proposal item not found"));
      }

      // Recalculate proposal totals
      await this.calculateProposalTotals(current.proposalId);

      return validate(proposalItemSchema, {
        ...item,
        productId: item.productId || undefined,
        description: item.description || undefined,
        category: item.category || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
        discountPercent: Number(item.discountPercent),
        lineTotal: Number(item.lineTotal),
        metadata: (item.metadata || {}) as Record<string, unknown>,
      }).mapErr((error) => {
        return new RepositoryError("Invalid proposal item data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update proposal item", error));
    }
  }

  async deleteProposalItem(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // Get proposal ID before deleting
      const item = await this.db
        .select({ proposalId: proposalItems.proposalId })
        .from(proposalItems)
        .where(eq(proposalItems.id, id))
        .limit(1);

      if (item.length === 0) {
        return err(new RepositoryError("Proposal item not found"));
      }

      const proposalId = item[0].proposalId;

      // Delete item
      await this.db.delete(proposalItems).where(eq(proposalItems.id, id));

      // Recalculate proposal totals
      await this.calculateProposalTotals(proposalId);

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete proposal item", error));
    }
  }

  async getProposalItems(
    proposalId: string,
  ): Promise<Result<ProposalItem[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(proposalItems)
        .where(eq(proposalItems.proposalId, proposalId))
        .orderBy(proposalItems.sortOrder, proposalItems.createdAt);

      const items = result
        .map((item) =>
          validate(proposalItemSchema, {
            ...item,
            productId: item.productId || undefined,
            description: item.description || undefined,
            category: item.category || undefined,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discountAmount: Number(item.discountAmount),
            discountPercent: Number(item.discountPercent),
            lineTotal: Number(item.lineTotal),
            metadata: (item.metadata || {}) as Record<string, unknown>,
          }).unwrapOr(null),
        )
        .filter((item) => item !== null);

      return ok(items);
    } catch (error) {
      return err(new RepositoryError("Failed to get proposal items", error));
    }
  }

  async createProposalTemplate(
    params: CreateProposalTemplateParams,
  ): Promise<Result<ProposalTemplate, RepositoryError>> {
    try {
      const result = await this.db
        .insert(proposalTemplates)
        .values(params)
        .returning();

      const template = result[0];
      if (!template) {
        return err(new RepositoryError("Failed to create proposal template"));
      }

      return validate(proposalTemplateSchema, template).mapErr((error) => {
        return new RepositoryError("Invalid proposal template data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to create proposal template", error),
      );
    }
  }

  async updateProposalTemplate(
    id: string,
    params: Partial<CreateProposalTemplateParams>,
  ): Promise<Result<ProposalTemplate, RepositoryError>> {
    try {
      const result = await this.db
        .update(proposalTemplates)
        .set({
          ...params,
          updatedAt: new Date(),
        })
        .where(eq(proposalTemplates.id, id))
        .returning();

      const template = result[0];
      if (!template) {
        return err(new RepositoryError("Proposal template not found"));
      }

      return validate(proposalTemplateSchema, template).mapErr((error) => {
        return new RepositoryError("Invalid proposal template data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update proposal template", error),
      );
    }
  }

  async findProposalTemplateById(
    id: string,
  ): Promise<Result<ProposalTemplate | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(proposalTemplates)
        .where(eq(proposalTemplates.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(proposalTemplateSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid proposal template data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to find proposal template", error),
      );
    }
  }

  async deleteProposalTemplate(
    id: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(proposalTemplates)
        .where(eq(proposalTemplates.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to delete proposal template", error),
      );
    }
  }

  async listProposalTemplates(): Promise<
    Result<ProposalTemplate[], RepositoryError>
  > {
    try {
      const result = await this.db
        .select()
        .from(proposalTemplates)
        .where(eq(proposalTemplates.isActive, true))
        .orderBy(proposalTemplates.isDefault, proposalTemplates.name);

      const templates = result
        .map((template) =>
          validate(proposalTemplateSchema, template).unwrapOr(null),
        )
        .filter((template) => template !== null);

      return ok(templates);
    } catch (error) {
      return err(
        new RepositoryError("Failed to list proposal templates", error),
      );
    }
  }

  async duplicateProposal(
    id: string,
    newTitle?: string,
  ): Promise<Result<Proposal, RepositoryError>> {
    try {
      const originalResult = await this.findProposalWithItems(id);
      if (originalResult.isErr()) {
        return err(originalResult.error);
      }

      const original = originalResult.value;
      if (!original) {
        return err(new RepositoryError("Proposal not found"));
      }

      // Create new proposal
      const newProposal = await this.createProposal({
        dealId: original.dealId,
        customerId: original.customerId,
        contactId: original.contactId,
        title: newTitle || `${original.title} (Copy)`,
        description: original.description,
        type: original.type,
        templateId: original.templateId,
        terms: original.terms,
        notes: original.notes,
        currency: original.currency,
        createdBy: original.createdBy,
      });

      if (newProposal.isErr()) {
        return err(newProposal.error);
      }

      // Duplicate items
      for (const item of original.items) {
        await this.createProposalItem({
          proposalId: newProposal.value.id,
          productId: item.productId,
          name: item.name,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          discountPercent: item.discountPercent,
          sortOrder: item.sortOrder,
          metadata: item.metadata,
        });
      }

      return newProposal;
    } catch (error) {
      return err(new RepositoryError("Failed to duplicate proposal", error));
    }
  }

  async createRevision(
    id: string,
    changes: Partial<CreateProposalParams>,
  ): Promise<Result<Proposal, RepositoryError>> {
    try {
      const originalResult = await this.findProposalById(id);
      if (originalResult.isErr()) {
        return err(originalResult.error);
      }

      const original = originalResult.value;
      if (!original) {
        return err(new RepositoryError("Proposal not found"));
      }

      // Create new revision
      const revision = await this.createProposal({
        dealId: original.dealId,
        customerId: original.customerId,
        contactId: original.contactId,
        title: original.title,
        description: original.description,
        type: original.type,
        templateId: original.templateId,
        terms: original.terms,
        notes: original.notes,
        currency: original.currency,
        createdBy: original.createdBy,
        ...changes,
      });

      if (revision.isErr()) {
        return err(revision.error);
      }

      // Update version and parent reference
      const updateResult = await this.updateProposal({
        id: revision.value.id,
        // version: original.version + 1, // This would need to be added to the update schema
        // parentProposalId: id, // This would need to be added to the update schema
      });

      return updateResult;
    } catch (error) {
      return err(new RepositoryError("Failed to create revision", error));
    }
  }

  async updateProposalStatus(
    id: string,
    status: Proposal["status"],
    userId?: string,
  ): Promise<Result<Proposal, RepositoryError>> {
    try {
      const allowedUpdateData: Partial<{
        status:
          | "draft"
          | "pending_approval"
          | "approved"
          | "sent"
          | "viewed"
          | "accepted"
          | "rejected"
          | "expired";
        approvedBy: string;
      }> = { status };

      // Set approvedBy for approved status
      if (status === "approved" && userId) {
        allowedUpdateData.approvedBy = userId;
      }

      // For now, only update status and approvedBy through updateProposal
      // TODO: Timestamp updates need to be handled separately as they're not in UpdateProposalParams
      return this.updateProposal({
        id,
        ...allowedUpdateData,
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update proposal status", error),
      );
    }
  }

  async calculateProposalTotals(
    proposalId: string,
  ): Promise<Result<Proposal, RepositoryError>> {
    try {
      // Get all items for the proposal
      const itemsResult = await this.getProposalItems(proposalId);
      if (itemsResult.isErr()) {
        return err(itemsResult.error);
      }

      const items = itemsResult.value;
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

      // For now, use simple totals without proposal-level discounts/taxes
      const _totalAmount = subtotal;

      return this.updateProposal({
        id: proposalId,
        // subtotal, discountAmount, taxAmount, totalAmount would need to be added to update schema
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to calculate proposal totals", error),
      );
    }
  }

  async getProposalAnalytics(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    customerId?: string;
    createdBy?: string;
  }): Promise<Result<ProposalAnalytics, RepositoryError>> {
    try {
      const whereFilters = [
        filters?.dateFrom
          ? sql`${proposals.createdAt} >= ${filters.dateFrom}`
          : undefined,
        filters?.dateTo
          ? sql`${proposals.createdAt} <= ${filters.dateTo}`
          : undefined,
        filters?.customerId
          ? eq(proposals.customerId, filters.customerId)
          : undefined,
        filters?.createdBy
          ? eq(proposals.createdBy, filters.createdBy)
          : undefined,
      ].filter((filter) => filter !== undefined);

      const [totalResult, statusResult, typeResult, valueResult] =
        await Promise.all([
          this.db
            .select({ count: sql`count(*)` })
            .from(proposals)
            .where(and(...whereFilters)),
          this.db
            .select({
              status: proposals.status,
              count: sql`count(*)`,
            })
            .from(proposals)
            .where(and(...whereFilters))
            .groupBy(proposals.status),
          this.db
            .select({
              type: proposals.type,
              count: sql`count(*)`,
            })
            .from(proposals)
            .where(and(...whereFilters))
            .groupBy(proposals.type),
          this.db
            .select({
              totalValue: sql`sum(${proposals.totalAmount})`,
              avgValue: sql`avg(${proposals.totalAmount})`,
            })
            .from(proposals)
            .where(and(...whereFilters)),
        ]);

      const totalProposals = Number(totalResult[0]?.count ?? 0);
      const proposalsByStatus = statusResult.reduce(
        (acc, row) => {
          acc[row.status] = Number(row.count);
          return acc;
        },
        {} as Record<string, number>,
      );
      const proposalsByType = typeResult.reduce(
        (acc, row) => {
          acc[row.type] = Number(row.count);
          return acc;
        },
        {} as Record<string, number>,
      );

      const totalValue = Number(valueResult[0]?.totalValue ?? 0);
      const averageValue = Number(valueResult[0]?.avgValue ?? 0);

      const acceptedCount = proposalsByStatus.accepted ?? 0;
      const acceptanceRate =
        totalProposals > 0 ? (acceptedCount / totalProposals) * 100 : 0;

      const analytics: ProposalAnalytics = {
        totalProposals,
        proposalsByStatus,
        proposalsByType,
        totalValue,
        averageValue,
        acceptanceRate,
        averageResponseTime: 0, // Would need to calculate from sent/responded dates
        monthlyTrend: [], // Would need to implement monthly aggregation
      };

      return validate(proposalAnalyticsSchema, analytics).mapErr((error) => {
        return new RepositoryError("Invalid analytics data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get analytics", error));
    }
  }
}
