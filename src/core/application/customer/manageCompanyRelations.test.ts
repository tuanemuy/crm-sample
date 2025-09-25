import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ManageCompanyRelationsInput } from "@/core/application/customer/manageCompanyRelations";
import { ApplicationError, NotFoundError } from "@/lib/error";
import {
  getCompanyHierarchy,
  manageCompanyRelations,
} from "./manageCompanyRelations";

let db: Database;
let context: Context;

describe("manageCompanyRelations", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate company relation requirements", async () => {
      const invalidInputs = [
        {
          childCustomerId: "", // Empty child customer ID
          action: "set",
          parentCustomerId: uuidv7(),
        },
        {
          childCustomerId: "invalid-uuid", // Invalid UUID
          action: "set",
          parentCustomerId: uuidv7(),
        },
        {
          childCustomerId: uuidv7(),
          action: "invalid", // Invalid action
          parentCustomerId: uuidv7(),
        },
      ];

      for (const input of invalidInputs) {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        const result = await manageCompanyRelations(context, input as any);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });
  });

  describe("business logic validation", () => {
    it("should reject if child customer does not exist", async () => {
      const input: ManageCompanyRelationsInput = {
        childCustomerId: uuidv7(),
        action: "remove",
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Child customer not found",
      );
    });

    it("should reject if parent customer does not exist for set action", async () => {
      // Create child customer
      const childResult = await context.customerRepository.create({
        name: "Child Company",
        status: "active",
      });
      expect(childResult.isOk()).toBe(true);
      const childCustomer = childResult._unsafeUnwrap();

      const input: ManageCompanyRelationsInput = {
        childCustomerId: childCustomer.id,
        action: "set",
        parentCustomerId: uuidv7(),
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Parent customer not found",
      );
    });

    it("should reject if parent customer ID is not provided for set action", async () => {
      // Create child customer
      const childResult = await context.customerRepository.create({
        name: "Child Company",
        status: "active",
      });
      expect(childResult.isOk()).toBe(true);
      const childCustomer = childResult._unsafeUnwrap();

      const input: ManageCompanyRelationsInput = {
        childCustomerId: childCustomer.id,
        action: "set",
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Parent customer ID is required",
      );
    });

    it("should reject circular dependency (self as parent)", async () => {
      // Create customer
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: ManageCompanyRelationsInput = {
        childCustomerId: customer.id,
        action: "set",
        parentCustomerId: customer.id,
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "circular dependency",
      );
    });

    it("should reject circular dependency (descendant as parent)", async () => {
      // Create parent -> child -> grandchild hierarchy
      const parentResult = await context.customerRepository.create({
        name: "Parent Company",
        status: "active",
      });
      expect(parentResult.isOk()).toBe(true);
      const parent = parentResult._unsafeUnwrap();

      const childResult = await context.customerRepository.create({
        name: "Child Company",
        status: "active",
        parentCustomerId: parent.id,
      });
      expect(childResult.isOk()).toBe(true);
      const child = childResult._unsafeUnwrap();

      const grandchildResult = await context.customerRepository.create({
        name: "Grandchild Company",
        status: "active",
        parentCustomerId: child.id,
      });
      expect(grandchildResult.isOk()).toBe(true);
      const grandchild = grandchildResult._unsafeUnwrap();

      // Try to set grandchild as parent of parent (circular)
      const input: ManageCompanyRelationsInput = {
        childCustomerId: parent.id,
        action: "set",
        parentCustomerId: grandchild.id,
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "circular dependency",
      );
    });
  });

  describe("successful operations", () => {
    it("should successfully set parent-child relationship", async () => {
      // Create parent and child customers
      const parentResult = await context.customerRepository.create({
        name: "Parent Company",
        status: "active",
      });
      expect(parentResult.isOk()).toBe(true);
      const parent = parentResult._unsafeUnwrap();

      const childResult = await context.customerRepository.create({
        name: "Child Company",
        status: "active",
      });
      expect(childResult.isOk()).toBe(true);
      const child = childResult._unsafeUnwrap();

      const input: ManageCompanyRelationsInput = {
        childCustomerId: child.id,
        action: "set",
        parentCustomerId: parent.id,
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isOk()).toBe(true);
      const updatedCustomer = result._unsafeUnwrap();
      expect(updatedCustomer.parentCustomerId).toBe(parent.id);
    });

    it("should successfully remove parent-child relationship", async () => {
      // Create parent and child customers with existing relationship
      const parentResult = await context.customerRepository.create({
        name: "Parent Company",
        status: "active",
      });
      expect(parentResult.isOk()).toBe(true);
      const parent = parentResult._unsafeUnwrap();

      const childResult = await context.customerRepository.create({
        name: "Child Company",
        status: "active",
        parentCustomerId: parent.id,
      });
      expect(childResult.isOk()).toBe(true);
      const child = childResult._unsafeUnwrap();

      const input: ManageCompanyRelationsInput = {
        childCustomerId: child.id,
        action: "remove",
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isOk()).toBe(true);
      const updatedCustomer = result._unsafeUnwrap();
      expect(updatedCustomer.parentCustomerId).toBeUndefined();
    });

    it("should successfully change parent relationship", async () => {
      // Create old parent, new parent, and child
      const oldParentResult = await context.customerRepository.create({
        name: "Old Parent Company",
        status: "active",
      });
      expect(oldParentResult.isOk()).toBe(true);
      const oldParent = oldParentResult._unsafeUnwrap();

      const newParentResult = await context.customerRepository.create({
        name: "New Parent Company",
        status: "active",
      });
      expect(newParentResult.isOk()).toBe(true);
      const newParent = newParentResult._unsafeUnwrap();

      const childResult = await context.customerRepository.create({
        name: "Child Company",
        status: "active",
        parentCustomerId: oldParent.id,
      });
      expect(childResult.isOk()).toBe(true);
      const child = childResult._unsafeUnwrap();

      const input: ManageCompanyRelationsInput = {
        childCustomerId: child.id,
        action: "set",
        parentCustomerId: newParent.id,
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isOk()).toBe(true);
      const updatedCustomer = result._unsafeUnwrap();
      expect(updatedCustomer.parentCustomerId).toBe(newParent.id);
    });
  });

  describe("edge cases", () => {
    it("should handle removing parent from customer with no parent", async () => {
      // Create customer without parent
      const customerResult = await context.customerRepository.create({
        name: "Independent Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: ManageCompanyRelationsInput = {
        childCustomerId: customer.id,
        action: "remove",
      };

      const result = await manageCompanyRelations(context, input);

      expect(result.isOk()).toBe(true);
      const updatedCustomer = result._unsafeUnwrap();
      expect(updatedCustomer.parentCustomerId).toBeUndefined();
    });
  });
});

