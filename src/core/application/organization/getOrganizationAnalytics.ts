import type { Result } from "neverthrow";
import { z } from "zod/v4";
import type { OrganizationAnalytics } from "@/core/domain/organization/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const getOrganizationAnalyticsInputSchema = z.object({
  organizationId: z.string().uuid(),
});
export type GetOrganizationAnalyticsInput = z.infer<
  typeof getOrganizationAnalyticsInputSchema
>;

export async function getOrganizationAnalytics(
  context: Context,
  input: GetOrganizationAnalyticsInput,
): Promise<Result<OrganizationAnalytics, ApplicationError>> {
  const result = await context.organizationRepository.getOrganizationAnalytics(
    input.organizationId,
  );

  return result.mapErr((error) => {
    return new ApplicationError("Failed to get organization analytics", error);
  });
}
