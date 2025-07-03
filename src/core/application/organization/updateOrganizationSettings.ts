import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  Organization,
  updateOrganizationSettingsSchema,
} from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type UpdateOrganizationSettingsInput = z.infer<
  typeof updateOrganizationSettingsSchema
>;

export async function updateOrganizationSettings(
  context: Context,
  input: UpdateOrganizationSettingsInput,
): Promise<Result<Organization, ApplicationError>> {
  const result =
    await context.organizationRepository.updateOrganizationSettings(input);

  return result.mapErr((error) => {
    return new ApplicationError(
      "Failed to update organization settings",
      error,
    );
  });
}
