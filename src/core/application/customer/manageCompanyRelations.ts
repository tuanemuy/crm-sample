import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "@/core/application/context";
import type { Customer } from "@/core/domain/customer/types";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { validate } from "@/lib/validation";

// Input schema for managing company relations
export const manageCompanyRelationsInputSchema = z.object({
  childCustomerId: z.string().uuid(),
  parentCustomerId: z.string().uuid().optional(),
  action: z.enum(["set", "remove"]),
});

export type ManageCompanyRelationsInput = z.infer<
  typeof manageCompanyRelationsInputSchema
>;

// Company hierarchy schema
export const companyHierarchySchema = z.object({
  customerId: z.string().uuid(),
  customerName: z.string(),
  parentCustomer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
  childCustomers: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
  ),
  hierarchyPath: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
  ),
});

export type CompanyHierarchy = z.infer<typeof companyHierarchySchema>;

export async function manageCompanyRelations(
  context: Context,
  input: ManageCompanyRelationsInput,
): Promise<Result<Customer, ApplicationError | NotFoundError>> {
  // Validate input
  const validationResult = validate(manageCompanyRelationsInputSchema, input);
  if (validationResult.isErr()) {
    return err(
      new ApplicationError(
        "Invalid input for managing company relations",
        validationResult.error,
      ),
    );
  }

  const validInput = validationResult.value;

  // Get child customer
  const childResult = await context.customerRepository.findById(
    validInput.childCustomerId,
  );
  if (childResult.isErr()) {
    return err(
      new ApplicationError("Failed to get child customer", childResult.error),
    );
  }

  if (childResult.value === null) {
    return err(new NotFoundError("Child customer not found"));
  }

  // Handle remove action
  if (validInput.action === "remove") {
    const updateResult = await context.customerRepository.update(
      validInput.childCustomerId,
      { parentCustomerId: undefined },
    );

    if (updateResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to remove parent relationship",
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  }

  // Handle set action
  if (validInput.action === "set") {
    if (!validInput.parentCustomerId) {
      return err(
        new ApplicationError("Parent customer ID is required for set action"),
      );
    }

    // Verify parent customer exists
    const parentResult = await context.customerRepository.findById(
      validInput.parentCustomerId,
    );
    if (parentResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to get parent customer",
          parentResult.error,
        ),
      );
    }

    if (parentResult.value === null) {
      return err(new NotFoundError("Parent customer not found"));
    }

    // Check for circular dependency
    const circularCheckResult = await checkCircularDependency(
      context,
      validInput.childCustomerId,
      validInput.parentCustomerId,
    );

    if (circularCheckResult.isErr()) {
      return err(circularCheckResult.error);
    }

    if (circularCheckResult.value) {
      return err(
        new ApplicationError(
          "Cannot set parent relationship: would create circular dependency",
        ),
      );
    }

    // Set parent relationship
    const updateResult = await context.customerRepository.update(
      validInput.childCustomerId,
      { parentCustomerId: validInput.parentCustomerId },
    );

    if (updateResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to set parent relationship",
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  }

  return err(new ApplicationError("Invalid action"));
}

export async function getCompanyHierarchy(
  context: Context,
  customerId: string,
): Promise<Result<CompanyHierarchy, ApplicationError | NotFoundError>> {
  // Get customer
  const customerResult = await context.customerRepository.findById(customerId);
  if (customerResult.isErr()) {
    return err(
      new ApplicationError("Failed to get customer", customerResult.error),
    );
  }

  if (customerResult.value === null) {
    return err(new NotFoundError("Customer not found"));
  }

  const customer = customerResult.value;

  // Get parent customer if exists
  let parentCustomer: { id: string; name: string } | undefined;
  if (customer.parentCustomerId) {
    const parentResult = await context.customerRepository.findById(
      customer.parentCustomerId,
    );
    if (parentResult.isOk() && parentResult.value) {
      parentCustomer = {
        id: parentResult.value.id,
        name: parentResult.value.name,
      };
    }
  }

  // Get child customers
  const childrenResult = await context.customerRepository.list({
    pagination: { page: 1, limit: 1000, order: "asc", orderBy: "name" },
    filter: { parentCustomerId: customerId },
    sortOrder: "asc",
  });

  const childCustomers = childrenResult.isOk()
    ? childrenResult.value.items.map((child) => ({
        id: child.id,
        name: child.name,
      }))
    : [];

  // Get hierarchy path (from root to current customer)
  const hierarchyPath = await getHierarchyPath(context, customerId);

  const hierarchy: CompanyHierarchy = {
    customerId: customer.id,
    customerName: customer.name,
    parentCustomer,
    childCustomers,
    hierarchyPath: hierarchyPath.isOk() ? hierarchyPath.value : [],
  };

  return ok(hierarchy);
}

async function checkCircularDependency(
  context: Context,
  childId: string,
  proposedParentId: string,
): Promise<Result<boolean, ApplicationError>> {
  // If trying to set self as parent, that's circular
  if (childId === proposedParentId) {
    return ok(true);
  }

  // Check if the proposed parent is actually a descendant of the child
  const descendantsResult = await getAllDescendants(context, childId);
  if (descendantsResult.isErr()) {
    return err(descendantsResult.error);
  }

  const descendantIds = descendantsResult.value;
  return ok(descendantIds.includes(proposedParentId));
}

async function getAllDescendants(
  context: Context,
  customerId: string,
): Promise<Result<string[], ApplicationError>> {
  const descendants: string[] = [];
  const queue = [customerId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) break;

    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    // Get direct children
    const childrenResult = await context.customerRepository.list({
      pagination: { page: 1, limit: 1000, order: "asc", orderBy: "name" },
      filter: { parentCustomerId: currentId },
      sortOrder: "asc",
    });

    if (childrenResult.isErr()) {
      return err(
        new ApplicationError("Failed to get descendants", childrenResult.error),
      );
    }

    for (const child of childrenResult.value.items) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return ok(descendants);
}

async function getHierarchyPath(
  context: Context,
  customerId: string,
): Promise<Result<Array<{ id: string; name: string }>, ApplicationError>> {
  const path: Array<{ id: string; name: string }> = [];
  let currentId: string | undefined = customerId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    const customerResult = await context.customerRepository.findById(currentId);
    if (customerResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to build hierarchy path",
          customerResult.error,
        ),
      );
    }

    if (customerResult.value === null) {
      break;
    }

    const customer = customerResult.value;
    path.unshift({ id: customer.id, name: customer.name });
    currentId = customer.parentCustomerId;
  }

  return ok(path);
}
