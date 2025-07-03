import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type ContactHistory,
  type CreateContactHistoryInput,
  createContactHistoryInputSchema,
} from "@/core/domain/contactHistory/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function addContactRecord(
  context: Context,
  input: CreateContactHistoryInput,
  contactedByUserId: string,
): Promise<Result<ContactHistory, ApplicationError>> {
  // Validate input
  const validationResult = validate(createContactHistoryInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for adding contact record",
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

  if (!customerResult.value) {
    return err(new ApplicationError("Customer not found"));
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

  // Create contact history record
  const createResult = await context.contactHistoryRepository.create({
    customerId: validInput.customerId,
    contactId: validInput.contactId,
    type: validInput.type,
    subject: validInput.subject,
    content: validInput.content,
    direction: validInput.direction,
    status: validInput.status,
    duration: validInput.duration,
    contactedByUserId,
    contactedAt: validInput.contactedAt || new Date(),
  });

  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to add contact record", createResult.error),
    );
  }

  return ok(createResult.value);
}
