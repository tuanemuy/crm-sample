import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";

export async function deleteContact(
  context: Context,
  contactId: string,
): Promise<Result<void, ApplicationError>> {
  // Check if contact exists
  const getResult = await context.contactRepository.findById(contactId);
  if (getResult.isErr()) {
    return err(new ApplicationError("Failed to get contact", getResult.error));
  }

  if (!getResult.value) {
    return err(new ApplicationError("Contact not found"));
  }

  // Delete contact
  const deleteResult = await context.contactRepository.delete(contactId);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete contact", deleteResult.error),
    );
  }

  return ok(undefined);
}
