import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createUserTestData } from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { createIntegration } from "./createIntegration";
import {
  type ListIntegrationsInput,
  listIntegrations,
} from "./listIntegrations";

let db: Database;
let context: Context;
let testUserId: string;

describe("listIntegrations", () => {
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

  describe("Success Cases", () => {
    it("should list all integrations when no filter is provided", async () => {
      // Create test integrations
      await createIntegration(context, {
        name: "Email Integration",
        type: "email",
        config: { apiKey: "email-key", isEnabled: true },
        createdBy: testUserId,
      });

      await createIntegration(context, {
        name: "Webhook Integration",
        type: "webhook",
        config: { webhookUrl: "https://example.com/webhook", isEnabled: true },
        createdBy: testUserId,
      });

      const result = await listIntegrations(context);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(2);
      expect(integrations.map((i) => i.name)).toContain("Email Integration");
      expect(integrations.map((i) => i.name)).toContain("Webhook Integration");
    });

    it("should list integrations without any input parameter", async () => {
      // Create test integration
      await createIntegration(context, {
        name: "Test Integration",
        type: "api",
        config: { endpoint: "https://api.example.com", isEnabled: true },
        createdBy: testUserId,
      });

      const result = await listIntegrations(context);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(1);
      expect(integrations[0].name).toBe("Test Integration");
    });

    it("should return empty array when no integrations exist", async () => {
      const result = await listIntegrations(context);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(0);
    });
  });

  describe("Filtering", () => {
    beforeEach(async () => {
      // Create test integrations with different types
      await createIntegration(context, {
        name: "Email Integration",
        type: "email",
        config: { apiKey: "email-key", isEnabled: true },
        createdBy: testUserId,
      });

      await createIntegration(context, {
        name: "Webhook Integration",
        type: "webhook",
        config: { webhookUrl: "https://example.com/webhook", isEnabled: true },
        createdBy: testUserId,
      });

      await createIntegration(context, {
        name: "Salesforce Integration",
        type: "salesforce",
        config: {
          apiKey: "sf-key",
          endpoint: "https://salesforce.example.com",
          apiSecret: "sf-secret",
          isEnabled: true,
        },
        createdBy: testUserId,
      });

      await createIntegration(context, {
        name: "Systemwide Integration",
        type: "api",
        config: { endpoint: "https://api.example.com", isEnabled: true },
        isSystemwide: true,
        createdBy: testUserId,
      });

      await createIntegration(context, {
        name: "User-specific Integration",
        type: "api",
        config: { endpoint: "https://api.user.com", isEnabled: true },
        isSystemwide: false,
        createdBy: testUserId,
      });
    });

    it("should filter integrations by type", async () => {
      const input: ListIntegrationsInput = {
        type: "email",
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(1);
      expect(integrations[0].name).toBe("Email Integration");
      expect(integrations[0].type).toBe("email");
    });

    it("should filter integrations by webhook type", async () => {
      const input: ListIntegrationsInput = {
        type: "webhook",
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(1);
      expect(integrations[0].name).toBe("Webhook Integration");
      expect(integrations[0].type).toBe("webhook");
    });

    it("should filter integrations by api type", async () => {
      const input: ListIntegrationsInput = {
        type: "api",
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(2);
      expect(integrations.map((i) => i.name)).toContain(
        "Systemwide Integration",
      );
      expect(integrations.map((i) => i.name)).toContain(
        "User-specific Integration",
      );
    });

    it("should filter integrations by isSystemwide = true", async () => {
      const input: ListIntegrationsInput = {
        isSystemwide: true,
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(1);
      expect(integrations[0].name).toBe("Systemwide Integration");
      expect(integrations[0].isSystemwide).toBe(true);
    });

    it("should filter integrations by isSystemwide = false", async () => {
      const input: ListIntegrationsInput = {
        isSystemwide: false,
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(4); // Email, Webhook, Salesforce, User-specific
      const names = integrations.map((i) => i.name);
      expect(names).toContain("User-specific Integration");
      expect(names).toContain("Email Integration");
      expect(names).toContain("Webhook Integration");
      expect(names).toContain("Salesforce Integration");
      integrations.forEach((integration) => {
        expect(integration.isSystemwide).toBe(false);
      });
    });

    it("should return empty array when filtering by non-existent type", async () => {
      const input: ListIntegrationsInput = {
        type: "calendar",
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(0);
    });

    it("should handle multiple filter criteria", async () => {
      const input: ListIntegrationsInput = {
        type: "api",
        isSystemwide: true,
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(1);
      expect(integrations[0].name).toBe("Systemwide Integration");
      expect(integrations[0].type).toBe("api");
      expect(integrations[0].isSystemwide).toBe(true);
    });
  });

  describe("Integration Type Coverage", () => {
    beforeEach(async () => {
      // Create fresh database and context to avoid interference from parent beforeEach
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
      it(`should filter integrations by type ${type}`, async () => {
        // Create integration of the specific type
        await createIntegration(context, {
          name: `${type} Integration`,
          type: type as any,
          config:
            type === "webhook"
              ? {
                  webhookUrl: "https://example.com/webhook",
                  isEnabled: true,
                }
              : type === "api"
                ? {
                    endpoint: "https://api.example.com",
                    isEnabled: true,
                  }
                : type === "salesforce"
                  ? {
                      apiKey: "test-key",
                      endpoint: "https://salesforce.example.com",
                      isEnabled: true,
                    }
                  : {
                      apiKey: "test-key",
                      isEnabled: true,
                    },
          createdBy: testUserId,
        });

        // Create integration of different type (only if not email to avoid duplication)
        if (type !== "email") {
          await createIntegration(context, {
            name: "Other Integration",
            type: "email",
            config: { apiKey: "other-key", isEnabled: true },
            createdBy: testUserId,
          });
        }

        const input: ListIntegrationsInput = {
          type: type as any,
        };

        const result = await listIntegrations(context, input);

        expect(result.isOk()).toBe(true);
        const integrations = result._unsafeUnwrap();
        expect(integrations).toHaveLength(1);
        expect(integrations[0].type).toBe(type);
        expect(integrations[0].name).toBe(`${type} Integration`);
      });
    });
  });

  describe("Status Filtering", () => {
    const supportedStatuses = [
      "active",
      "inactive",
      "error",
      "pending",
      "configured",
    ];

    supportedStatuses.forEach((status) => {
      it(`should accept status filter ${status}`, async () => {
        const input: ListIntegrationsInput = {
          status: status as any,
        };

        const result = await listIntegrations(context, input);

        expect(result.isOk()).toBe(true);
        const integrations = result._unsafeUnwrap();
        expect(integrations).toHaveLength(0); // No integrations with specific status created
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty filter object", async () => {
      await createIntegration(context, {
        name: "Test Integration",
        type: "email",
        config: { apiKey: "test-key", isEnabled: true },
        createdBy: testUserId,
      });

      const input: ListIntegrationsInput = {};

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(1);
      expect(integrations[0].name).toBe("Test Integration");
    });

    it("should handle filter with only status", async () => {
      const input: ListIntegrationsInput = {
        status: "active",
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(0);
    });

    it("should handle filter with only isSystemwide", async () => {
      const input: ListIntegrationsInput = {
        isSystemwide: true,
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(0);
    });

    it("should handle contradictory filter criteria", async () => {
      // Create an email integration that is not systemwide
      await createIntegration(context, {
        name: "Email Integration",
        type: "email",
        config: { apiKey: "email-key", isEnabled: true },
        isSystemwide: false,
        createdBy: testUserId,
      });

      // Filter for webhook type but systemwide false
      const input: ListIntegrationsInput = {
        type: "webhook",
        isSystemwide: false,
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(0);
    });
  });

  describe("Large Dataset Handling", () => {
    it("should handle listing many integrations", async () => {
      // Create 10 test integrations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          createIntegration(context, {
            name: `Integration ${i}`,
            type: i % 2 === 0 ? "email" : "webhook",
            config:
              i % 2 === 0
                ? { apiKey: `key-${i}`, isEnabled: true }
                : {
                    webhookUrl: `https://example.com/webhook-${i}`,
                    isEnabled: true,
                  },
            createdBy: testUserId,
          }),
        );
      }
      await Promise.all(promises);

      const result = await listIntegrations(context);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(10);
    });

    it("should handle filtering with many integrations", async () => {
      // Create 20 test integrations - 10 email, 10 webhook
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          createIntegration(context, {
            name: `Integration ${i}`,
            type: i < 10 ? "email" : "webhook",
            config:
              i < 10
                ? { apiKey: `key-${i}`, isEnabled: true }
                : {
                    webhookUrl: `https://example.com/webhook-${i}`,
                    isEnabled: true,
                  },
            createdBy: testUserId,
          }),
        );
      }
      await Promise.all(promises);

      const input: ListIntegrationsInput = {
        type: "email",
      };

      const result = await listIntegrations(context, input);

      expect(result.isOk()).toBe(true);
      const integrations = result._unsafeUnwrap();
      expect(integrations).toHaveLength(10);
      expect(integrations.every((i) => i.type === "email")).toBe(true);
    });
  });
});
