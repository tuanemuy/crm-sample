import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Dashboard } from "@/core/domain/dashboard/types";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const updateDashboardInputSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  isDefault: z.boolean().optional(),
  widgets: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.enum([
          "sales_overview",
          "recent_leads",
          "recent_deals",
          "activity_feed",
          "performance_metrics",
          "pipeline_chart",
          "revenue_chart",
          "task_list",
          "quick_actions",
          "contact_list",
          "calendar",
          "notifications",
        ]),
        title: z.string().min(1).max(255),
        position: z.object({
          x: z.number().int().min(0),
          y: z.number().int().min(0),
        }),
        size: z.object({
          width: z.number().int().min(1).max(12),
          height: z.number().int().min(1).max(12),
        }),
        settings: z.record(z.string(), z.unknown()).optional(),
        isVisible: z.boolean(),
      }),
    )
    .optional(),
  layout: z.enum(["grid", "fluid"]).optional(),
  gridSize: z.number().int().min(8).max(24).optional(),
  backgroundColor: z.string().optional(),
});

export type UpdateDashboardInput = z.infer<typeof updateDashboardInputSchema>;

export async function updateDashboard(
  context: Context,
  input: UpdateDashboardInput,
): Promise<Result<Dashboard, ApplicationError | NotFoundError>> {
  const validationResult = validate(updateDashboardInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for dashboard update",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;
  const { id, userId, ...updateParams } = validInput;

  const existingResult = await context.dashboardRepository.findById({
    id,
    userId,
  });
  if (existingResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get existing dashboard",
        existingResult.error,
      ),
    );
  }

  if (!existingResult.value) {
    return err(new NotFoundError("Dashboard not found"));
  }

  const updateResult = await context.dashboardRepository.update(
    id,
    updateParams,
  );
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update dashboard", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
