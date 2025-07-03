import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Activity,
  type CreateActivityInput,
  createActivityInputSchema,
} from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createActivity(
  context: Context,
  input: CreateActivityInput,
  createdByUserId: string,
): Promise<Result<Activity, ApplicationError>> {
  // Validate input
  const validationResult = validate(createActivityInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for activity creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Verify assigned user exists
  const userResult = await context.userRepository.findById(
    validInput.assignedUserId,
  );
  if (userResult.isErr()) {
    return err(
      new ApplicationError("Failed to verify assigned user", userResult.error),
    );
  }
  if (userResult.value === null) {
    return err(new ApplicationError("Assigned user does not exist"));
  }

  // Verify created by user exists
  const createdByUserResult =
    await context.userRepository.findById(createdByUserId);
  if (createdByUserResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to verify creator user",
        createdByUserResult.error,
      ),
    );
  }
  if (createdByUserResult.value === null) {
    return err(new ApplicationError("Creator user does not exist"));
  }

  // If customer is specified, verify it exists
  if (validInput.customerId) {
    const customerResult = await context.customerRepository.findById(
      validInput.customerId,
    );
    if (customerResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify customer", customerResult.error),
      );
    }
    if (customerResult.value === null) {
      return err(new ApplicationError("Customer does not exist"));
    }
  }

  // If contact is specified, verify it exists
  if (validInput.contactId) {
    const contactResult = await context.contactRepository.findById(
      validInput.contactId,
    );
    if (contactResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify contact", contactResult.error),
      );
    }
    if (contactResult.value === null) {
      return err(new ApplicationError("Contact does not exist"));
    }
  }

  // If deal is specified, verify it exists
  if (validInput.dealId) {
    const dealResult = await context.dealRepository.findById(validInput.dealId);
    if (dealResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify deal", dealResult.error),
      );
    }
    if (dealResult.value === null) {
      return err(new ApplicationError("Deal does not exist"));
    }
  }

  // If lead is specified, verify it exists
  if (validInput.leadId) {
    const leadResult = await context.leadRepository.findById(validInput.leadId);
    if (leadResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify lead", leadResult.error),
      );
    }
    if (leadResult.value === null) {
      return err(new ApplicationError("Lead does not exist"));
    }
  }

  // Create activity
  const createParams = {
    ...validInput,
    status: "planned" as const,
    createdByUserId,
  };

  const createResult = await context.activityRepository.create(createParams);
  return createResult.mapErr(
    (error) => new ApplicationError("Failed to create activity", error),
  );
}
