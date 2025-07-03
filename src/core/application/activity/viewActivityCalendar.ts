import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { CalendarEvent } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const viewActivityCalendarInputSchema = z.object({
  userId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
});

export type ViewActivityCalendarInput = z.infer<
  typeof viewActivityCalendarInputSchema
>;

export async function viewActivityCalendar(
  context: Context,
  input: ViewActivityCalendarInput,
): Promise<Result<CalendarEvent[], ApplicationError>> {
  // Validate input
  const validationResult = validate(viewActivityCalendarInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for viewing activity calendar",
        validationResult.error,
      ),
    );
  }

  const { userId, startDate, endDate } = validationResult.value;

  // Validate date range
  if (startDate >= endDate) {
    return err(new ApplicationError("Start date must be before end date"));
  }

  // Check if date range is reasonable (not more than 1 year)
  const oneYear = 365 * 24 * 60 * 60 * 1000; // milliseconds
  if (endDate.getTime() - startDate.getTime() > oneYear) {
    return err(new ApplicationError("Date range cannot exceed one year"));
  }

  // Get calendar events
  const calendarResult = await context.activityRepository.getCalendarEvents(
    userId,
    startDate,
    endDate,
  );
  if (calendarResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get calendar events",
        calendarResult.error,
      ),
    );
  }

  return ok(calendarResult.value);
}
