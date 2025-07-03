import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { Customer } from "@/core/domain/customer/types";
import {
  type ConvertLeadInput,
  convertLeadInputSchema,
} from "@/core/domain/lead/types";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function convertLeadToCustomer(
  context: Context,
  leadId: string,
  input: ConvertLeadInput,
): Promise<Result<Customer, ApplicationError | NotFoundError>> {
  // Validate input
  const validationResult = validate(convertLeadInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for lead conversion",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Get the lead
  const leadResult = await context.leadRepository.findById(leadId);
  if (leadResult.isErr()) {
    return err(new ApplicationError("Failed to get lead", leadResult.error));
  }

  if (leadResult.value === null) {
    return err(new NotFoundError("Lead not found"));
  }

  const lead = leadResult.value;

  // Check if lead is already converted
  if (lead.status === "converted") {
    return err(new ApplicationError("Lead is already converted"));
  }

  // Verify the target customer exists
  const customerResult = await context.customerRepository.findById(
    validInput.customerId,
  );
  if (customerResult.isErr()) {
    return err(
      new ApplicationError("Failed to verify customer", customerResult.error),
    );
  }

  if (customerResult.value === null) {
    return err(new ApplicationError("Target customer does not exist"));
  }

  const customer = customerResult.value;

  // Convert the lead
  const convertResult = await context.leadRepository.convert(
    leadId,
    validInput.customerId,
  );
  if (convertResult.isErr()) {
    return err(
      new ApplicationError("Failed to convert lead", convertResult.error),
    );
  }

  // Create contact if requested
  if (validInput.createContact) {
    const contactParams = {
      customerId: validInput.customerId,
      name: `${lead.firstName} ${lead.lastName}`,
      title: lead.title,
      email: lead.email,
      phone: lead.phone,
      isPrimary: false,
      isActive: true,
    };

    const contactResult = await context.contactRepository.create(contactParams);
    if (contactResult.isErr()) {
      // Log error but don't fail the conversion
      console.warn(
        "Failed to create contact during lead conversion:",
        contactResult.error,
      );
    }
  }

  // Create deal if requested
  if (validInput.createDeal && validInput.dealInfo) {
    const dealParams = {
      title: validInput.dealInfo.title,
      customerId: validInput.customerId,
      amount: validInput.dealInfo.amount,
      stage: (validInput.dealInfo.stage || "prospecting") as
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost",
      probability: 25, // Default probability for new deals
      competitors: [] as string[],
      assignedUserId: lead.assignedUserId || customer.assignedUserId,
    };

    // Only create deal if assignedUserId is available
    if (dealParams.assignedUserId) {
      const dealParamsWithUser = {
        ...dealParams,
        assignedUserId: dealParams.assignedUserId as string,
      };
      const dealResult =
        await context.dealRepository.create(dealParamsWithUser);
      if (dealResult.isErr()) {
        // Log error but don't fail the conversion
        console.warn(
          "Failed to create deal during lead conversion:",
          dealResult.error,
        );
      }
    }
  }

  // Return the target customer (not the converted lead)
  return ok(customer);
}
