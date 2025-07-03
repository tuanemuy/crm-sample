import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Activity,
  type ListActivitiesQuery,
  listActivitiesQuerySchema,
} from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function listActivities(
  context: Context,
  query: ListActivitiesQuery,
): Promise<Result<{ items: Activity[]; count: number }, ApplicationError>> {
  // Validate query
  const validationResult = validate(listActivitiesQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid query for listing activities",
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // List activities
  const listResult = await context.activityRepository.list(validQuery);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to list activities", listResult.error),
    );
  }
  return ok(listResult.value);
}
