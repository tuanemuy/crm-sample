import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type ContactHistoryWithRelations,
  type ListContactHistoryQuery,
  listContactHistoryQuerySchema,
} from "@/core/domain/contactHistory/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function viewContactHistory(
  context: Context,
  customerId: string,
  query: ListContactHistoryQuery,
): Promise<
  Result<
    { items: ContactHistoryWithRelations[]; count: number },
    ApplicationError
  >
> {
  // Validate query
  const validationResult = validate(listContactHistoryQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid query for viewing contact history",
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // Verify customer exists
  const customerResult = await context.customerRepository.findById(customerId);
  if (customerResult.isErr()) {
    return err(
      new ApplicationError("Failed to verify customer", customerResult.error),
    );
  }

  if (!customerResult.value) {
    return err(new ApplicationError("Customer not found"));
  }

  // Get contact history for customer
  const historyResult = await context.contactHistoryRepository.listByCustomer(
    customerId,
    validQuery,
  );
  if (historyResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get contact history",
        historyResult.error,
      ),
    );
  }

  return ok(historyResult.value);
}
