import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Lead,
  type UpdateLeadInput,
  updateLeadInputSchema,
} from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateLead(
  context: Context,
  leadId: string,
  input: UpdateLeadInput,
): Promise<Result<Lead, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateLeadInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for updating lead",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if lead exists
  const getResult = await context.leadRepository.findById(leadId);
  if (getResult.isErr()) {
    return err(new ApplicationError("Failed to get lead", getResult.error));
  }

  if (!getResult.value) {
    return err(new ApplicationError("Lead not found"));
  }

  // Verify assigned user exists if assignedUserId is provided
  if (validInput.assignedUserId) {
    const userResult = await context.userRepository.findById(
      validInput.assignedUserId,
    );
    if (userResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify user", userResult.error),
      );
    }

    if (!userResult.value) {
      return err(new ApplicationError("Assigned user not found"));
    }
  }

  // Update lead
  const updateResult = await context.leadRepository.update(leadId, {
    firstName: validInput.firstName,
    lastName: validInput.lastName,
    email: validInput.email,
    phone: validInput.phone,
    company: validInput.company,
    title: validInput.title,
    industry: validInput.industry,
    source: validInput.source,
    status: validInput.status,
    score: validInput.score,
    tags: validInput.tags,
    notes: validInput.notes,
    assignedUserId: validInput.assignedUserId,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update lead", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
