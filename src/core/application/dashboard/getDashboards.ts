import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Dashboard } from "@/core/domain/dashboard/types";
import { ApplicationError } from "@/lib/error";

export const getDashboardsInputSchema = z.object({
  userId: z.string().uuid(),
});

export type GetDashboardsInput = z.infer<typeof getDashboardsInputSchema>;

export async function getDashboards(
  context: Context,
  input: GetDashboardsInput,
): Promise<Result<Dashboard[], ApplicationError>> {
  const result = await context.dashboardRepository.findByUserId(input);
  if (result.isErr()) {
    return err(new ApplicationError("Failed to get dashboards", result.error));
  }

  return ok(result.value);
}
