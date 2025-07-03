import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
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
} from "../types";

export interface ProposalRepository {
  // Proposal CRUD
  createProposal(
    params: CreateProposalParams,
  ): Promise<Result<Proposal, RepositoryError>>;
  updateProposal(
    params: UpdateProposalParams,
  ): Promise<Result<Proposal, RepositoryError>>;
  findProposalById(
    id: string,
  ): Promise<Result<Proposal | null, RepositoryError>>;
  findProposalWithItems(
    id: string,
  ): Promise<Result<ProposalWithItems | null, RepositoryError>>;
  deleteProposal(id: string): Promise<Result<void, RepositoryError>>;
  listProposals(
    query: ListProposalsQuery,
  ): Promise<Result<{ items: Proposal[]; count: number }, RepositoryError>>;

  // Proposal Items CRUD
  createProposalItem(
    params: CreateProposalItemParams,
  ): Promise<Result<ProposalItem, RepositoryError>>;
  updateProposalItem(
    params: UpdateProposalItemParams,
  ): Promise<Result<ProposalItem, RepositoryError>>;
  deleteProposalItem(id: string): Promise<Result<void, RepositoryError>>;
  getProposalItems(
    proposalId: string,
  ): Promise<Result<ProposalItem[], RepositoryError>>;

  // Proposal Templates CRUD
  createProposalTemplate(
    params: CreateProposalTemplateParams,
  ): Promise<Result<ProposalTemplate, RepositoryError>>;
  updateProposalTemplate(
    id: string,
    params: Partial<CreateProposalTemplateParams>,
  ): Promise<Result<ProposalTemplate, RepositoryError>>;
  findProposalTemplateById(
    id: string,
  ): Promise<Result<ProposalTemplate | null, RepositoryError>>;
  deleteProposalTemplate(id: string): Promise<Result<void, RepositoryError>>;
  listProposalTemplates(): Promise<Result<ProposalTemplate[], RepositoryError>>;

  // Proposal operations
  duplicateProposal(
    id: string,
    newTitle?: string,
  ): Promise<Result<Proposal, RepositoryError>>;
  createRevision(
    id: string,
    changes: Partial<CreateProposalParams>,
  ): Promise<Result<Proposal, RepositoryError>>;
  updateProposalStatus(
    id: string,
    status: Proposal["status"],
    userId?: string,
  ): Promise<Result<Proposal, RepositoryError>>;
  calculateProposalTotals(
    proposalId: string,
  ): Promise<Result<Proposal, RepositoryError>>;

  // Analytics
  getProposalAnalytics(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    customerId?: string;
    createdBy?: string;
  }): Promise<Result<ProposalAnalytics, RepositoryError>>;
}
