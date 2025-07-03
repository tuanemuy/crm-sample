import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateScoringRuleParams,
  LeadScoringEvaluation,
  ListScoringRulesQuery,
  ScoringRule,
  ScoringRuleTestResult,
  ScoringRuleWithCreator,
  UpdateScoringRuleParams,
} from "../types";

export interface ScoringRuleRepository {
  create(
    params: CreateScoringRuleParams,
  ): Promise<Result<ScoringRule, RepositoryError>>;

  findById(id: string): Promise<Result<ScoringRule | null, RepositoryError>>;

  findByIdWithCreator(
    id: string,
  ): Promise<Result<ScoringRuleWithCreator | null, RepositoryError>>;

  list(
    query: ListScoringRulesQuery,
  ): Promise<Result<{ items: ScoringRule[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateScoringRuleParams,
  ): Promise<Result<ScoringRule, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findActive(): Promise<Result<ScoringRule[], RepositoryError>>;

  findByCreatedByUser(
    userId: string,
  ): Promise<Result<ScoringRule[], RepositoryError>>;

  activate(id: string): Promise<Result<ScoringRule, RepositoryError>>;

  deactivate(id: string): Promise<Result<ScoringRule, RepositoryError>>;

  updatePriority(
    id: string,
    priority: number,
  ): Promise<Result<ScoringRule, RepositoryError>>;

  reorderPriorities(ruleIds: string[]): Promise<Result<void, RepositoryError>>;
}

// Scoring service interface for lead scoring calculations
export interface ScoringService {
  evaluateLeadScore(
    leadId: string,
  ): Promise<Result<LeadScoringEvaluation, RepositoryError>>;

  testRule(
    ruleId: string,
    testData: Record<string, unknown>,
  ): Promise<Result<ScoringRuleTestResult, RepositoryError>>;

  calculateScore(
    leadData: Record<string, unknown>,
    rules?: ScoringRule[],
  ): Promise<Result<number, RepositoryError>>;

  bulkUpdateLeadScores(): Promise<Result<number, RepositoryError>>;
}
