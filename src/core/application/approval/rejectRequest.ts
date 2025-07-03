import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type {
  Approval,
  RejectApprovalInput,
} from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";

export async function rejectRequest(
  context: Context,
  userId: string,
  approvalId: string,
  input: RejectApprovalInput,
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

  // Check if user is authorized to reject
  if (approval.value.assignedTo !== userId) {
    return err(
      new ApplicationError("User is not authorized to reject this request"),
    );
  }

  // Check if approval is still pending
  if (approval.value.status !== "pending") {
    return err(
      new ApplicationError("Approval request is not in pending status"),
    );
  }

  // Reject the request
  const result = await context.approvalRepository.reject(
    approvalId,
    userId,
    input,
  );

  if (result.isErr()) {
    return err(new ApplicationError("Failed to reject request", result.error));
  }

  // Send notification to the requester
  const notificationResult = await context.notificationRepository.create({
    userId: approval.value.requestedBy,
    type: "warning",
    title: `Approval Request Rejected: ${approval.value.title}`,
    message: `Your approval request has been rejected. Reason: ${input.reason}. Comments: ${input.comments}`,
    metadata: {
      entityType: "approval",
      entityId: approvalId,
      priority: "high",
    },
    isRead: false,
  });

  if (notificationResult.isErr()) {
    // Log the error but don't fail the rejection
    console.error(
      "Failed to send rejection notification:",
      notificationResult.error,
    );
  }

  return ok(result.value);
}
