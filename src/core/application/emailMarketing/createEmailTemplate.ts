import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { EmailTemplate } from "@/core/domain/emailMarketing/types";
import { ApplicationError } from "@/lib/error";

export const createEmailTemplateInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  subject: z.string().min(1).max(500),
  content: z.string().min(1),
  type: z.enum(["marketing", "transactional", "newsletter"]),
  userId: z.string().uuid(),
});
export type CreateEmailTemplateInput = z.infer<
  typeof createEmailTemplateInputSchema
>;

export async function createEmailTemplate(
  context: Context,
  input: CreateEmailTemplateInput,
): Promise<Result<EmailTemplate, ApplicationError>> {
  const result = await context.emailMarketingRepository.createTemplate({
    name: input.name,
    description: input.description,
    subject: input.subject,
    content: input.content,
    type: input.type,
    createdBy: input.userId,
  });

  if (result.isErr()) {
    return err(
      new ApplicationError("Failed to create email template", result.error),
    );
  }

  return ok(result.value);
}
