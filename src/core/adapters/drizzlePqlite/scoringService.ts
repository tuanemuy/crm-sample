import { eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ScoringService } from "@/core/domain/scoringRule/ports/scoringRuleRepository";
import type {
  LeadScoringEvaluation,
  ScoringCondition,
  ScoringRule,
  ScoringRuleTestResult,
} from "@/core/domain/scoringRule/types";
import { RepositoryError } from "@/lib/error";
import type { Database } from "./client";
import { leads, scoringRules } from "./schema";

export class DrizzlePqliteScoringService implements ScoringService {
  constructor(private readonly db: Database) {}

  async evaluateLeadScore(
    leadId: string,
  ): Promise<Result<LeadScoringEvaluation, RepositoryError>> {
    try {
      // Get the lead data
      const leadResult = await this.db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);

      if (leadResult.length === 0) {
        return err(new RepositoryError("Lead not found"));
      }

      const lead = leadResult[0];
      const currentScore = lead.score;

      // Get active scoring rules
      const rulesResult = await this.db
        .select()
        .from(scoringRules)
        .where(eq(scoringRules.isActive, true))
        .orderBy(scoringRules.priority);

      // Convert lead to evaluation data
      const leadData = {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        title: lead.title,
        industry: lead.industry,
        source: lead.source,
        status: lead.status,
        tags: lead.tags,
      };

      const appliedRules: LeadScoringEvaluation["appliedRules"] = [];
      let totalScore = 0;

      // Evaluate each rule
      for (const rule of rulesResult) {
        const matched = this.evaluateConditions(
          rule.condition as ScoringCondition[],
          leadData,
        );

        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          score: rule.score,
          matched,
        });

        if (matched) {
          totalScore += rule.score;
        }
      }

      // Ensure score is within bounds (0-100)
      const newScore = Math.max(0, Math.min(100, totalScore));
      const totalScoreChange = newScore - currentScore;

      // Update the lead's score
      await this.db
        .update(leads)
        .set({ score: newScore, updatedAt: new Date() })
        .where(eq(leads.id, leadId));

      return ok({
        leadId,
        currentScore,
        newScore,
        appliedRules,
        totalScoreChange,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to evaluate lead score", error));
    }
  }

  async testRule(
    ruleId: string,
    testData: Record<string, unknown>,
  ): Promise<Result<ScoringRuleTestResult, RepositoryError>> {
    try {
      // Get the scoring rule
      const ruleResult = await this.db
        .select()
        .from(scoringRules)
        .where(eq(scoringRules.id, ruleId))
        .limit(1);

      if (ruleResult.length === 0) {
        return err(new RepositoryError("Scoring rule not found"));
      }

      const rule = ruleResult[0];
      const conditions = rule.condition as ScoringCondition[];

      const matched = this.evaluateConditions(conditions, testData);

      const conditionResults = conditions.map((condition) => ({
        field: condition.field,
        operator: condition.operator,
        expectedValue: condition.value,
        actualValue: testData[condition.field],
        matched: this.evaluateCondition(condition, testData),
      }));

      return ok({
        ruleId,
        ruleName: rule.name,
        matched,
        score: matched ? rule.score : 0,
        conditions: conditionResults,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to test scoring rule", error));
    }
  }

  async calculateScore(
    leadData: Record<string, unknown>,
    rules?: ScoringRule[],
  ): Promise<Result<number, RepositoryError>> {
    try {
      let scoringRulesList: ScoringRule[];

      if (rules) {
        scoringRulesList = rules;
      } else {
        // Get active scoring rules if not provided
        const rulesResult = await this.db
          .select()
          .from(scoringRules)
          .where(eq(scoringRules.isActive, true))
          .orderBy(scoringRules.priority);

        scoringRulesList = rulesResult as ScoringRule[];
      }

      let totalScore = 0;

      for (const rule of scoringRulesList) {
        const conditions = rule.condition as ScoringCondition[];
        const matched = this.evaluateConditions(conditions, leadData);

        if (matched) {
          totalScore += rule.score;
        }
      }

      // Ensure score is within bounds (0-100)
      const finalScore = Math.max(0, Math.min(100, totalScore));

      return ok(finalScore);
    } catch (error) {
      return err(new RepositoryError("Failed to calculate score", error));
    }
  }

  async bulkUpdateLeadScores(): Promise<Result<number, RepositoryError>> {
    try {
      // Get all leads
      const leadsResult = await this.db.select().from(leads);

      let updatedCount = 0;

      for (const lead of leadsResult) {
        const evaluation = await this.evaluateLeadScore(lead.id);
        if (evaluation.isOk()) {
          updatedCount++;
        }
      }

      return ok(updatedCount);
    } catch (error) {
      return err(
        new RepositoryError("Failed to bulk update lead scores", error),
      );
    }
  }

  private evaluateConditions(
    conditions: ScoringCondition[],
    data: Record<string, unknown>,
  ): boolean {
    if (conditions.length === 0) {
      return false;
    }

    // Group conditions by logic operator
    const andConditions: ScoringCondition[] = [];
    const orConditions: ScoringCondition[] = [];

    for (const condition of conditions) {
      if (condition.logic === "or") {
        orConditions.push(condition);
      } else {
        andConditions.push(condition);
      }
    }

    // All AND conditions must be true
    const andResult =
      andConditions.length === 0 ||
      andConditions.every((condition) =>
        this.evaluateCondition(condition, data),
      );

    // At least one OR condition must be true (if any exist)
    const orResult =
      orConditions.length === 0 ||
      orConditions.some((condition) => this.evaluateCondition(condition, data));

    return andResult && orResult;
  }

  private evaluateCondition(
    condition: ScoringCondition,
    data: Record<string, unknown>,
  ): boolean {
    const fieldValue = data[condition.field];
    const expectedValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return fieldValue === expectedValue;

      case "not_equals":
        return fieldValue !== expectedValue;

      case "contains":
        return String(fieldValue || "")
          .toLowerCase()
          .includes(String(expectedValue || "").toLowerCase());

      case "not_contains":
        return !String(fieldValue || "")
          .toLowerCase()
          .includes(String(expectedValue || "").toLowerCase());

      case "starts_with":
        return String(fieldValue || "")
          .toLowerCase()
          .startsWith(String(expectedValue || "").toLowerCase());

      case "ends_with":
        return String(fieldValue || "")
          .toLowerCase()
          .endsWith(String(expectedValue || "").toLowerCase());

      case "greater_than":
        return Number(fieldValue || 0) > Number(expectedValue || 0);

      case "less_than":
        return Number(fieldValue || 0) < Number(expectedValue || 0);

      case "in":
        if (Array.isArray(expectedValue)) {
          return expectedValue.includes(String(fieldValue || ""));
        }
        return false;

      case "not_in":
        if (Array.isArray(expectedValue)) {
          return !expectedValue.includes(String(fieldValue || ""));
        }
        return true;

      default:
        return false;
    }
  }
}
