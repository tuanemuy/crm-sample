import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import {
  type Deal,
  type ListDealsQuery,
  listDealsQuerySchema,
} from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function listDeals(
  context: Context,
  query: ListDealsQuery,
): Promise<Result<{ items: Deal[]; count: number }, ApplicationError>> {
  // Validate query
  const validationResult = validate(listDealsQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        ERROR_MESSAGES.VALIDATION_ERROR,
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // List deals
  const listResult = await context.dealRepository.list(validQuery);
  return listResult.mapErr(
    (error) => new ApplicationError("Failed to list deals", error),
  );
}
