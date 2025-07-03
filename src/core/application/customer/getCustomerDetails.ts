import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { CustomerWithRelations } from "@/core/domain/customer/types";
import { ApplicationError, NotFoundError } from "@/lib/error";

export async function getCustomerDetails(
  context: Context,
  customerId: string,
): Promise<Result<CustomerWithRelations, ApplicationError | NotFoundError>> {
  // Get customer with all relations
  const customerResult =
    await context.customerRepository.findByIdWithRelations(customerId);
  if (customerResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get customer details",
        customerResult.error,
      ),
    );
  }

  if (customerResult.value === null) {
    return err(new NotFoundError("Customer not found"));
  }

  return ok(customerResult.value);
}
