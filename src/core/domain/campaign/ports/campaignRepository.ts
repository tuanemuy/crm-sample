import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  AssignLeadsToCampaignParams,
  Campaign,
  CampaignLead,
  CampaignWithStats,
  CreateCampaignParams,
  ListCampaignLeadsQuery,
  ListCampaignsQuery,
  UpdateCampaignParams,
} from "../types";

export interface CampaignRepository {
  // Campaign CRUD operations
  create(
    params: CreateCampaignParams,
  ): Promise<Result<Campaign, RepositoryError>>;
  findById(id: string): Promise<Result<Campaign | null, RepositoryError>>;
  findByIdWithStats(
    id: string,
  ): Promise<Result<CampaignWithStats | null, RepositoryError>>;
  update(
    params: UpdateCampaignParams,
  ): Promise<Result<Campaign, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
  list(
    query: ListCampaignsQuery,
  ): Promise<Result<{ items: Campaign[]; count: number }, RepositoryError>>;

  // Campaign lead assignment operations
  assignLeads(
    params: AssignLeadsToCampaignParams,
  ): Promise<Result<CampaignLead[], RepositoryError>>;
  unassignLead(
    campaignId: string,
    leadId: string,
  ): Promise<Result<void, RepositoryError>>;
  updateLeadStatus(
    campaignId: string,
    leadId: string,
    status: CampaignLead["status"],
    notes?: string,
  ): Promise<Result<CampaignLead, RepositoryError>>;

  // Campaign lead queries
  listCampaignLeads(
    query: ListCampaignLeadsQuery,
  ): Promise<Result<{ items: CampaignLead[]; count: number }, RepositoryError>>;
  findCampaignLead(
    campaignId: string,
    leadId: string,
  ): Promise<Result<CampaignLead | null, RepositoryError>>;

  // Lead campaign queries (find campaigns for a lead)
  findLeadCampaigns(
    leadId: string,
  ): Promise<Result<Campaign[], RepositoryError>>;

  // Statistics and analytics
  getCampaignStats(
    campaignId: string,
  ): Promise<Result<Omit<CampaignWithStats, keyof Campaign>, RepositoryError>>;
}
