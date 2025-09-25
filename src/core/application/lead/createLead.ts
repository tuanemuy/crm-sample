import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import {
  type CreateLeadInput,
  createLeadInputSchema,
  type Lead,
} from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createLead(
  context: Context,
  input: CreateLeadInput,
): Promise<Result<Lead, ApplicationError>> {
  // Validate input
  const validationResult = validate(createLeadInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if lead with same email already exists (if email is provided)
  if (validInput.email) {
    const existingLeadResult = await context.leadRepository.findByEmail(
      validInput.email,
    );
    if (existingLeadResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to check existing lead",
          existingLeadResult.error,
        ),
      );
    }

    if (existingLeadResult.value !== null) {
      return err(new ApplicationError(ERROR_MESSAGES.LEAD_EMAIL_DUPLICATE));
    }
  }

  // If assigned user is provided, verify user exists
  if (validInput.assignedUserId) {
    const userResult = await context.userRepository.findById(
      validInput.assignedUserId,
    );
    if (userResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to verify assigned user",
          userResult.error,
        ),
      );
    }
    if (userResult.value === null) {
      return err(new ApplicationError(ERROR_MESSAGES.LEAD_CREATION_FAILED));
    }
  }

  // Create lead with default score
  const createParams = {
    ...validInput,
    score: 0,
    status: "new" as const,
  };

  const createResult = await context.leadRepository.create(createParams);
  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create lead", createResult.error),
    );
  }

  const lead = createResult.value;

  // Calculate initial score using scoring service
  const scoreResult = await context.scoringService.evaluateLeadScore(lead.id);
  if (scoreResult.isOk()) {
    // Score was updated in the service, return the updated lead
    const updatedLeadResult = await context.leadRepository.findById(lead.id);
    if (updatedLeadResult.isOk() && updatedLeadResult.value) {
      return ok(updatedLeadResult.value);
    }
  }

  return ok(lead);
}
