import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Activity,
  type UpdateActivityInput,
  updateActivityInputSchema,
} from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateActivity(
  context: Context,
  id: string,
  input: UpdateActivityInput,
): Promise<Result<Activity, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateActivityInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for updating activity",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

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

  // Update activity
  const updateResult = await context.activityRepository.update(id, validInput);
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update activity", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
