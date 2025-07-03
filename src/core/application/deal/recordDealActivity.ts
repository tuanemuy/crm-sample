import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Activity } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Deal activity types - specialized activity types for deals
export const dealActivityTypeSchema = z.enum([
  "prospecting_call", // Initial outreach
  "discovery_meeting", // Needs discovery
  "demo_presentation", // Product demo
  "proposal_presentation", // Proposal presentation
  "negotiation_meeting", // Price/terms negotiation
  "contract_review", // Contract review
  "closing_meeting", // Final closing meeting
  "deal_note", // Deal-specific note
  "competitor_research", // Competitor analysis
  "decision_maker_meeting", // Meeting with decision makers
]);

export type DealActivityType = z.infer<typeof dealActivityTypeSchema>;

// Record deal activity input schema
export const recordDealActivityInputSchema = z.object({
  dealActivityType: dealActivityTypeSchema,
  subject: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  scheduledAt: z.date().optional(),
  duration: z.number().int().min(1).optional(), // in minutes
  status: z
    .enum(["planned", "in_progress", "completed", "cancelled"])
    .default("completed"),
  completedAt: z.date().optional(),

  // Deal-specific fields
  outcome: z.enum(["positive", "neutral", "negative"]).optional(),
  nextSteps: z.string().optional(),
  dealStageChanged: z.boolean().default(false),
  newDealStage: z
    .enum([
      "prospecting",
      "qualification",
      "proposal",
      "negotiation",
      "closed_won",
      "closed_lost",
    ])
    .optional(),

  // Participants
  contactsInvolved: z.array(z.string().uuid()).default([]),
  internalParticipants: z.array(z.string().uuid()).default([]),

  // Follow-up
  requiresFollowUp: z.boolean().default(false),
  followUpDate: z.date().optional(),
  followUpType: dealActivityTypeSchema.optional(),
});

export type RecordDealActivityInput = z.infer<
  typeof recordDealActivityInputSchema
>;

// Map deal activity types to standard activity types
const DEAL_ACTIVITY_TYPE_MAPPING: Record<
  DealActivityType,
  "call" | "email" | "meeting" | "task" | "note"
> = {
  prospecting_call: "call",
  discovery_meeting: "meeting",
  demo_presentation: "meeting",
  proposal_presentation: "meeting",
  negotiation_meeting: "meeting",
  contract_review: "meeting",
  closing_meeting: "meeting",
  deal_note: "note",
  competitor_research: "task",
  decision_maker_meeting: "meeting",
};

// Deal stage progression rules
const STAGE_PROGRESSION_RULES = {
  prospecting_call: ["qualification"],
  discovery_meeting: ["qualification", "proposal"],
  demo_presentation: ["proposal", "negotiation"],
  proposal_presentation: ["negotiation", "closed_won", "closed_lost"],
  negotiation_meeting: ["negotiation", "closed_won", "closed_lost"],
  contract_review: ["closed_won", "closed_lost"],
  closing_meeting: ["closed_won", "closed_lost"],
};

function validateStageProgression(
  activityType: DealActivityType,
  newStage: string,
): boolean {
  const allowedStages =
    STAGE_PROGRESSION_RULES[
      activityType as keyof typeof STAGE_PROGRESSION_RULES
    ];
  return !allowedStages || allowedStages.includes(newStage);
}

