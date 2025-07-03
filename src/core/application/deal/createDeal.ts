import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateDealInput,
  createDealInputSchema,
  type Deal,
} from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createDeal(
  context: Context,
  input: CreateDealInput,
): Promise<Result<Deal, ApplicationError>> {
  // Validate input
  const validationResult = validate(createDealInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for deal creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Verify customer exists
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

  // If contact is specified, verify it exists and belongs to the customer
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
    if (contactResult.value.customerId !== validInput.customerId) {
      return err(
        new ApplicationError(
          "Contact does not belong to the specified customer",
        ),
      );
    }
  }

  // Create deal
  const createParams = {
    ...validInput,
    stage: validInput.stage || "prospecting",
    amount: validInput.amount || "0",
    probability: validInput.probability || 0,
  };

  const createResult = await context.dealRepository.create(createParams);
  return createResult.mapErr(
    (error) => new ApplicationError("Failed to create deal", error),
  );
}
