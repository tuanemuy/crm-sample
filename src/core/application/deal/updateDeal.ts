import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Deal,
  type UpdateDealInput,
  updateDealInputSchema,
} from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateDeal(
  context: Context,
  dealId: string,
  input: UpdateDealInput,
): Promise<Result<Deal, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateDealInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for updating deal",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if deal exists
  const getResult = await context.dealRepository.findById(dealId);
  if (getResult.isErr()) {
    return err(new ApplicationError("Failed to get deal", getResult.error));
  }

  if (!getResult.value) {
    return err(new ApplicationError("Deal not found"));
  }

  // Verify customer exists if customerId is provided
  if (validInput.customerId) {
    const customerResult = await context.customerRepository.findById(
      validInput.customerId,
    );
    if (customerResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify customer", customerResult.error),
      );
    }

    if (!customerResult.value) {
      return err(new ApplicationError("Customer not found"));
    }
  }

  // Verify contact exists if contactId is provided
  if (validInput.contactId) {
    const contactResult = await context.contactRepository.findById(
      validInput.contactId,
    );
    if (contactResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify contact", contactResult.error),
      );
    }

    if (!contactResult.value) {
      return err(new ApplicationError("Contact not found"));
    }
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

  // Update deal
  const updateResult = await context.dealRepository.update(dealId, {
    title: validInput.title,
    customerId: validInput.customerId,
    contactId: validInput.contactId,
    stage: validInput.stage,
    amount: validInput.amount,
    probability: validInput.probability,
    expectedCloseDate: validInput.expectedCloseDate,
    actualCloseDate: validInput.actualCloseDate,
    description: validInput.description,
    competitors: validInput.competitors,
    assignedUserId: validInput.assignedUserId,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update deal", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