describe("getCompanyHierarchy", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  it("should return hierarchy for customer with no parent or children", async () => {
    const customerResult = await context.customerRepository.create({
      name: "Standalone Company",
      status: "active",
    });
    expect(customerResult.isOk()).toBe(true);
    const customer = customerResult._unsafeUnwrap();

    const result = await getCompanyHierarchy(context, customer.id);

    expect(result.isOk()).toBe(true);
    const hierarchy = result._unsafeUnwrap();
    expect(hierarchy.customerId).toBe(customer.id);
    expect(hierarchy.customerName).toBe("Standalone Company");
    expect(hierarchy.parentCustomer).toBeUndefined();
    expect(hierarchy.childCustomers).toHaveLength(0);
    expect(hierarchy.hierarchyPath).toHaveLength(1);
    expect(hierarchy.hierarchyPath[0].id).toBe(customer.id);
  });

  it("should return hierarchy for customer with parent and children", async () => {
    // Create parent -> child -> grandchild hierarchy
    const parentResult = await context.customerRepository.create({
      name: "Parent Company",
      status: "active",
    });
    expect(parentResult.isOk()).toBe(true);
    const parent = parentResult._unsafeUnwrap();

    const childResult = await context.customerRepository.create({
      name: "Child Company",
      status: "active",
      parentCustomerId: parent.id,
    });
    expect(childResult.isOk()).toBe(true);
    const child = childResult._unsafeUnwrap();

    const grandchildResult = await context.customerRepository.create({
      name: "Grandchild Company",
      status: "active",
      parentCustomerId: child.id,
    });
    expect(grandchildResult.isOk()).toBe(true);
    const grandchild = grandchildResult._unsafeUnwrap();

    const result = await getCompanyHierarchy(context, child.id);

    expect(result.isOk()).toBe(true);
    const hierarchy = result._unsafeUnwrap();
    expect(hierarchy.customerId).toBe(child.id);
    expect(hierarchy.customerName).toBe("Child Company");
    expect(hierarchy.parentCustomer).toEqual({
      id: parent.id,
      name: "Parent Company",
    });
    expect(hierarchy.childCustomers).toHaveLength(1);
    expect(hierarchy.childCustomers[0]).toEqual({
      id: grandchild.id,
      name: "Grandchild Company",
    });
    expect(hierarchy.hierarchyPath).toHaveLength(2);
    expect(hierarchy.hierarchyPath[0]).toEqual({
      id: parent.id,
      name: "Parent Company",
    });
    expect(hierarchy.hierarchyPath[1]).toEqual({
      id: child.id,
      name: "Child Company",
    });
  });

  it("should return error for non-existent customer", async () => {
    const result = await getCompanyHierarchy(context, uuidv7());

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
    expect(result._unsafeUnwrapErr().message).toBe("Customer not found");
  });
});
