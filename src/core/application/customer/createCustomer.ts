import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type CreateCustomerInput,
  type Customer,
  createCustomerInputSchema,
} from "@/core/domain/customer/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createCustomer(
  context: Context,
  input: CreateCustomerInput,
): Promise<Result<Customer, ApplicationError>> {
  // Validate input
  const validationResult = validate(createCustomerInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for customer creation",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if customer with same name already exists
  const existingCustomerResult = await context.customerRepository.findByName(
    validInput.name,
  );
  if (existingCustomerResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check existing customer",
        existingCustomerResult.error,
      ),
    );
  }

  if (existingCustomerResult.value !== null) {
    return err(new ApplicationError("Customer with this name already exists"));
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
      return err(new ApplicationError("Assigned user does not exist"));
    }
  }

  // If parent customer is provided, verify it exists
  if (validInput.parentCustomerId) {
    const parentResult = await context.customerRepository.findById(
      validInput.parentCustomerId,
    );
    if (parentResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to verify parent customer",
          parentResult.error,
        ),
      );
    }
    if (parentResult.value === null) {
      return err(new ApplicationError("Parent customer does not exist"));
    }
  }

  // Create customer
  const createParams = {
    ...validInput,
    status: "active" as const,
  };
  const createResult = await context.customerRepository.create(createParams);
  return createResult.mapErr(
    (error) => new ApplicationError("Failed to create customer", error),
  );
}
