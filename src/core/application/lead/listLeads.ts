import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import {
  type Lead,
  type ListLeadsQuery,
  listLeadsQuerySchema,
} from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

export async function listLeads(
  context: Context,
  query: ListLeadsQuery,
): Promise<Result<{ items: Lead[]; count: number }, ApplicationError>> {
  // Validate query
  const validationResult = validate(listLeadsQuerySchema, query);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid query for listing leads",
        validationResult.error,
      ),
    );
  }

  const validQuery = validationResult.value;

  // List leads
  const listResult = await context.leadRepository.list(validQuery);
  return listResult.mapErr(
    (error) => new ApplicationError("Failed to list leads", error),
  );
}
