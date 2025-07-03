import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Customer,
  type ListCustomersQuery,
  listCustomersQuerySchema,
} from "@/core/domain/customer/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function listCustomers(
  context: Context,
  query: ListCustomersQuery,
): Promise<Result<{ items: Customer[]; count: number }, ApplicationError>> {
  // Validate query
  const validationResult = validate(listCustomersQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid query for listing customers",
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // List customers
  const listResult = await context.customerRepository.list(validQuery);
  if (listResult.isErr()) {
    return err(
      new ApplicationError("Failed to list customers", listResult.error),
    );
  }
  return ok(listResult.value);
}
