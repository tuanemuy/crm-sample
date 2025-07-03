import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Customer,
  type UpdateCustomerInput,
  updateCustomerInputSchema,
} from "@/core/domain/customer/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateCustomer(
  context: Context,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Result<Customer, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateCustomerInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for customer update",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if customer exists
  const existingCustomerResult =
    await context.customerRepository.findById(customerId);
  if (existingCustomerResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to find customer",
        existingCustomerResult.error,
      ),
    );
  }

  if (existingCustomerResult.value === null) {
    return err(new ApplicationError("Customer not found"));
  }

  // If assigned user is being updated, verify user exists
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
      return err(new ApplicationError("Assigned user does not exist"));
    }
  }

  // Update customer
  const updateResult = await context.customerRepository.update(
    customerId,
    validInput,
  );
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update customer", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
