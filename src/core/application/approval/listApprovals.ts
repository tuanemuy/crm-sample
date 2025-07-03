import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type {
  Approval,
  ListApprovalsQuery,
} from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";

export async function listApprovals(
  context: Context,
  query: ListApprovalsQuery,
): Promise<Result<{ items: Approval[]; count: number }, ApplicationError>> {
  const result = await context.approvalRepository.list(query);

  if (result.isErr()) {
    return err(new ApplicationError("Failed to list approvals", result.error));
  }

  return ok(result.value);
}
