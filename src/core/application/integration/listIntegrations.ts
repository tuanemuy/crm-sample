import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Integration } from "@/core/domain/integration/types";
import { ApplicationError } from "@/lib/error";

export const listIntegrationsInputSchema = z.object({
  type: z
    .enum([
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
    ])
    .optional(),
  status: z
    .enum(["active", "inactive", "error", "pending", "configured"])
    .optional(),
  isSystemwide: z.boolean().optional(),
});

export type ListIntegrationsInput = z.infer<typeof listIntegrationsInputSchema>;

export async function listIntegrations(
  context: Context,
  input?: ListIntegrationsInput,
): Promise<Result<Integration[], ApplicationError>> {
  const result = await context.integrationRepository.list(input);
  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to list integrations", result.error),
    );
  }

  return ok(result.value);
}
