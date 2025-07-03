import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";

export async function deleteCustomer(
  context: Context,
  customerId: string,
): Promise<Result<void, ApplicationError>> {
  // Check if customer exists
  const existingCustomerResult =
    await context.customerRepository.findById(customerId);
  if (existingCustomerResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to find customer",
        existingCustomerResult.error,
      ),
    );
  }

  if (existingCustomerResult.value === null) {
    return err(new ApplicationError("Customer not found"));
  }

  // Check if customer has related deals
  const relatedDealsResult =
    await context.dealRepository.findByCustomerId(customerId);
  if (relatedDealsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check related deals",
        relatedDealsResult.error,
      ),
    );
  }

  // Prevent deletion if customer has active deals
  const activeDeals = relatedDealsResult.value.filter(
    (deal) => !["closed_won", "closed_lost"].includes(deal.stage),
  );
  if (activeDeals.length > 0) {
    return err(
      new ApplicationError(
        "Cannot delete customer with active deals. Please close or transfer the deals first.",
      ),
    );
  }

  // Check if customer has related contacts
  const relatedContactsResult =
    await context.contactRepository.findByCustomerId(customerId);
  if (relatedContactsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check related contacts",
        relatedContactsResult.error,
      ),
    );
  }

  // Delete related contacts first (cascade delete)
  if (relatedContactsResult.value.length > 0) {
    for (const contact of relatedContactsResult.value) {
      const deleteContactResult = await context.contactRepository.delete(
        contact.id,
      );
      if (deleteContactResult.isErr()) {
        return err(
          new ApplicationError(
            "Failed to delete related contact",
            deleteContactResult.error,
          ),
        );
      }
    }
  }

  // Check if customer has related activities
  const relatedActivitiesResult =
    await context.activityRepository.findByCustomerId(customerId);
  if (relatedActivitiesResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check related activities",
        relatedActivitiesResult.error,
      ),
    );
  }

  // Delete related activities
  if (relatedActivitiesResult.value.length > 0) {
    for (const activity of relatedActivitiesResult.value) {
      const deleteActivityResult = await context.activityRepository.delete(
        activity.id,
      );
      if (deleteActivityResult.isErr()) {
        return err(
          new ApplicationError(
            "Failed to delete related activity",
            deleteActivityResult.error,
          ),
        );
      }
    }
  }

  // Finally delete the customer
  const deleteResult = await context.customerRepository.delete(customerId);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete customer", deleteResult.error),
    );
  }

  return ok(undefined);
}
