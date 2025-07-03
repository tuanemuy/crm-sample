import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type {
  Approval,
  ApproveApprovalInput,
} from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";

export async function approveRequest(
  context: Context,
  userId: string,
  approvalId: string,
  input: ApproveApprovalInput,
): Promise<Result<Approval, ApplicationError>> {
  // Find the approval request
  const approval = await context.approvalRepository.findById(approvalId);
  if (approval.isErr()) {
    return err(
      new ApplicationError("Failed to find approval request", approval.error),
    );
  }
  if (!approval.value) {
    return err(new ApplicationError("Approval request not found"));
  }

  // Check if user is authorized to approve
  if (approval.value.assignedTo !== userId) {
    return err(
      new ApplicationError("User is not authorized to approve this request"),
    );
  }

  // Check if approval is still pending
  if (approval.value.status !== "pending") {
    return err(
      new ApplicationError("Approval request is not in pending status"),
    );
  }

  // Approve the request
  const result = await context.approvalRepository.approve(
    approvalId,
    userId,
    input,
  );

  if (result.isErr()) {
    return err(new ApplicationError("Failed to approve request", result.error));
  }

  // Send notification to the requester
  const notificationResult = await context.notificationRepository.create({
    userId: approval.value.requestedBy,
    type: "success",
    title: `Approval Request Approved: ${approval.value.title}`,
    message: `Your approval request has been approved${input.comments ? `: ${input.comments}` : "."}`,
    metadata: {
      entityType: "approval",
      entityId: approvalId,
      priority: "medium",
    },
    isRead: false,
  });

  if (notificationResult.isErr()) {
    // Log the error but don't fail the approval
    console.error(
      "Failed to send approval notification:",
      notificationResult.error,
    );
  }

  return ok(result.value);
}
