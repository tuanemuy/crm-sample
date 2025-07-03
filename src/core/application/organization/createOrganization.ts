import type { Result } from "neverthrow";
import type { z } from "zod/v4";
import type {
  createOrganizationSchema,
  Organization,
} from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export async function createOrganization(
  context: Context,
  input: CreateOrganizationInput,
): Promise<Result<Organization, ApplicationError>> {
  const result = await context.organizationRepository.createOrganization(input);

  return result.mapErr((error) => {
    return new ApplicationError("Failed to create organization", error);
  });
}
