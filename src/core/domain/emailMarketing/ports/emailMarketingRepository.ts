import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
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
} from "../types";

export interface EmailMarketingRepository {
  // Email Template CRUD operations
  createTemplate(
    params: CreateEmailTemplateParams,
  ): Promise<Result<EmailTemplate, RepositoryError>>;
  findTemplateById(
    id: string,
  ): Promise<Result<EmailTemplate | null, RepositoryError>>;
  updateTemplate(
    params: UpdateEmailTemplateParams,
  ): Promise<Result<EmailTemplate, RepositoryError>>;
  deleteTemplate(id: string): Promise<Result<void, RepositoryError>>;
  listTemplates(
    query: ListEmailTemplatesQuery,
  ): Promise<
    Result<{ items: EmailTemplate[]; count: number }, RepositoryError>
  >;

  // Email Campaign CRUD operations
  createCampaign(
    params: CreateEmailCampaignParams,
  ): Promise<Result<EmailCampaign, RepositoryError>>;
  findCampaignById(
    id: string,
  ): Promise<Result<EmailCampaign | null, RepositoryError>>;
  findCampaignByIdWithStats(
    id: string,
  ): Promise<Result<EmailCampaignWithStats | null, RepositoryError>>;
  updateCampaign(
    params: UpdateEmailCampaignParams,
  ): Promise<Result<EmailCampaign, RepositoryError>>;
  deleteCampaign(id: string): Promise<Result<void, RepositoryError>>;
  listCampaigns(
    query: ListEmailCampaignsQuery,
  ): Promise<
    Result<{ items: EmailCampaign[]; count: number }, RepositoryError>
  >;

  // Email History operations
  recordEmailHistory(
    params: RecordEmailHistoryParams,
  ): Promise<Result<EmailHistory, RepositoryError>>;
  updateEmailStatus(
    params: UpdateEmailStatusParams,
  ): Promise<Result<EmailHistory, RepositoryError>>;
  findEmailHistoryById(
    id: string,
  ): Promise<Result<EmailHistory | null, RepositoryError>>;
  listEmailHistory(
    query: ListEmailHistoryQuery,
  ): Promise<Result<{ items: EmailHistory[]; count: number }, RepositoryError>>;
  listEmailHistoryWithLeads(
    query: ListEmailHistoryQuery,
  ): Promise<
    Result<{ items: EmailHistoryWithLead[]; count: number }, RepositoryError>
  >;

  // Analytics and reporting
  getCampaignStats(
    campaignId: string,
  ): Promise<Result<EmailCampaignWithStats, RepositoryError>>;
  getLeadEmailHistory(
    leadId: string,
  ): Promise<Result<EmailHistory[], RepositoryError>>;
  getCustomerEmailHistory(
    customerId: string,
  ): Promise<Result<EmailHistory[], RepositoryError>>;

  // Campaign management
  findCampaignsByParentCampaign(
    campaignId: string,
  ): Promise<Result<EmailCampaign[], RepositoryError>>;
}
