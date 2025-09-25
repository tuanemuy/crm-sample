import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createUserTestData } from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import {
  type CreateIntegrationInput,
  createIntegration,
} from "./createIntegration";

let db: Database;
let context: Context;
let testUserId: string;

describe("createIntegration", () => {
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
    it("should reject integration creation with empty name", async () => {
      const input: CreateIntegrationInput = {
        name: "",
        type: "email",
        config: {},
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration creation",
      );
    });

    it("should reject integration creation with name exceeding 255 characters", async () => {
      const input: CreateIntegrationInput = {
        name: "a".repeat(256),
        type: "email",
        config: {},
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration creation",
      );
    });

    it("should reject integration creation with invalid type", async () => {
      const input = {
        name: "Test Integration",
        type: "invalid_type",
        config: {},
        createdBy: testUserId,
      } as CreateIntegrationInput;

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration creation",
      );
    });

    it("should reject integration creation with invalid createdBy UUID", async () => {
      const input = {
        name: "Test Integration",
        type: "email",
        config: {},
        createdBy: "invalid-uuid",
      } as CreateIntegrationInput;

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration creation",
      );
    });

    it("should reject integration creation with invalid endpoint URL", async () => {
      const input: CreateIntegrationInput = {
        name: "Test Integration",
        type: "api",
        config: {
          endpoint: "invalid-url",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration creation",
      );
    });

    it("should reject integration creation with invalid webhook URL", async () => {
      const input: CreateIntegrationInput = {
        name: "Test Integration",
        type: "webhook",
        config: {
          webhookUrl: "not-a-url",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration creation",
      );
    });

    it("should reject integration creation with negative sync interval", async () => {
      const input: CreateIntegrationInput = {
        name: "Test Integration",
        type: "email",
        config: {
          syncInterval: -1,
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for integration creation",
      );
    });
  });

  describe("Configuration Validation", () => {
    it("should reject integration creation with invalid configuration", async () => {
      const input: CreateIntegrationInput = {
        name: "Test Integration",
        type: "email",
        config: {
          // Missing required apiKey for email type
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid integration configuration",
      );
    });
  });

  describe("Success Cases", () => {
    it("should create integration with minimal required fields", async () => {
      const input: CreateIntegrationInput = {
        name: "Test Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.name).toBe("Test Integration");
      expect(integration.type).toBe("webhook");
      expect(integration.config.webhookUrl).toBe("https://example.com/webhook");
      expect(integration.config.isEnabled).toBe(true);
      expect(integration.createdBy).toBe(testUserId);
      expect(integration.id).toBeDefined();
      expect(integration.createdAt).toBeDefined();
      expect(integration.updatedAt).toBeDefined();
    });

    it("should create integration with all optional fields", async () => {
      const input: CreateIntegrationInput = {
        name: "Comprehensive Integration",
        type: "api",
        description: "A comprehensive integration for testing",
        config: {
          endpoint: "https://api.example.com/v1",
          apiKey: "test-api-key",
          apiSecret: "test-api-secret",
          credentials: {
            username: "testuser",
            password: "testpass",
          },
          settings: {
            timeout: 30000,
            retries: 3,
          },
          syncInterval: 3600,
          isEnabled: false,
        },
        isSystemwide: true,
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.name).toBe("Comprehensive Integration");
      expect(integration.type).toBe("api");
      expect(integration.description).toBe(
        "A comprehensive integration for testing",
      );
      expect(integration.config.endpoint).toBe("https://api.example.com/v1");
      expect(integration.config.apiKey).toBe("test-api-key");
      expect(integration.config.apiSecret).toBe("test-api-secret");
      expect(integration.config.credentials).toEqual({
        username: "testuser",
        password: "testpass",
      });
      expect(integration.config.settings).toEqual({
        timeout: 30000,
        retries: 3,
      });
      expect(integration.config.syncInterval).toBe(3600);
      expect(integration.config.isEnabled).toBe(false);
      expect(integration.isSystemwide).toBe(true);
      expect(integration.createdBy).toBe(testUserId);
    });

    it("should create email integration with valid configuration", async () => {
      const input: CreateIntegrationInput = {
        name: "Email Integration",
        type: "email",
        config: {
          apiKey: "email-api-key",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.name).toBe("Email Integration");
      expect(integration.type).toBe("email");
      expect(integration.config.apiKey).toBe("email-api-key");
    });

    it("should create Salesforce integration with valid configuration", async () => {
      const input: CreateIntegrationInput = {
        name: "Salesforce Integration",
        type: "salesforce",
        config: {
          apiKey: "sf-api-key",
          endpoint: "https://mycompany.salesforce.com",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.name).toBe("Salesforce Integration");
      expect(integration.type).toBe("salesforce");
      expect(integration.config.apiKey).toBe("sf-api-key");
      expect(integration.config.endpoint).toBe(
        "https://mycompany.salesforce.com",
      );
    });

    it("should default isEnabled to true when not specified", async () => {
      const input: CreateIntegrationInput = {
        name: "Default Config Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.config.isEnabled).toBe(true);
    });
  });

  describe("Supported Integration Types", () => {
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
      it(`should create integration with type ${type}`, async () => {
        const input: CreateIntegrationInput = {
          name: `${type} Integration`,
          type: type as any,
          config:
            type === "webhook"
              ? {
                  webhookUrl: "https://example.com/webhook",
                }
              : type === "api"
                ? {
                    endpoint: "https://api.example.com",
                  }
                : type === "salesforce"
                  ? {
                      apiKey: "test-key",
                      endpoint: "https://api.example.com",
                    }
                  : {
                      apiKey: "test-key",
                    },
          createdBy: testUserId,
        };

        const result = await createIntegration(context, input);

        expect(result.isOk()).toBe(true);
        const integration = result._unsafeUnwrap();
        expect(integration.type).toBe(type);
      });
    });
  });

  describe("Boundary Values", () => {
    it("should create integration with name of exactly 255 characters", async () => {
      const longName = "a".repeat(255);
      const input: CreateIntegrationInput = {
        name: longName,
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.name).toBe(longName);
    });

    it("should create integration with sync interval of 0", async () => {
      const input: CreateIntegrationInput = {
        name: "Zero Sync Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
          syncInterval: 0,
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.config.syncInterval).toBe(0);
    });

    it("should create integration with complex settings object", async () => {
      const complexSettings = {
        nested: {
          array: [1, 2, 3],
          object: {
            key: "value",
          },
        },
        boolean: true,
        number: 42,
        string: "test",
      };

      const input: CreateIntegrationInput = {
        name: "Complex Settings Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
          settings: complexSettings,
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.config.settings).toEqual(complexSettings);
    });
  });

  describe("Edge Cases", () => {
    it("should handle integration creation with empty description", async () => {
      const input: CreateIntegrationInput = {
        name: "Empty Description Integration",
        type: "webhook",
        description: "",
        config: {
          webhookUrl: "https://example.com/webhook",
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.description).toBe("");
    });

    it("should handle integration creation with empty credentials object", async () => {
      const input: CreateIntegrationInput = {
        name: "Empty Credentials Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
          credentials: {},
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.config.credentials).toEqual({});
    });

    it("should handle integration creation with empty settings object", async () => {
      const input: CreateIntegrationInput = {
        name: "Empty Settings Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
          settings: {},
        },
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.config.settings).toEqual({});
    });

    it("should handle integration creation with isSystemwide set to false", async () => {
      const input: CreateIntegrationInput = {
        name: "User-specific Integration",
        type: "webhook",
        config: {
          webhookUrl: "https://example.com/webhook",
        },
        isSystemwide: false,
        createdBy: testUserId,
      };

      const result = await createIntegration(context, input);

      expect(result.isOk()).toBe(true);
      const integration = result._unsafeUnwrap();
      expect(integration.isSystemwide).toBe(false);
    });
  });
});
