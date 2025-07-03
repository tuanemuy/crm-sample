import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Contact,
  type ListContactsQuery,
  listContactsQuerySchema,
} from "@/core/domain/contact/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function listContacts(
  context: Context,
  query: ListContactsQuery,
): Promise<Result<{ items: Contact[]; count: number }, ApplicationError>> {
  // Validate query
  const validationResult = validate(listContactsQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid query for listing contacts",
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // List contacts
  const listResult = await context.contactRepository.list(validQuery);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to list contacts", listResult.error),
    );
  }

  return ok(listResult.value);
}
