import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Activity } from "@/core/domain/activity/types";
import type { Contact } from "@/core/domain/contact/types";
import type {
  Customer,
  ListCustomersQuery,
} from "@/core/domain/customer/types";
import type { Deal } from "@/core/domain/deal/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";

const exportCustomersInputSchema = z.object({
  format: z.enum(["csv", "xlsx", "json"]).default("csv"),
  filter: z
    .object({
      keyword: z.string().optional(),
      industry: z.string().optional(),
      size: z.enum(["small", "medium", "large", "enterprise"]).optional(),
      status: z.enum(["active", "inactive", "archived"]).optional(),
      assignedUserId: z.string().uuid().optional(),
      createdAfter: z.date().optional(),
      createdBefore: z.date().optional(),
      updatedAfter: z.date().optional(),
      updatedBefore: z.date().optional(),
    })
    .optional(),
  includeContacts: z.boolean().default(false),
  includeDeals: z.boolean().default(false),
  includeActivities: z.boolean().default(false),
});

export type ExportCustomersInput = z.infer<typeof exportCustomersInputSchema>;

export interface ExportResult {
  filename: string;
  content: string;
  mimeType: string;
  recordCount: number;
}

interface CustomerWithRelations extends Customer {
  contacts?: Contact[];
  deals?: Deal[];
  activities?: Activity[];
}

export async function exportCustomers(
  context: Context,
  input: ExportCustomersInput,
): Promise<Result<ExportResult, ApplicationError>> {
  // Validate input
  const validationResult = validate(exportCustomersInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for customer export",
        validationResult.error,
      ),
    );
  }

  const { format, filter, includeContacts, includeDeals, includeActivities } =
    validationResult.value;

  try {
    // Build query for customers
    const query: ListCustomersQuery = {
      pagination: { page: 1, limit: 10000, order: "asc", orderBy: "name" }, // Large limit for export
      filter,
      sortBy: "name",
      sortOrder: "asc",
    };

    // Get customers list
    const customersResult = await context.customerRepository.list(query);
    if (customersResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to fetch customers",
          customersResult.error,
        ),
      );
    }

    const customers = customersResult.value.items;

    // Fetch additional data if requested
    const customersWithRelations = await Promise.all(
      customers.map(async (customer) => {
        const result: CustomerWithRelations = { ...customer };

        if (includeContacts) {
          const contactsResult =
            await context.contactRepository.findByCustomerId(customer.id);
          result.contacts = contactsResult.isOk() ? contactsResult.value : [];
        }

        if (includeDeals) {
          const dealsResult = await context.dealRepository.findByCustomerId(
            customer.id,
          );
          result.deals = dealsResult.isOk() ? dealsResult.value : [];
        }

        if (includeActivities) {
          const activitiesResult =
            await context.activityRepository.findByCustomerId(customer.id);
          result.activities = activitiesResult.isOk()
            ? activitiesResult.value
            : [];
        }

        return result;
      }),
    );

    // Generate export content based on format
    let content: string;
    let mimeType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split("T")[0];

    switch (format) {
      case "csv":
        content = generateCSV(customersWithRelations);
        mimeType = "text/csv";
        filename = `customers_export_${timestamp}.csv`;
        break;

      case "xlsx":
        // For now, return CSV format with XLSX mime type
        // In a real implementation, you'd use a library like xlsx
        content = generateCSV(customersWithRelations);
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `customers_export_${timestamp}.xlsx`;
        break;

      case "json":
        content = JSON.stringify(customersWithRelations, null, 2);
        mimeType = "application/json";
        filename = `customers_export_${timestamp}.json`;
        break;

      default:
        return err(new ApplicationError("Unsupported export format"));
    }

    return ok({
      filename,
      content,
      mimeType,
      recordCount: customers.length,
    });
  } catch (error) {
    return err(new ApplicationError("Failed to export customers", error));
  }
}

function generateCSV(customers: CustomerWithRelations[]): string {
  if (customers.length === 0) {
    return "No customers to export";
  }

  // Define CSV headers
  const headers = [
    "ID",
    "Name",
    "Industry",
    "Size",
    "Status",
    "Website",
    "Phone",
    "Email",
    "Location",
    "Assigned User ID",
    "Created At",
    "Updated At",
  ];

  // Add headers for relations if they exist
  const firstCustomer = customers[0];
  if (firstCustomer.contacts) {
    headers.push("Contact Count");
  }
  if (firstCustomer.deals) {
    headers.push("Deal Count", "Total Deal Value");
  }
  if (firstCustomer.activities) {
    headers.push("Activity Count");
  }

  // Generate CSV rows
  const rows = customers.map((customer) => {
    const row = [
      customer.id,
      customer.name,
      customer.industry || "",
      customer.size || "",
      customer.status || "",
      customer.website || "",
      "", // phone - not available in customer schema
      "", // email - not available in customer schema
      customer.location || "",
      customer.assignedUserId || "",
      customer.createdAt?.toISOString() || "",
      customer.updatedAt?.toISOString() || "",
    ];

    // Add relation data
    if (customer.contacts) {
      row.push(customer.contacts.length.toString());
    }
    if (customer.deals) {
      row.push(customer.deals.length.toString());
      const totalValue = customer.deals
        .reduce(
          (sum: number, deal: Deal) =>
            sum + Number.parseFloat(deal.amount || "0"),
          0,
        )
        .toString();
      row.push(totalValue);
    }
    if (customer.activities) {
      row.push(customer.activities.length.toString());
    }

    return row;
  });

  // Combine headers and rows
  const csvLines = [headers, ...rows];
  return csvLines
    .map((row) =>
      row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}
