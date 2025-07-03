import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { DealWithRelations } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";

export async function getDealDetails(
  context: Context,
  dealId: string,
): Promise<Result<DealWithRelations, ApplicationError>> {
  // Get deal details with relations
  const getResult = await context.dealRepository.findByIdWithRelations(dealId);
  if (getResult.isErr()) {
    return err(
      new ApplicationError("Failed to get deal details", getResult.error),
    );
  }

  if (!getResult.value) {
    return err(new ApplicationError("Deal not found"));
  }

  return ok(getResult.value);
}
