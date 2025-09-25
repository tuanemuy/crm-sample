import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createUserTestData } from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { createIntegration } from "./createIntegration";
import { type TestIntegrationInput, testIntegration } from "./testIntegration";

let db: Database;
let context: Context;
let testUserId: string;

describe("testIntegration", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);

    // Create a test user for createdBy field
    const userData = createUserTestData();
    const userResult = await context.userRepository.create({
      ...userData,
      passwordHash: "hash",
      isActive: true,
    });
    expect(userResult.isOk()).toBe(true);
    testUserId = userResult._unsafeUnwrap().id;
  });

  describe("Input Validation", () => {
    it("should reject integration test with invalid UUID", async () => {
      const input: TestIntegrationInput = {
        id: "invalid-uuid",
      };

      const result = await testIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration test",
      );
    });

    it("should reject integration test with empty ID", async () => {
      const input: TestIntegrationInput = {
        id: "",
      };

      const result = await testIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration test",
      );
    });
  });

  describe("Integration Not Found", () => {
    it("should return NotFoundError when integration does not exist", async () => {
      const nonExistentId = uuidv7();
      const input: TestIntegrationInput = {
        id: nonExistentId,
      };

      const result = await testIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe("Integration not found");
    });
  });

  describe("Successful Integration Testing", () => {
    it("should test webhook integration successfully", async () => {
      // Create webhook integration
      const createResult = await createIntegration(context, {
        name: "Test Webhook Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);

      // Verify integration status was updated to active
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("active");
      expect(updatedIntegration?.lastErrorMessage).toBeNull();
    });

    it("should test API integration successfully", async () => {
      // Create API integration
      const createResult = await createIntegration(context, {
        name: "Test API Integration",
        type: "api",
        config: {
          endpoint: "https://api.example.com",
          apiKey: "test-key",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);

      // Verify integration status was updated to active
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("active");
      expect(updatedIntegration?.lastErrorMessage).toBeNull();
    });

    it("should test email integration successfully", async () => {
      // Create email integration
      const createResult = await createIntegration(context, {
        name: "Test Email Integration",
        type: "email",
        config: {
          apiKey: "email-key",
          endpoint: "https://api.email-service.com",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);

      // Verify integration status was updated to active
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("active");
      expect(updatedIntegration?.lastErrorMessage).toBeNull();
    });

    it("should test integration with complex configuration", async () => {
      // Create integration with complex config
      const createResult = await createIntegration(context, {
        name: "Complex Integration",
        type: "api",
        config: {
          endpoint: "https://api.complex.com",
          apiKey: "complex-key",
          apiSecret: "complex-secret",
          credentials: {
            username: "testuser",
            password: "testpass",
          },
          settings: {
            timeout: 30000,
            retries: 3,
          },
          syncInterval: 3600,
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);

      // Verify integration status was updated to active
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("active");
      expect(updatedIntegration?.lastErrorMessage).toBeNull();
    });
  });

  describe("Integration Test Failures", () => {
    it("should handle integration test failure and update status to error", async () => {
      // Create integration with invalid config that will fail testing
      const createResult = await createIntegration(context, {
        name: "Failing Integration",
        type: "api",
        config: {
          endpoint: "https://nonexistent.invalid.domain.com",
          apiKey: "invalid-key",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Integration test failed");

      // Verify integration status was updated to error
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("error");
      expect(updatedIntegration?.lastErrorMessage).toBeDefined();
    });

    it("should handle webhook integration test failure", async () => {
      // Create webhook integration with invalid URL
      const createResult = await createIntegration(context, {
        name: "Failing Webhook Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://nonexistent.invalid.domain.com/webhook",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Integration test failed");

      // Verify integration status was updated to error
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("error");
      expect(updatedIntegration?.lastErrorMessage).toBeDefined();
    });

    it("should handle email integration test failure", async () => {
      // Create email integration with invalid config
      const createResult = await createIntegration(context, {
        name: "Failing Email Integration",
        type: "email",
        config: {
          apiKey: "invalid-key",
          endpoint: "https://nonexistent.email-service.com",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Integration test failed");

      // Verify integration status was updated to error
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("error");
      expect(updatedIntegration?.lastErrorMessage).toBeDefined();
    });
  });

  describe("Integration Types Coverage", () => {
    const supportedTypes = [
      "email",
      "calendar",
      "slack",
      "teams",
      "salesforce",
      "hubspot",
      "zapier",
      "webhook",
      "api",
      "database",
      "file_storage",
      "payment_gateway",
      "analytics",
      "social_media",
    ];

    supportedTypes.forEach((type) => {
      it(`should test ${type} integration`, async () => {
        // Create integration of the specific type
        const createResult = await createIntegration(context, {
          name: `Test ${type} Integration`,
          type: type as any,
          config:
            type === "webhook"
              ? {
                  webhookUrl: "https://example.com/webhook",
                }
              : type === "api"
                ? {
                    endpoint: "https://api.example.com",
                    apiKey: "test-key",
                  }
                : {
                    apiKey: "test-key",
                    endpoint: "https://api.example.com",
                  },
          createdBy: testUserId,
        });
        expect(createResult.isOk()).toBe(true);
        const integration = createResult._unsafeUnwrap();

        const input: TestIntegrationInput = {
          id: integration.id,
        };

        const result = await testIntegration(context, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBe(true);

        // Verify integration status was updated to active
        const updatedIntegrationResult =
          await context.integrationRepository.findById(integration.id);
        expect(updatedIntegrationResult.isOk()).toBe(true);
        const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
        expect(updatedIntegration?.status).toBe("active");
        expect(updatedIntegration?.lastErrorMessage).toBeNull();
      });
    });
  });

  describe("Status Transition Testing", () => {
    it("should transition from error to active on successful test", async () => {
      // Create integration
      const createResult = await createIntegration(context, {
        name: "Status Transition Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      // Manually set to error status
      await context.integrationRepository.update(integration.id, {
        status: "error",
        lastErrorMessage: "Previous error",
      });

      // Test integration
      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);

      // Verify status transitioned to active and error message cleared
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("active");
      expect(updatedIntegration?.lastErrorMessage).toBeNull();
    });

    it("should transition from active to error on failed test", async () => {
      // Create integration with config that will fail
      const createResult = await createIntegration(context, {
        name: "Status Transition Integration",
        type: "api",
        config: {
          endpoint: "https://nonexistent.invalid.domain.com",
          apiKey: "invalid-key",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      // Test integration
      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Integration test failed");

      // Verify status transitioned to error
      const updatedIntegrationResult =
        await context.integrationRepository.findById(integration.id);
      expect(updatedIntegrationResult.isOk()).toBe(true);
      const updatedIntegration = updatedIntegrationResult._unsafeUnwrap();
      expect(updatedIntegration?.status).toBe("error");
      expect(updatedIntegration?.lastErrorMessage).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle testing integration with minimal configuration", async () => {
      // Create integration with minimal config
      const createResult = await createIntegration(context, {
        name: "Minimal Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/minimal",
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it("should handle testing system-wide integration", async () => {
      // Create system-wide integration
      const createResult = await createIntegration(context, {
        name: "System-wide Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/system",
        },
        isSystemwide: true,
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it("should handle testing user-specific integration", async () => {
      // Create user-specific integration
      const createResult = await createIntegration(context, {
        name: "User-specific Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/user",
        },
        isSystemwide: false,
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it("should handle testing disabled integration", async () => {
      // Create disabled integration
      const createResult = await createIntegration(context, {
        name: "Disabled Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/disabled",
          isEnabled: false,
        },
        createdBy: testUserId,
      });
      expect(createResult.isOk()).toBe(true);
      const integration = createResult._unsafeUnwrap();

      const input: TestIntegrationInput = {
        id: integration.id,
      };

      const result = await testIntegration(context, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });
  });
});
