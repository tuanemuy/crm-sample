import { err, ok, type Result } from "neverthrow";
import type { IntegrationService } from "@/core/domain/integration/ports/integrationService";
import type {
  Integration,
  IntegrationType,
} from "@/core/domain/integration/types";
import { ApplicationError } from "@/lib/error";

/**
 * Test-specific integration service that mocks external API calls
 * This prevents real network requests during testing
 */
export class TestIntegrationService implements IntegrationService {
  getSupportedTypes(): IntegrationType[] {
    return [
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
  }

  async testConnection(
    integration: Integration,
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      switch (integration.type) {
        case "webhook":
          return this.testWebhookConnection(integration);
        case "api":
          return this.testApiConnection(integration);
        case "email":
          return this.testEmailConnection(integration);
        default:
          return ok(true);
      }
    } catch (error) {
      return err(
        new ApplicationError(
          `Failed to test ${integration.type} connection`,
          error,
        ),
      );
    }
  }

  async sync(
    integration: Integration,
  ): Promise<Result<void, ApplicationError>> {
    try {
      // In tests, just return success for all sync operations
      return ok(undefined);
    } catch (error) {
      return err(
        new ApplicationError(
          `Failed to sync ${integration.type} integration`,
          error,
        ),
      );
    }
  }

  validateConfig(
    type: IntegrationType,
    config: Record<string, unknown>,
  ): Result<boolean, ApplicationError> {
    try {
      switch (type) {
        case "webhook":
          return this.validateWebhookConfig(config);
        case "api":
          return this.validateApiConfig(config);
        case "email":
          return this.validateEmailConfig(config);
        case "salesforce":
          return this.validateSalesforceConfig(config);
        default:
          return ok(true);
      }
    } catch (error) {
      return err(
        new ApplicationError(`Failed to validate ${type} config`, error),
      );
    }
  }

  private async testWebhookConnection(
    integration: Integration,
  ): Promise<Result<boolean, ApplicationError>> {
    const webhookUrl = integration.config.webhookUrl;
    if (!webhookUrl) {
      return err(new ApplicationError("Webhook URL is required"));
    }

    // Check for test failure patterns
    if (
      typeof webhookUrl === "string" &&
      (webhookUrl.includes("nonexistent") ||
        webhookUrl.includes("invalid.domain"))
    ) {
      return err(new ApplicationError("Failed to connect to webhook endpoint"));
    }

    // Mock successful webhook test if URL is provided
    if (typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
      return ok(true);
    }

    return err(new ApplicationError("Invalid webhook URL"));
  }

  private async testApiConnection(
    integration: Integration,
  ): Promise<Result<boolean, ApplicationError>> {
    const endpoint = integration.config.endpoint;

    if (!endpoint) {
      return err(new ApplicationError("API endpoint is required"));
    }

    // Check for test failure patterns
    if (
      typeof endpoint === "string" &&
      (endpoint.includes("nonexistent") || endpoint.includes("invalid.domain"))
    ) {
      return err(new ApplicationError("Failed to connect to API endpoint"));
    }

    // Mock successful API test if endpoint is provided
    if (typeof endpoint === "string" && endpoint.startsWith("http")) {
      return ok(true);
    }

    return err(new ApplicationError("Invalid API endpoint"));
  }

  private async testEmailConnection(
    integration: Integration,
  ): Promise<Result<boolean, ApplicationError>> {
    const endpoint = integration.config.endpoint;

    // Check for test failure patterns
    if (
      endpoint &&
      typeof endpoint === "string" &&
      (endpoint.includes("nonexistent") || endpoint.includes("invalid"))
    ) {
      return err(new ApplicationError("Failed to connect to email service"));
    }

    // Always return success for email connections in tests
    return ok(true);
  }

  private validateWebhookConfig(
    config: Record<string, unknown>,
  ): Result<boolean, ApplicationError> {
    if (!config.webhookUrl || typeof config.webhookUrl !== "string") {
      return err(new ApplicationError("Webhook URL is required"));
    }
    return ok(true);
  }

  private validateApiConfig(
    config: Record<string, unknown>,
  ): Result<boolean, ApplicationError> {
    if (!config.endpoint || typeof config.endpoint !== "string") {
      return err(new ApplicationError("API endpoint is required"));
    }
    return ok(true);
  }

  private validateEmailConfig(
    config: Record<string, unknown>,
  ): Result<boolean, ApplicationError> {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      return err(new ApplicationError("Email API key is required"));
    }
    return ok(true);
  }

  private validateSalesforceConfig(
    config: Record<string, unknown>,
  ): Result<boolean, ApplicationError> {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      return err(new ApplicationError("Salesforce API key is required"));
    }
    if (!config.endpoint || typeof config.endpoint !== "string") {
      return err(new ApplicationError("Salesforce endpoint is required"));
    }
    return ok(true);
  }
}
