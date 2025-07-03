import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import {
  type Activity,
  completeActivityInputSchema,
} from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const completeActivityParamsSchema = z.object({
  id: z.string().uuid(),
  input: completeActivityInputSchema,
});

export type CompleteActivityParams = z.infer<
  typeof completeActivityParamsSchema
>;

export async function completeActivity(
  context: Context,
  params: CompleteActivityParams,
): Promise<Result<Activity, ApplicationError>> {
  // Validate params
  const validationResult = validate(completeActivityParamsSchema, params);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid params for completing activity",
        validationResult.error,
      ),
    );
  }

  const { id, input } = validationResult.value;

  // Check if activity exists
  const existingActivityResult = await context.activityRepository.findById(id);
  if (existingActivityResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to find activity",
        existingActivityResult.error,
      ),
    );
  }

  if (!existingActivityResult.value) {
    return err(new ApplicationError("Activity not found"));
  }

  const activity = existingActivityResult.value;

  // Check if activity is already completed
  if (activity.status === "completed") {
    return err(new ApplicationError("Activity is already completed"));
  }

  // Check if activity is cancelled
  if (activity.status === "cancelled") {
    return err(new ApplicationError("Cannot complete cancelled activity"));
  }

  // Complete activity
  const completeResult = await context.activityRepository.complete(id, input);
  if (completeResult.isErr()) {
    return err(
      new ApplicationError("Failed to complete activity", completeResult.error),
    );
  }

  return ok(completeResult.value);
}
