import { and, asc, count, desc, eq, gte, like, lte } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ScoringRuleRepository } from "@/core/domain/scoringRule/ports/scoringRuleRepository";
import {
  type CreateScoringRuleParams,
  type ListScoringRulesQuery,
  type ScoringRule,
  type ScoringRuleWithCreator,
  scoringRuleSchema,
  type UpdateScoringRuleParams,
} from "@/core/domain/scoringRule/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { scoringRules, users } from "./schema";

export class DrizzlePqliteScoringRuleRepository
  implements ScoringRuleRepository
{
  constructor(private readonly db: Database) {}

  async create(
    params: CreateScoringRuleParams,
  ): Promise<Result<ScoringRule, RepositoryError>> {
    try {
      const result = await this.db
        .insert(scoringRules)
        .values(params)
        .returning();

      const rule = result[0];
      if (!rule) {
        return err(new RepositoryError("Failed to create scoring rule"));
      }

      return validate(scoringRuleSchema, rule).mapErr((error) => {
        return new RepositoryError("Invalid scoring rule data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create scoring rule", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<ScoringRule | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(scoringRules)
        .where(eq(scoringRules.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(scoringRuleSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid scoring rule data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find scoring rule", error));
    }
  }

  async findByIdWithCreator(
    id: string,
  ): Promise<Result<ScoringRuleWithCreator | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          rule: scoringRules,
          createdByUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(scoringRules)
        .innerJoin(users, eq(scoringRules.createdByUserId, users.id))
        .where(eq(scoringRules.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      // Validate the rule data first to ensure proper typing of condition
      const validatedRule = validate(scoringRuleSchema, result[0].rule);
      if (validatedRule.isErr()) {
        return err(
          new RepositoryError("Invalid scoring rule data", validatedRule.error),
        );
      }

      const ruleWithCreator = {
        ...validatedRule.value,
        createdByUser: result[0].createdByUser,
      };

      return ok(ruleWithCreator);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find scoring rule with creator", error),
      );
    }
  }

  async list(
    query: ListScoringRulesQuery,
  ): Promise<Result<{ items: ScoringRule[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword
        ? like(scoringRules.name, `%${filter.keyword}%`)
        : undefined,
      filter?.isActive !== undefined
        ? eq(scoringRules.isActive, filter.isActive)
        : undefined,
      filter?.createdByUserId
        ? eq(scoringRules.createdByUserId, filter.createdByUserId)
        : undefined,
      filter?.minScore ? gte(scoringRules.score, filter.minScore) : undefined,
      filter?.maxScore ? lte(scoringRules.score, filter.maxScore) : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "name"
        ? scoringRules.name
        : sortBy === "score"
          ? scoringRules.score
          : sortBy === "priority"
            ? scoringRules.priority
            : sortBy === "updatedAt"
              ? scoringRules.updatedAt
              : scoringRules.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(scoringRules)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(scoringRules)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(scoringRuleSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list scoring rules", error));
    }
  }

  async update(
    id: string,
    params: UpdateScoringRuleParams,
  ): Promise<Result<ScoringRule, RepositoryError>> {
    try {
      const result = await this.db
        .update(scoringRules)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(scoringRules.id, id))
        .returning();

      const rule = result[0];
      if (!rule) {
        return err(new RepositoryError("Scoring rule not found"));
      }

      return validate(scoringRuleSchema, rule).mapErr((error) => {
        return new RepositoryError("Invalid scoring rule data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update scoring rule", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(scoringRules)
        .where(eq(scoringRules.id, id))
        .returning({ id: scoringRules.id });

      if (result.length === 0) {
        return err(new RepositoryError("Scoring rule not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete scoring rule", error));
    }
  }

  async findActive(): Promise<Result<ScoringRule[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(scoringRules)
        .where(eq(scoringRules.isActive, true))
        .orderBy(asc(scoringRules.priority), asc(scoringRules.name));

      return ok(
        result
          .map((item) => validate(scoringRuleSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find active scoring rules", error),
      );
    }
  }

  async findByCreatedByUser(
    userId: string,
  ): Promise<Result<ScoringRule[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(scoringRules)
        .where(eq(scoringRules.createdByUserId, userId))
        .orderBy(desc(scoringRules.updatedAt));

      return ok(
        result
          .map((item) => validate(scoringRuleSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find scoring rules by creator", error),
      );
    }
  }

  async activate(id: string): Promise<Result<ScoringRule, RepositoryError>> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<Result<ScoringRule, RepositoryError>> {
    return this.update(id, { isActive: false });
  }

  async updatePriority(
    id: string,
    priority: number,
  ): Promise<Result<ScoringRule, RepositoryError>> {
    return this.update(id, { priority });
  }

  async reorderPriorities(
    ruleIds: string[],
  ): Promise<Result<void, RepositoryError>> {
    try {
      // Update priorities based on the order in the array
      for (let i = 0; i < ruleIds.length; i++) {
        await this.db
          .update(scoringRules)
          .set({ priority: (i + 1) * 10, updatedAt: new Date() })
          .where(eq(scoringRules.id, ruleIds[i]));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to reorder priorities", error));
    }
  }
}
