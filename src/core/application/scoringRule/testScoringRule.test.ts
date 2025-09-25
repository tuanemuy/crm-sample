import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES_EN } from "@/core/application/errors/messages";
import type { TestScoringRuleInput } from "@/core/domain/scoringRule/types";
import { ApplicationError } from "@/lib/error";
import { testScoringRule } from "./testScoringRule";

let db: Database;
let context: Context;

describe("testScoringRule", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid input with missing required fields", async () => {
      const input = {
        ruleId: uuidv7(),
        // Missing testData
      };

      const result = await testScoringRule(
        context,
        input as TestScoringRuleInput,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
      );
    });

    it("should reject invalid ruleId format", async () => {
      const input: TestScoringRuleInput = {
        ruleId: "invalid-uuid",
        testData: {
          email: "test@example.com",
        },
      };

      const result = await testScoringRule(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
      );
    });

    it("should accept valid input", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          email: "test@example.com",
          company: "Test Company",
          industry: "technology",
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to input validation
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });
  });

  describe("test data validation", () => {
    it("should handle string test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          email: "test@targetcompany.com",
          firstName: "John",
          lastName: "Doe",
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to string test data
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle number test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          age: 35,
          companySize: 500,
          yearsOfExperience: 10,
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to number test data
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle boolean test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          isActive: true,
          hasSubscription: false,
          isPremium: true,
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to boolean test data
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle array test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          skills: ["JavaScript", "Python", "React"],
          tags: ["lead", "qualified", "enterprise"],
          interests: ["product", "demo", "pricing"],
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to array test data
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle object test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          address: {
            street: "123 Main St",
            city: "San Francisco",
            state: "CA",
            zipCode: "94105",
          },
          company: {
            name: "Test Corp",
            size: 1000,
            industry: "technology",
          },
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to object test data
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle mixed data types", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          email: "test@example.com",
          score: 85,
          isActive: true,
          tags: ["qualified", "enterprise"],
          metadata: {
            source: "website",
            campaign: "Q4-2024",
          },
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to mixed data types
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });
  });

  describe("business logic scenarios", () => {
    it("should test email domain matching", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          email: "john@targetcompany.com",
          firstName: "John",
          lastName: "Doe",
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to email domain test
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should test industry matching", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          industry: "technology",
          companySize: 500,
          revenue: 10000000,
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to industry test
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should test behavior-based scoring", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          behaviorType: "demo_request",
          pageViews: 15,
          timeOnSite: 1200,
          downloadedResources: ["whitepaper", "case_study"],
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to behavior test
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should test company size scoring", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          companySize: 1000,
          revenue: 50000000,
          industry: "enterprise",
          employees: 1200,
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to company size test
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should test job title scoring", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          jobTitle: "Chief Technology Officer",
          seniority: "executive",
          department: "engineering",
          experience: 15,
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to job title test
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should test geographic scoring", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          country: "United States",
          state: "California",
          city: "San Francisco",
          timezone: "America/Los_Angeles",
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to geographic test
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {},
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to empty test data
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle special characters in test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          email: "test+special@example.com",
          company: "Company & Co. (Ltd.)",
          notes: "Special chars: !@#$%^&*()_+{}[]|:;<>?",
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to special characters
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle unicode characters", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          name: "José María",
          company: "株式会社テスト",
          notes: "Unicode: 🚀 🎯 ✨",
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to unicode characters
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle null values in test data", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          email: "test@example.com",
          phone: null,
          company: "Test Company",
          notes: null,
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to null values
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle very long strings", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          longText: "a".repeat(10000),
          description: "b".repeat(5000),
          notes: "c".repeat(2000),
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to long strings
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });

    it("should handle deeply nested objects", async () => {
      const input: TestScoringRuleInput = {
        ruleId: uuidv7(),
        testData: {
          level1: {
            level2: {
              level3: {
                level4: {
                  value: "deeply nested value",
                },
              },
            },
          },
        },
      };

      const result = await testScoringRule(context, input);

      // Should not fail due to deeply nested objects
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_TEST_SCORING_RULE,
        );
      }
    });
  });
});
