import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { ActivityWithRelations } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const getActivityDetailsInputSchema = z.object({
  id: z.string().uuid(),
});

export type GetActivityDetailsInput = z.infer<
  typeof getActivityDetailsInputSchema
>;

export async function getActivityDetails(
  context: Context,
  input: GetActivityDetailsInput,
): Promise<Result<ActivityWithRelations, ApplicationError>> {
  // Validate input
  const validationResult = validate(getActivityDetailsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for getting activity details",
        validationResult.error,
      ),
    );
  }

  const { id } = validationResult.value;

  // Get activity with relations
  const activityResult =
    await context.activityRepository.findByIdWithRelations(id);
  if (activityResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get activity details",
        activityResult.error,
      ),
    );
  }

  if (!activityResult.value) {
    return err(new ApplicationError("Activity not found"));
  }

  return ok(activityResult.value);
}
