import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { DisplaySettings } from "@/core/domain/displaySettings/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const updateDisplaySettingsInputSchema = z.object({
  userId: z.string().uuid(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
  language: z.enum(["ja", "en"]).optional(),
  dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"]).optional(),
  timeFormat: z.enum(["24h", "12h"]).optional(),
  timezone: z.string().optional(),
  currency: z.enum(["JPY", "USD", "EUR"]).optional(),
  itemsPerPage: z.number().int().min(10).max(100).optional(),
  enableNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  compactMode: z.boolean().optional(),
});

export type UpdateDisplaySettingsInput = z.infer<
  typeof updateDisplaySettingsInputSchema
>;

export async function updateDisplaySettings(
  context: Context,
  input: UpdateDisplaySettingsInput,
): Promise<Result<DisplaySettings, ApplicationError>> {
  const validationResult = validate(updateDisplaySettingsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for display settings update",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;
  const { userId, ...updateParams } = validInput;

  // Check if user's display settings exist
  const existingResult = await context.displaySettingsRepository.findByUserId({
    userId,
  });
  if (existingResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get existing display settings",
        existingResult.error,
      ),
    );
  }

  const existing = existingResult.value;

  if (existing) {
    // Update existing settings
    const updateResult = await context.displaySettingsRepository.update(
      existing.id,
      updateParams,
    );
    if (updateResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to update display settings",
          updateResult.error,
        ),
      );
    }
    return ok(updateResult.value);
  }
  // Create new settings with provided values
  const createResult = await context.displaySettingsRepository.create({
    userId,
    ...updateParams,
  });
  if (createResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to create display settings",
        createResult.error,
      ),
    );
  }
  return ok(createResult.value);
}
