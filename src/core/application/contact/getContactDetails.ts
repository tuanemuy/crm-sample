import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Contact } from "@/core/domain/contact/types";
import { ApplicationError } from "@/lib/error";

export async function getContactDetails(
  context: Context,
  contactId: string,
): Promise<Result<Contact, ApplicationError>> {
  // Validate contact ID
  const validationResult = z.string().uuid().safeParse(contactId);
  if (!validationResult.success) {
    return err(new ApplicationError("Failed to get contact details"));
  }

  // Get contact details
  const getResult = await context.contactRepository.findById(contactId);
  if (getResult.isErr()) {
    return err(
      new ApplicationError("Failed to get contact details", getResult.error),
    );
  }

  if (!getResult.value) {
    return err(new ApplicationError("Contact not found"));
  }

  return ok(getResult.value);
}
