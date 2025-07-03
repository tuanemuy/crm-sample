import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { ApprovalWithRelations } from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";

export async function getApprovalDetails(
  context: Context,
  approvalId: string,
): Promise<Result<ApprovalWithRelations, ApplicationError>> {
  const result =
    await context.approvalRepository.findByIdWithRelations(approvalId);

  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to get approval details", result.error),
    );
  }

  if (!result.value) {
    return err(new ApplicationError("Approval not found"));
  }

  return ok(result.value);
}
