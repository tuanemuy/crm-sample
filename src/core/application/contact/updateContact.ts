import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Contact,
  type UpdateContactInput,
  updateContactInputSchema,
} from "@/core/domain/contact/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function updateContact(
  context: Context,
  contactId: string,
  input: UpdateContactInput,
): Promise<Result<Contact, ApplicationError>> {
  // Validate input
  const validationResult = validate(updateContactInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for updating contact",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Check if contact exists
  const getResult = await context.contactRepository.findById(contactId);
  if (getResult.isErr()) {
    return err(new ApplicationError("Failed to get contact", getResult.error));
  }

  if (!getResult.value) {
    return err(new ApplicationError("Contact not found"));
  }

  // Update contact
  const updateResult = await context.contactRepository.update(
    contactId,
    validInput,
  );
  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update contact", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
