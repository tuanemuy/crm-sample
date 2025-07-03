import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { EmailHistoryWithLead } from "@/core/domain/emailMarketing/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";

export const viewEmailMarketingHistoryInputSchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      leadId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
      contactId: z.string().uuid().optional(),
      emailAddress: z.string().email().optional(),
      status: z
        .enum([
          "pending",
          "sent",
          "delivered",
          "opened",
          "clicked",
          "bounced",
          "failed",
          "unsubscribed",
        ])
        .optional(),
      emailCampaignId: z.string().uuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["sentAt", "deliveredAt", "openedAt", "clickedAt", "createdAt"])
        .default("createdAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});
export type ViewEmailMarketingHistoryInput = z.infer<
  typeof viewEmailMarketingHistoryInputSchema
>;

export async function viewEmailMarketingHistory(
  context: Context,
  input: ViewEmailMarketingHistoryInput,
): Promise<
  Result<{ items: EmailHistoryWithLead[]; count: number }, ApplicationError>
> {
  // If leadId is provided, verify the lead exists
  if (input.filter?.leadId) {
    const leadResult = await context.leadRepository.findById(
      input.filter.leadId,
    );
    if (leadResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to verify lead existence",
          leadResult.error,
        ),
      );
    }
    if (!leadResult.value) {
      return err(new ApplicationError("Lead not found"));
    }
  }

  // If customerId is provided, verify the customer exists
  if (input.filter?.customerId) {
    const customerResult = await context.customerRepository.findById(
      input.filter.customerId,
    );
    if (customerResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to verify customer existence",
          customerResult.error,
        ),
      );
    }
    if (!customerResult.value) {
      return err(new ApplicationError("Customer not found"));
    }
  }

  // If contactId is provided, verify the contact exists
  if (input.filter?.contactId) {
    const contactResult = await context.contactRepository.findById(
      input.filter.contactId,
    );
    if (contactResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to verify contact existence",
          contactResult.error,
        ),
      );
    }
    if (!contactResult.value) {
      return err(new ApplicationError("Contact not found"));
    }
  }

  const result =
    await context.emailMarketingRepository.listEmailHistoryWithLeads(input);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get email marketing history",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
