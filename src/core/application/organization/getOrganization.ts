import type { Result } from "neverthrow";
import type { Organization } from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export async function getOrganization(
  context: Context,
  id: string,
): Promise<Result<Organization | null, ApplicationError>> {
  const result = await context.organizationRepository.findOrganizationById(id);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to get organization", error);
  });
}
