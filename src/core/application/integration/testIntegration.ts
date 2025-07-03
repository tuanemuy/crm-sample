import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { validate } from "@/lib/validation";

export const testIntegrationInputSchema = z.object({
  id: z.string().uuid(),
});

export type TestIntegrationInput = z.infer<typeof testIntegrationInputSchema>;

export async function testIntegration(
  context: Context,
  input: TestIntegrationInput,
): Promise<Result<boolean, ApplicationError | NotFoundError>> {
  const validationResult = validate(testIntegrationInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for integration test",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  const integrationResult = await context.integrationRepository.findById(
    validInput.id,
  );
  if (integrationResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to get integration",
        integrationResult.error,
      ),
    );
  }

  if (!integrationResult.value) {
    return err(new NotFoundError("Integration not found"));
  }

  const integration = integrationResult.value;

  const testResult =
    await context.integrationService.testConnection(integration);
  if (testResult.isErr()) {
    await context.integrationRepository.update(integration.id, {
      status: "error",
      lastErrorMessage: testResult.error.message,
    });
    return err(
      new ApplicationError("Integration test failed", testResult.error),
    );
  }

  await context.integrationRepository.update(integration.id, {
    status: "active",
    lastErrorMessage: undefined,
  });

  return ok(testResult.value);
}
