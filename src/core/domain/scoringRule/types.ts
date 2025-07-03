import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Scoring condition schema
export const scoringConditionSchema = z.object({
  field: z.string(), // email, company, industry, behavior_type, etc.
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "greater_than",
    "less_than",
    "in",
    "not_in",
  ]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
  logic: z.enum(["and", "or"]).optional(),
});

export type ScoringCondition = z.infer<typeof scoringConditionSchema>;

// Scoring rule entity schema
export const scoringRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  condition: z.array(scoringConditionSchema),
  score: z.number().int(),
  isActive: z.boolean(),
  priority: z.number().int(),
  createdByUserId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScoringRule = z.infer<typeof scoringRuleSchema>;

// Scoring rule creation input schema
export const createScoringRuleInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  condition: z.array(scoringConditionSchema).min(1),
  score: z.number().int().min(-100).max(100),
  priority: z.number().int().min(1).max(1000).default(100),
  createdByUserId: z.string().uuid(),
});

export type CreateScoringRuleInput = z.infer<
  typeof createScoringRuleInputSchema
>;

// Scoring rule update input schema
export const updateScoringRuleInputSchema = createScoringRuleInputSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type UpdateScoringRuleInput = z.infer<
  typeof updateScoringRuleInputSchema
>;

// Scoring rule filter schema
export const scoringRuleFilterSchema = z.object({
  keyword: z.string().optional(),
  isActive: z.boolean().optional(),
  createdByUserId: z.string().uuid().optional(),
  minScore: z.number().int().optional(),
  maxScore: z.number().int().optional(),
});

export type ScoringRuleFilter = z.infer<typeof scoringRuleFilterSchema>;

// Scoring rule list query schema
export const listScoringRulesQuerySchema = z.object({
  pagination: paginationSchema,
  filter: scoringRuleFilterSchema.optional(),
  sortBy: z
    .enum(["name", "score", "priority", "createdAt", "updatedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListScoringRulesQuery = z.infer<typeof listScoringRulesQuerySchema>;

// Scoring rule repository params
export const createScoringRuleParamsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  condition: z.array(scoringConditionSchema),
  score: z.number().int(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(100),
  createdByUserId: z.string().uuid(),
});

export type CreateScoringRuleParams = z.infer<
  typeof createScoringRuleParamsSchema
>;

export const updateScoringRuleParamsSchema =
  createScoringRuleParamsSchema.partial();
export type UpdateScoringRuleParams = z.infer<
  typeof updateScoringRuleParamsSchema
>;

// Scoring rule with creator info
export const scoringRuleWithCreatorSchema = scoringRuleSchema.extend({
  createdByUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
});

export type ScoringRuleWithCreator = z.infer<
  typeof scoringRuleWithCreatorSchema
>;

// Lead scoring evaluation
export const leadScoringEvaluationSchema = z.object({
  leadId: z.string().uuid(),
  currentScore: z.number().int(),
  newScore: z.number().int(),
  appliedRules: z.array(
    z.object({
      ruleId: z.string().uuid(),
      ruleName: z.string(),
      score: z.number().int(),
      matched: z.boolean(),
    }),
  ),
  totalScoreChange: z.number().int(),
});

export type LeadScoringEvaluation = z.infer<typeof leadScoringEvaluationSchema>;

// Scoring rule test input
export const testScoringRuleInputSchema = z.object({
  ruleId: z.string().uuid(),
  testData: z.record(z.string(), z.unknown()),
});

export type TestScoringRuleInput = z.infer<typeof testScoringRuleInputSchema>;

// Scoring rule test result
export const scoringRuleTestResultSchema = z.object({
  ruleId: z.string().uuid(),
  ruleName: z.string(),
  matched: z.boolean(),
  score: z.number().int(),
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.string(),
      expectedValue: z.unknown(),
      actualValue: z.unknown(),
      matched: z.boolean(),
    }),
  ),
});

export type ScoringRuleTestResult = z.infer<typeof scoringRuleTestResultSchema>;
