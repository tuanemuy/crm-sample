import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { LeadWithUser } from "@/core/domain/lead/types";
import { ApplicationError, NotFoundError } from "@/lib/error";

export async function getLeadDetails(
  context: Context,
  leadId: string,
): Promise<Result<LeadWithUser, ApplicationError | NotFoundError>> {
  // Get lead with assigned user information
  const leadResult = await context.leadRepository.findByIdWithUser(leadId);
  if (leadResult.isErr()) {
    return err(
      new ApplicationError("Failed to get lead details", leadResult.error),
    );
  }

  const lead = leadResult.value;
  if (lead === null) {
    return err(new NotFoundError("Lead not found"));
  }

  return ok(lead);
}
