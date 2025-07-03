import { err, ok, type Result } from "neverthrow";
import type { z } from "zod/v4";
import { ValidationError } from "./error";

/**
 * Validates data against a schema and returns a Result
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): Result<z.infer<T>, ValidationError> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return err(
      new ValidationError(
        `Validation error: ${result.error.message}`,
        result.error,
      ),
    );
  }

  return ok(result.data);
}
