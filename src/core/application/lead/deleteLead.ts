import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const deleteLeadInputSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteLeadInput = z.infer<typeof deleteLeadInputSchema>;

export async function deleteLead(
  context: Context,
  input: DeleteLeadInput,
): Promise<Result<void, ApplicationError>> {
  // Validate input
  const validationResult = validate(deleteLeadInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for deleting lead",
        validationResult.error,
      ),
    );
  }

  const { id } = validationResult.value;

  // Check if lead exists
  const existingLeadResult = await context.leadRepository.findById(id);
  if (existingLeadResult.isErr()) {
    return err(
      new ApplicationError("Failed to find lead", existingLeadResult.error),
    );
  }

  if (!existingLeadResult.value) {
    return err(new ApplicationError("Lead not found"));
  }

  // Check if lead is already converted
  if (existingLeadResult.value.status === "converted") {
    return err(
      new ApplicationError(
        "Cannot delete converted lead. Please archive instead.",
      ),
    );
  }

  // Delete lead
  const deleteResult = await context.leadRepository.delete(id);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete lead", deleteResult.error),
    );
  }

  return ok(undefined);
}
