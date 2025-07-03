import type { Result } from "neverthrow";
import type { ApplicationError } from "@/lib/error";
import type { Integration, IntegrationType } from "../types";

export interface IntegrationService {
  testConnection(
    integration: Integration,
  ): Promise<Result<boolean, ApplicationError>>;
  sync(integration: Integration): Promise<Result<void, ApplicationError>>;
  getSupportedTypes(): IntegrationType[];
  validateConfig(
    type: IntegrationType,
    config: Record<string, unknown>,
  ): Result<boolean, ApplicationError>;
}
