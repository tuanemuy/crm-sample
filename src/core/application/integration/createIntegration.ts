import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Integration } from "@/core/domain/integration/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const createIntegrationInputSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum([
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
  ]),
  description: z.string().optional(),
  config: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    endpoint: z.string().url().optional(),
    webhookUrl: z.string().url().optional(),
    credentials: z.record(z.string(), z.string()).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    syncInterval: z.number().int().min(0).optional(),
    isEnabled: z.boolean().optional(),
  }),
  isSystemwide: z.boolean().optional(),
  createdBy: z.string().uuid(),
});

export type CreateIntegrationInput = z.infer<
  typeof createIntegrationInputSchema
>;

export async function createIntegration(
  context: Context,
  input: CreateIntegrationInput,
): Promise<Result<Integration, ApplicationError>> {
  const validationResult = validate(createIntegrationInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for integration creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  const configValidation = context.integrationService.validateConfig(
    validInput.type,
    validInput.config,
  );
  if (configValidation.isErr()) {
    return err(
      new ApplicationError(
        "Invalid integration configuration",
        configValidation.error,
      ),
    );
  }

  const createResult = await context.integrationRepository.create({
    ...validInput,
    config: {
      ...validInput.config,
      isEnabled: validInput.config.isEnabled ?? true,
    },
  });

  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create integration", createResult.error),
    );
  }

  return ok(createResult.value);
}
