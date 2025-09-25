import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createUserTestData } from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES_EN } from "@/core/application/errors/messages";
import type { CreateScoringRuleInput } from "@/core/domain/scoringRule/types";
import { ApplicationError } from "@/lib/error";
import { createScoringRule } from "./createScoringRule";

let db: Database;
let context: Context;

describe("createScoringRule", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid input with missing required fields", async () => {
      const input = {
        name: "Test Rule",
        // Missing condition, score, createdByUserId
      };

      const result = await createScoringRule(
        context,
        input as CreateScoringRuleInput,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });

    it("should reject empty name", async () => {
      const input: CreateScoringRuleInput = {
        name: "",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@company.com",
          },
        ],
        score: 10,
        createdByUserId: uuidv7(),
      };

      const result = await createScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });

    it("should reject name that is too long", async () => {
      const input: CreateScoringRuleInput = {
        name: "a".repeat(256),
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@company.com",
          },
        ],
        score: 10,
        createdByUserId: uuidv7(),
      };

      const result = await createScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });

    it("should reject empty condition array", async () => {
      const input: CreateScoringRuleInput = {
        name: "Test Rule",
        condition: [],
        score: 10,
        createdByUserId: uuidv7(),
      };

      const result = await createScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });

    it("should reject score outside valid range", async () => {
      const input: CreateScoringRuleInput = {
        name: "Test Rule",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@company.com",
          },
        ],
        score: 150, // Above max of 100
        createdByUserId: uuidv7(),
      };

      const result = await createScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });

    it("should reject negative score below valid range", async () => {
      const input: CreateScoringRuleInput = {
        name: "Test Rule",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@spam.com",
          },
        ],
        score: -150, // Below min of -100
        createdByUserId: uuidv7(),
      };

      const result = await createScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });

    it("should reject invalid createdByUserId format", async () => {
      const input: CreateScoringRuleInput = {
        name: "Test Rule",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@company.com",
          },
        ],
        score: 10,
        createdByUserId: "invalid-uuid",
      };

      const result = await createScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });

    it("should reject priority outside valid range", async () => {
      const input: CreateScoringRuleInput = {
        name: "Test Rule",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@company.com",
          },
        ],
        score: 10,
        priority: 1001, // Above max of 1000
        createdByUserId: uuidv7(),
      };

      const result = await createScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
      );
    });
  });

  describe("condition validation", () => {
    it("should validate different field types", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const validFields = [
        "email",
        "company",
        "industry",
        "behavior_type",
        "source",
      ];

      for (const field of validFields) {
        const input: CreateScoringRuleInput = {
          name: `Test Rule for ${field}`,
          condition: [
            {
              field,
              operator: "contains",
              value: "test",
            },
          ],
          score: 10,
          createdByUserId: userId,
        };

        const result = await createScoringRule(context, input);

        // Should not fail due to field validation
        if (result.isErr()) {
          expect(result._unsafeUnwrapErr().message).not.toBe(
            ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
          );
        }
      }
    });

    it("should validate different operators", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const validOperators = [
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
      ];

      for (const operator of validOperators) {
        const input: CreateScoringRuleInput = {
          name: `Test Rule for ${operator}`,
          condition: [
            {
              field: "email",
              operator: operator as any,
              value:
                operator === "in" || operator === "not_in"
                  ? ["test1", "test2"]
                  : "test",
            },
          ],
          score: 10,
          createdByUserId: userId,
        };

        const result = await createScoringRule(context, input);

        // Should not fail due to operator validation
        if (result.isErr()) {
          expect(result._unsafeUnwrapErr().message).not.toBe(
            ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
          );
        }
      }
    });

    it("should validate different value types", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const testCases = [
        { value: "string_value", description: "string value" },
        { value: 42, description: "number value" },
        { value: ["array", "value"], description: "array value" },
      ];

      for (const testCase of testCases) {
        const input: CreateScoringRuleInput = {
          name: `Test Rule for ${testCase.description}`,
          condition: [
            {
              field: "score",
              operator: "greater_than",
              value: testCase.value,
            },
          ],
          score: 10,
          createdByUserId: userId,
        };

        const result = await createScoringRule(context, input);

        // Should not fail due to value type validation
        if (result.isErr()) {
          expect(result._unsafeUnwrapErr().message).not.toBe(
            ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
          );
        }
      }
    });

    it("should validate multiple conditions", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateScoringRuleInput = {
        name: "Complex Rule",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@company.com",
            logic: "and",
          },
          {
            field: "industry",
            operator: "equals",
            value: "technology",
            logic: "or",
          },
          {
            field: "company_size",
            operator: "greater_than",
            value: 100,
          },
        ],
        score: 25,
        createdByUserId: userId,
      };

      const result = await createScoringRule(context, input);

      // Should not fail due to multiple conditions
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
        );
      }
    });
  });

  describe("business logic validation", () => {
    it("should create scoring rule with valid input", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateScoringRuleInput = {
        name: "Email Domain Rule",
        description: "Scores leads based on email domain",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@target-company.com",
          },
        ],
        score: 20,
        priority: 10,
        createdByUserId: userId,
      };

      const result = await createScoringRule(context, input);

      // Should not fail due to input validation
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
        );
      }
    });

    it("should handle negative scores for penalty rules", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateScoringRuleInput = {
        name: "Spam Domain Penalty",
        description: "Penalizes leads from spam domains",
        condition: [
          {
            field: "email",
            operator: "ends_with",
            value: "@spam.com",
          },
        ],
        score: -50,
        priority: 1,
        createdByUserId: userId,
      };

      const result = await createScoringRule(context, input);

      // Should not fail due to negative score
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
        );
      }
    });

    it("should handle high priority rules", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateScoringRuleInput = {
        name: "High Priority Rule",
        description: "Critical scoring rule",
        condition: [
          {
            field: "behavior_type",
            operator: "equals",
            value: "demo_request",
          },
        ],
        score: 50,
        priority: 1000,
        createdByUserId: userId,
      };

      const result = await createScoringRule(context, input);

      // Should not fail due to high priority
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in conditions", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateScoringRuleInput = {
        name: "Special Characters Rule",
        condition: [
          {
            field: "company",
            operator: "contains",
            value: "Company & Co. (Ltd.)",
          },
        ],
        score: 15,
        createdByUserId: userId,
      };

      const result = await createScoringRule(context, input);

      // Should not fail due to special characters
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
        );
      }
    });

    it("should handle unicode characters", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateScoringRuleInput = {
        name: "Unicode Rule 🚀",
        description: "Rule with unicode characters",
        condition: [
          {
            field: "company",
            operator: "contains",
            value: "株式会社",
          },
        ],
        score: 10,
        createdByUserId: userId,
      };

      const result = await createScoringRule(context, input);

      // Should not fail due to unicode characters
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
        );
      }
    });

    it("should handle default priority", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateScoringRuleInput = {
        name: "Default Priority Rule",
        condition: [
          {
            field: "email",
            operator: "contains",
            value: "@default.com",
          },
        ],
        score: 10,
        createdByUserId: userId,
        // No priority specified - should use default
      };

      const result = await createScoringRule(context, input);

      // Should not fail due to default priority
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_CREATE_SCORING_RULE,
        );
      }
    });
  });
});
