import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  Organization,
  updateOrganizationSchema,
} from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export async function updateOrganization(
  context: Context,
  input: UpdateOrganizationInput,
): Promise<Result<Organization, ApplicationError>> {
  const result = await context.organizationRepository.updateOrganization(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to update organization", error);
  });
}
