import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Contact,
  type CreateContactInput,
  createContactInputSchema,
} from "@/core/domain/contact/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function createContact(
  context: Context,
  input: CreateContactInput,
): Promise<Result<Contact, ApplicationError>> {
  // Validate input
  const validationResult = validate(createContactInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for creating contact",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Create contact
  const createResult = await context.contactRepository.create({
    customerId: validInput.customerId,
    name: validInput.name,
    title: validInput.title,
    department: validInput.department,
    email: validInput.email,
    phone: validInput.phone,
    mobile: validInput.mobile,
    isPrimary: validInput.isPrimary,
    isActive: true,
  });

  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create contact", createResult.error),
    );
  }

  return ok(createResult.value);
}