export async function recordDealActivity(
  context: Context,
  dealId: string,
  input: RecordDealActivityInput,
  recordedByUserId: string,
): Promise<Result<Activity, ApplicationError>> {
  // Validate input
  const validationResult = validate(recordDealActivityInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for recording deal activity",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Get deal to validate and extract context
  const dealResult = await context.dealRepository.findById(dealId);
  if (dealResult.isErr()) {
    return err(new ApplicationError("Failed to get deal", dealResult.error));
  }

  if (!dealResult.value) {
    return err(new ApplicationError("Deal not found"));
  }

  const deal = dealResult.value;

  // Validate stage progression if deal stage is being changed
  if (validInput.dealStageChanged && validInput.newDealStage) {
    if (
      !validateStageProgression(
        validInput.dealActivityType,
        validInput.newDealStage,
      )
    ) {
      return err(
        new ApplicationError(
          `Activity type "${validInput.dealActivityType}" cannot progress deal to stage "${validInput.newDealStage}"`,
        ),
      );
    }
  }

  // Verify all contacts involved exist and are related to the deal's customer
  for (const contactId of validInput.contactsInvolved) {
    const contactResult = await context.contactRepository.findById(contactId);
    if (contactResult.isErr()) {
      return err(
        new ApplicationError(
          `Failed to verify contact ${contactId}`,
          contactResult.error,
        ),
      );
    }
    if (!contactResult.value) {
      return err(new ApplicationError(`Contact ${contactId} not found`));
    }

    // Check if contact belongs to the deal's customer
    if (contactResult.value.customerId !== deal.customerId) {
      return err(
        new ApplicationError(
          `Contact ${contactId} does not belong to deal's customer`,
        ),
      );
    }
  }

  // Verify all internal participants exist
  for (const userId of validInput.internalParticipants) {
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new ApplicationError(
          `Failed to verify user ${userId}`,
          userResult.error,
        ),
      );
    }
    if (!userResult.value) {
      return err(new ApplicationError(`User ${userId} not found`));
    }
  }

  // Create the activity with enhanced subject including deal context
  const activityType = DEAL_ACTIVITY_TYPE_MAPPING[validInput.dealActivityType];
  const enhancedSubject = `[${validInput.dealActivityType.replace("_", " ").toUpperCase()}] ${validInput.subject}`;

  let enhancedDescription = validInput.description || "";
  if (validInput.outcome) {
    enhancedDescription += `\n\nOutcome: ${validInput.outcome}`;
  }
  if (validInput.nextSteps) {
    enhancedDescription += `\n\nNext Steps: ${validInput.nextSteps}`;
  }
  if (validInput.contactsInvolved.length > 0) {
    enhancedDescription += `\n\nContacts Involved: ${validInput.contactsInvolved.length} contact(s)`;
  }

  // Create activity
  const createResult = await context.activityRepository.create({
    type: activityType,
    subject: enhancedSubject,
    description: enhancedDescription,
    status: validInput.status,
    priority: validInput.priority,
    scheduledAt: validInput.scheduledAt,
    dueDate: validInput.followUpDate,
    completedAt:
      validInput.completedAt ||
      (validInput.status === "completed" ? new Date() : undefined),
    duration: validInput.duration,
    customerId: deal.customerId,
    contactId: deal.contactId || validInput.contactsInvolved[0] || undefined,
    dealId: dealId,
    assignedUserId: deal.assignedUserId,
    createdByUserId: recordedByUserId,
  });

  if (createResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to create deal activity",
        createResult.error,
      ),
    );
  }

  const activity = createResult.value;

  // Update deal stage if requested
  if (validInput.dealStageChanged && validInput.newDealStage) {
    const updateStageResult = await context.dealRepository.update(dealId, {
      stage: validInput.newDealStage,
      actualCloseDate: ["closed_won", "closed_lost"].includes(
        validInput.newDealStage,
      )
        ? new Date()
        : undefined,
    });

    if (updateStageResult.isErr()) {
      // Log error but don't fail the main operation
      console.warn(`Failed to update deal stage: ${updateStageResult.error}`);
    }
  }

  // Create follow-up activity if requested
  if (
    validInput.requiresFollowUp &&
    validInput.followUpDate &&
    validInput.followUpType
  ) {
    const followUpResult = await context.activityRepository.create({
      type: DEAL_ACTIVITY_TYPE_MAPPING[validInput.followUpType],
      subject: `[FOLLOW-UP] ${validInput.followUpType.replace("_", " ")} for ${deal.title}`,
      description: `Follow-up activity from: ${validInput.subject}`,
      status: "planned",
      priority: validInput.priority,
      scheduledAt: validInput.followUpDate,
      customerId: deal.customerId,
      contactId: deal.contactId,
      dealId: dealId,
      assignedUserId: deal.assignedUserId,
      createdByUserId: recordedByUserId,
    });

    if (followUpResult.isErr()) {
      // Log error but don't fail the main operation
      console.warn(
        `Failed to create follow-up activity: ${followUpResult.error}`,
      );
    }
  }

  return ok(activity);
}

// Helper function to get suggested next activity based on deal stage and last activity
export async function suggestNextDealActivity(
  context: Context,
  dealId: string,
): Promise<
  Result<
    {
      type: DealActivityType;
      subject: string;
      priority: "low" | "medium" | "high" | "urgent";
    },
    ApplicationError
  >
> {
  const dealResult = await context.dealRepository.findById(dealId);
  if (dealResult.isErr()) {
    return err(new ApplicationError("Failed to get deal", dealResult.error));
  }

  if (!dealResult.value) {
    return err(new ApplicationError("Deal not found"));
  }

  const deal = dealResult.value;

  // Get recent activities for this deal
  const _recentActivitiesResult = await context.activityRepository.list({
    pagination: { page: 1, limit: 5, order: "desc", orderBy: "createdAt" },
    filter: { dealId: dealId },
    sortOrder: "desc",
  });

  // Suggest based on deal stage and recent activities
  const suggestions: Record<
    string,
    {
      type: DealActivityType;
      subject: string;
      priority: "low" | "medium" | "high" | "urgent";
    }
  > = {
    prospecting: {
      type: "prospecting_call",
      subject: "Initial outreach call",
      priority: "medium",
    },
    qualification: {
      type: "discovery_meeting",
      subject: "Needs discovery meeting",
      priority: "high",
    },
    proposal: {
      type: "demo_presentation",
      subject: "Product demonstration",
      priority: "high",
    },
    negotiation: {
      type: "negotiation_meeting",
      subject: "Price and terms negotiation",
      priority: "urgent",
    },
  };

  const suggestion = suggestions[deal.stage] || {
    type: "deal_note",
    subject: "Deal status update",
    priority: "medium",
  };

  return ok(suggestion);
}
