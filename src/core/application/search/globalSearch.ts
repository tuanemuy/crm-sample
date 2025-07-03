import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Global search result types
const globalSearchResultSchema = z.object({
  customers: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      industry: z.string().optional(),
      type: z.literal("customer"),
    }),
  ),
  leads: z.array(
    z.object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      company: z.string().optional(),
      email: z.string().email().optional(),
      type: z.literal("lead"),
    }),
  ),
  deals: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      amount: z.string(),
      stage: z.string(),
      type: z.literal("deal"),
    }),
  ),
  activities: z.array(
    z.object({
      id: z.string().uuid(),
      subject: z.string(),
      type: z.enum(["call", "email", "meeting", "task", "note"]),
      scheduledAt: z.date().optional(),
      resultType: z.literal("activity"),
    }),
  ),
});

export type GlobalSearchResult = z.infer<typeof globalSearchResultSchema>;

const globalSearchInputSchema = z.object({
  keyword: z.string().min(1).max(255),
  limit: z.number().int().min(1).max(50).default(10),
  includeCustomers: z.boolean().default(true),
  includeLeads: z.boolean().default(true),
  includeDeals: z.boolean().default(true),
  includeActivities: z.boolean().default(true),
});

export type GlobalSearchInput = z.infer<typeof globalSearchInputSchema>;

export async function globalSearch(
  context: Context,
  input: GlobalSearchInput,
): Promise<Result<GlobalSearchResult, ApplicationError>> {
  // Validate input
  const validationResult = validate(globalSearchInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for global search",
        validationResult.error,
      ),
    );
  }

  const {
    keyword,
    limit,
    includeCustomers,
    includeLeads,
    includeDeals,
    includeActivities,
  } = validationResult.value;

  try {
    // Perform parallel searches across all entities
    const [customersResult, leadsResult, dealsResult, activitiesResult] =
      await Promise.all([
        includeCustomers
          ? context.customerRepository.search(keyword, limit)
          : Promise.resolve(ok([])),
        includeLeads
          ? context.leadRepository.search(keyword, limit)
          : Promise.resolve(ok([])),
        includeDeals
          ? context.dealRepository.search(keyword, limit)
          : Promise.resolve(ok([])),
        includeActivities
          ? context.activityRepository.search(keyword, undefined, limit)
          : Promise.resolve(ok([])),
      ]);

    // Transform results and handle errors
    const customers = customersResult
      .map((customers) =>
        customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          industry: customer.industry,
          type: "customer" as const,
        })),
      )
      .unwrapOr([]);

    const leads = leadsResult
      .map((leads) =>
        leads.map((lead) => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          company: lead.company,
          email: lead.email,
          type: "lead" as const,
        })),
      )
      .unwrapOr([]);

    const deals = dealsResult
      .map((deals) =>
        deals.map((deal) => ({
          id: deal.id,
          title: deal.title,
          amount: deal.amount,
          stage: deal.stage,
          type: "deal" as const,
        })),
      )
      .unwrapOr([]);

    const activities = activitiesResult
      .map((activities) =>
        activities.map((activity) => ({
          id: activity.id,
          subject: activity.subject,
          type: activity.type,
          scheduledAt: activity.scheduledAt,
          resultType: "activity" as const,
        })),
      )
      .unwrapOr([]);

    const searchResult: GlobalSearchResult = {
      customers,
      leads,
      deals,
      activities,
    };

    return ok(searchResult);
  } catch (error) {
    return err(new ApplicationError("Failed to perform global search", error));
  }
}
