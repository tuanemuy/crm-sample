import { err, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { PipelineData } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";

export async function getDealsPipeline(
  context: Context,
  userId?: string,
): Promise<Result<PipelineData, ApplicationError>> {
  // If userId is provided, verify user exists
  if (userId) {
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new ApplicationError("Failed to verify user", userResult.error),
      );
    }
    if (userResult.value === null) {
      return err(new ApplicationError("User does not exist"));
    }
  }

  // Get pipeline data
  const pipelineResult = await context.dealRepository.getPipelineData(userId);
  return pipelineResult.mapErr(
    (error) => new ApplicationError("Failed to get pipeline data", error),
  );
}
