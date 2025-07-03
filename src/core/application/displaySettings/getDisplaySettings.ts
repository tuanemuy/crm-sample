import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { DisplaySettings } from "@/core/domain/displaySettings/types";
import { ApplicationError } from "@/lib/error";

export const getDisplaySettingsInputSchema = z.object({
  userId: z.string().uuid(),
});

export type GetDisplaySettingsInput = z.infer<
  typeof getDisplaySettingsInputSchema
>;

export async function getDisplaySettings(
  context: Context,
  input: GetDisplaySettingsInput,
): Promise<Result<DisplaySettings | null, ApplicationError>> {
  const result = await context.displaySettingsRepository.findByUserId(input);
  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to get display settings", result.error),
    );
  }

  return ok(result.value);
}
