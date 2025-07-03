import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Activity entity schema
export const activitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["call", "email", "meeting", "task", "note"]),
  subject: z.string(),
  description: z.string().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  scheduledAt: z.date().optional(),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().int().min(0).optional(), // in minutes
  customerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid(),
  createdByUserId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Activity = z.infer<typeof activitySchema>;

// Activity creation input schema
export const createActivityInputSchema = z.object({
  type: z.enum(["call", "email", "meeting", "task", "note"]),
  subject: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  scheduledAt: z.date().optional(),
  dueDate: z.date().optional(),
  duration: z.number().int().min(1).optional(),
  customerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid(),
});

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Activity update input schema
export const updateActivityInputSchema = createActivityInputSchema
  .partial()
  .extend({
    status: z
      .enum(["planned", "in_progress", "completed", "cancelled"])
      .optional(),
    completedAt: z.date().optional(),
  });

export type UpdateActivityInput = z.infer<typeof updateActivityInputSchema>;

// Activity filter schema
export const activityFilterSchema = z.object({
  keyword: z.string().optional(),
  type: z.enum(["call", "email", "meeting", "task", "note"]).optional(),
  status: z
    .enum(["planned", "in_progress", "completed", "cancelled"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  customerId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  createdByUserId: z.string().uuid().optional(),
  scheduledAfter: z.date().optional(),
  scheduledBefore: z.date().optional(),
  dueAfter: z.date().optional(),
  dueBefore: z.date().optional(),
  completedAfter: z.date().optional(),
  completedBefore: z.date().optional(),
});

export type ActivityFilter = z.infer<typeof activityFilterSchema>;

// Activity list query schema
export const listActivitiesQuerySchema = z.object({
  pagination: paginationSchema,
  filter: activityFilterSchema.optional(),
  sortBy: z
    .enum([
      "subject",
      "scheduledAt",
      "dueDate",
      "completedAt",
      "createdAt",
      "updatedAt",
      "priority",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;

// Activity repository params
export const createActivityParamsSchema = z.object({
  type: z.enum(["call", "email", "meeting", "task", "note"]),
  subject: z.string(),
  description: z.string().optional(),
  status: z
    .enum(["planned", "in_progress", "completed", "cancelled"])
    .default("planned"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  scheduledAt: z.date().optional(),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().int().min(0).optional(),
  customerId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid(),
  createdByUserId: z.string().uuid(),
});

export type CreateActivityParams = z.infer<typeof createActivityParamsSchema>;

export const updateActivityParamsSchema = createActivityParamsSchema.partial();
export type UpdateActivityParams = z.infer<typeof updateActivityParamsSchema>;

// Activity with relationships
export const activityWithRelationsSchema = activitySchema.extend({
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
  contact: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email().optional(),
    })
    .optional(),
  deal: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      amount: z.string(),
      stage: z.string(),
    })
    .optional(),
  lead: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email().optional(),
      company: z.string().optional(),
    })
    .optional(),
  assignedUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  createdByUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
});

export type ActivityWithRelations = z.infer<typeof activityWithRelationsSchema>;

// Activity completion input
export const completeActivityInputSchema = z.object({
  completedAt: z.date().default(() => new Date()),
  duration: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

export type CompleteActivityInput = z.infer<typeof completeActivityInputSchema>;

// Activity statistics
export const activityStatsSchema = z.object({
  totalActivities: z.number(),
  plannedActivities: z.number(),
  inProgressActivities: z.number(),
  completedActivities: z.number(),
  cancelledActivities: z.number(),
  overdueActivities: z.number(),
  todayActivities: z.number(),
  upcomingActivities: z.number(),
  activitiesByType: z.record(z.string(), z.number()),
  activitiesByPriority: z.record(z.string(), z.number()),
  completionRate: z.number(),
  avgDuration: z.number(),
  recentActivities: z.array(activitySchema),
});

export type ActivityStats = z.infer<typeof activityStatsSchema>;

// Calendar event for activity
export const calendarEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  type: z.enum(["call", "email", "meeting", "task", "note"]),
  start: z.date(),
  end: z.date().optional(),
  allDay: z.boolean().default(false),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
  deal: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
    })
    .optional(),
  assignedUser: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
