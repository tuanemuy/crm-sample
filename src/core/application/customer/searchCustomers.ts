import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Customer } from "@/core/domain/customer/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const searchCustomersInputSchema = z.object({
  keyword: z.string().min(1).max(255),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchCustomersInput = z.infer<typeof searchCustomersInputSchema>;

export async function searchCustomers(
  context: Context,
  input: SearchCustomersInput,
): Promise<Result<Customer[], ApplicationError>> {
  // Validate input
  const validationResult = validate(searchCustomersInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for customer search",
        validationResult.error,
      ),
    );
  }

  const { keyword, limit } = validationResult.value;

  // Perform search using repository
  const searchResult = await context.customerRepository.search(keyword, limit);
  if (searchResult.isErr()) {
    return err(
      new ApplicationError("Failed to search customers", searchResult.error),
    );
  }

  return ok(searchResult.value);
}
