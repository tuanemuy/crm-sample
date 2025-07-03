import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type {
  Approval,
  CreateApprovalInput,
} from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";

export async function createApprovalRequest(
  context: Context,
  userId: string,
  input: CreateApprovalInput,
): Promise<Result<Approval, ApplicationError>> {
  // Validate that the entity exists
  const entityValidation = await validateEntity(
    context,
    input.entityType,
    input.entityId,
  );
  if (entityValidation.isErr()) {
    return err(entityValidation.error);
  }

  // Validate that the assigned user exists and has permission to approve
  const userValidation = await validateApprover(context, input.assignedTo);
  if (userValidation.isErr()) {
    return err(userValidation.error);
  }

  // Create the approval request
  const result = await context.approvalRepository.create({
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    description: input.description,
    requestedBy: userId,
    assignedTo: input.assignedTo,
    priority: input.priority,
    requestData: input.requestData,
    dueDate: input.dueDate,
  });

  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to create approval request", result.error),
    );
  }

  // Send notification to the approver
  const notificationResult = await context.notificationRepository.create({
    userId: input.assignedTo,
    type: "alert",
    title: `New Approval Request: ${input.title}`,
    message: `You have a new approval request for ${input.entityType} that requires your attention.`,
    metadata: {
      entityType: "approval",
      entityId: result.value.id,
      priority: input.priority === "urgent" ? "high" : "medium",
    },
    isRead: false,
  });

  if (notificationResult.isErr()) {
    // Log the error but don't fail the approval creation
    console.error(
      "Failed to send approval notification:",
      notificationResult.error,
    );
  }

  return ok(result.value);
}

async function validateEntity(
  context: Context,
  entityType: string,
  entityId: string,
): Promise<Result<void, ApplicationError>> {
  switch (entityType) {
    case "deal": {
      const deal = await context.dealRepository.findById(entityId);
      if (deal.isErr()) {
        return err(new ApplicationError("Failed to validate deal", deal.error));
      }
      if (!deal.value) {
        return err(new ApplicationError("Deal not found"));
      }
      break;
    }
    case "proposal": {
      const proposal =
        await context.proposalRepository.findProposalById(entityId);
      if (proposal.isErr()) {
        return err(
          new ApplicationError("Failed to validate proposal", proposal.error),
        );
      }
      if (!proposal.value) {
        return err(new ApplicationError("Proposal not found"));
      }
      break;
    }
    // Add more entity type validations as needed
  }

  return ok(undefined);
}

async function validateApprover(
  context: Context,
  userId: string,
): Promise<Result<void, ApplicationError>> {
  const user = await context.userRepository.findById(userId);
  if (user.isErr()) {
    return err(new ApplicationError("Failed to validate approver", user.error));
  }
  if (!user.value) {
    return err(new ApplicationError("Approver not found"));
  }
  if (!user.value.isActive) {
    return err(new ApplicationError("Approver is not active"));
  }

  // Check if user has approval permissions
  const permissions =
    await context.permissionRepository.getUserPermissions(userId);
  if (permissions.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check approver permissions",
        permissions.error,
      ),
    );
  }

  const hasApprovalPermission = permissions.value.some(
    (permission) =>
      permission.name === "approve_deals" || permission.name === "admin",
  );

  if (!hasApprovalPermission) {
    return err(new ApplicationError("User does not have approval permissions"));
  }

  return ok(undefined);
}
