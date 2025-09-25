import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { UpdateContactInput } from "@/core/domain/contact/types";
import { ApplicationError } from "@/lib/error";
import { updateContact } from "./updateContact";

let db: Database;
let context: Context;

describe("updateContact", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate contact information requirements", async () => {
      const invalidInputs = [
        { contactId: "invalid-uuid", input: { name: "Updated Name" } }, // Invalid UUID
        { contactId: "", input: { name: "Updated Name" } }, // Empty ID
        { contactId: uuidv7(), input: { name: "" } }, // Empty name
        { contactId: uuidv7(), input: { name: "A".repeat(256) } }, // Name too long
        { contactId: uuidv7(), input: { email: "invalid-email" } }, // Invalid email
      ];

      for (const { contactId, input } of invalidInputs) {
        const result = await updateContact(
          context,
          contactId,
          input as UpdateContactInput,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      }
    });

    it("should accept valid input", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("contact existence validation", () => {
    it("should reject update if contact does not exist", async () => {
      const contactId = uuidv7();
      const input: UpdateContactInput = {
        name: "Updated Name",
      };

      const result = await updateContact(context, contactId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact not found");
    });

    it("should reject update for non-existent contact with valid UUID", async () => {
      const contactId = uuidv7();
      const input: UpdateContactInput = {
        name: "Updated Name",
      };

      const result = await updateContact(context, contactId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact not found");
    });
  });

  describe("successful updates", () => {
    it("should update contact name", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        name: "Updated Name",
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe("Updated Name");
      expect(updatedContact.email).toBe("john@example.com");
      expect(updatedContact.customerId).toBe(customer.id);
    });

    it("should update contact email", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        email: "updated@example.com",
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe("John Doe");
      expect(updatedContact.email).toBe("updated@example.com");
    });

    it("should update multiple fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        title: "Engineer",
        department: "Engineering",
        phone: "+1-555-0123",
        mobile: "+1-555-9876",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        name: "Jane Smith",
        email: "jane@example.com",
        title: "Senior Engineer",
        department: "Product Engineering",
        phone: "+1-555-1111",
        mobile: "+1-555-2222",
        isPrimary: true,
        isActive: false,
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe("Jane Smith");
      expect(updatedContact.email).toBe("jane@example.com");
      expect(updatedContact.title).toBe("Senior Engineer");
      expect(updatedContact.department).toBe("Product Engineering");
      expect(updatedContact.phone).toBe("+1-555-1111");
      expect(updatedContact.mobile).toBe("+1-555-2222");
      expect(updatedContact.isPrimary).toBe(true);
      expect(updatedContact.isActive).toBe(false);
    });

    it("should update contact with partial fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with all fields
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        title: "Engineer",
        department: "Engineering",
        phone: "+1-555-0123",
        mobile: "+1-555-9876",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        title: "Senior Engineer",
        isPrimary: true,
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe("John Doe");
      expect(updatedContact.email).toBe("john@example.com");
      expect(updatedContact.title).toBe("Senior Engineer");
      expect(updatedContact.department).toBe("Engineering");
      expect(updatedContact.phone).toBe("+1-555-0123");
      expect(updatedContact.mobile).toBe("+1-555-9876");
      expect(updatedContact.isPrimary).toBe(true);
      expect(updatedContact.isActive).toBe(true);
    });

    it("should clear optional fields when set to undefined", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with optional fields
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        title: "Engineer",
        department: "Engineering",
        phone: "+1-555-0123",
        mobile: "+1-555-9876",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        title: undefined,
        department: undefined,
        phone: undefined,
        mobile: undefined,
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe("John Doe");
      expect(updatedContact.email).toBe("john@example.com");
      expect(updatedContact.title).toBeUndefined();
      expect(updatedContact.department).toBeUndefined();
      expect(updatedContact.phone).toBeUndefined();
      expect(updatedContact.mobile).toBeUndefined();
    });

    it("should update contact to primary status", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a non-primary contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        isPrimary: true,
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.isPrimary).toBe(true);
    });

    it("should update contact to inactive status", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create an active contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        isActive: false,
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.isActive).toBe(false);
    });

    it("should handle empty object input", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {};

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe("John Doe");
      expect(updatedContact.email).toBe("john@example.com");
      expect(updatedContact.isPrimary).toBe(false);
      expect(updatedContact.isActive).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle contact with special characters", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        name: "José María O'Connor-Smith",
        email: "jose.maria@example.com",
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe("José María O'Connor-Smith");
      expect(updatedContact.email).toBe("jose.maria@example.com");
    });

    it("should handle international phone numbers", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const input: UpdateContactInput = {
        phone: "+44 20 7946 0958",
        mobile: "+81 3-1234-5678",
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.phone).toBe("+44 20 7946 0958");
      expect(updatedContact.mobile).toBe("+81 3-1234-5678");
    });

    it("should handle long field values", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const longName = "A".repeat(255);
      const longTitle =
        "Senior Executive Vice President of Strategic Business Development";
      const longDepartment =
        "Department of Advanced Technology Research and Development";

      const input: UpdateContactInput = {
        name: longName,
        title: longTitle,
        department: longDepartment,
      };

      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.id).toBe(contact.id);
      expect(updatedContact.name).toBe(longName);
      expect(updatedContact.title).toBe(longTitle);
      expect(updatedContact.department).toBe(longDepartment);
    });

    it("should handle multiple consecutive updates", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      // First update
      const input1: UpdateContactInput = {
        name: "Jane Smith",
      };
      const result1 = await updateContact(context, contact.id, input1);
      expect(result1.isOk()).toBe(true);
      expect(result1._unsafeUnwrap().name).toBe("Jane Smith");

      // Second update
      const input2: UpdateContactInput = {
        email: "jane.smith@example.com",
      };
      const result2 = await updateContact(context, contact.id, input2);
      expect(result2.isOk()).toBe(true);
      const updatedContact2 = result2._unsafeUnwrap();
      expect(updatedContact2.name).toBe("Jane Smith");
      expect(updatedContact2.email).toBe("jane.smith@example.com");

      // Third update
      const input3: UpdateContactInput = {
        title: "Manager",
        isPrimary: true,
      };
      const result3 = await updateContact(context, contact.id, input3);
      expect(result3.isOk()).toBe(true);
      const updatedContact3 = result3._unsafeUnwrap();
      expect(updatedContact3.name).toBe("Jane Smith");
      expect(updatedContact3.email).toBe("jane.smith@example.com");
      expect(updatedContact3.title).toBe("Manager");
      expect(updatedContact3.isPrimary).toBe(true);
    });
  });

  describe("data integrity", () => {
    it("should not affect other contacts", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create two contacts
      const contact1Result = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contact1Result.isOk()).toBe(true);
      const contact1 = contact1Result._unsafeUnwrap();

      const contact2Result = await context.contactRepository.create({
        customerId: customer.id,
        name: "Jane Smith",
        email: "jane@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contact2Result.isOk()).toBe(true);
      const contact2 = contact2Result._unsafeUnwrap();

      // Update first contact
      const input: UpdateContactInput = {
        name: "John Updated",
        isPrimary: true,
      };
      const result = await updateContact(context, contact1.id, input);
      expect(result.isOk()).toBe(true);

      // Verify second contact is unchanged
      const getResult = await context.contactRepository.findById(contact2.id);
      expect(getResult.isOk()).toBe(true);
      const unchangedContact = getResult._unsafeUnwrap();
      expect(unchangedContact?.name).toBe("Jane Smith");
      expect(unchangedContact?.email).toBe("jane@example.com");
      expect(unchangedContact?.isPrimary).toBe(false);
    });

    it("should update timestamps correctly", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const originalUpdatedAt = contact.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 2));

      const input: UpdateContactInput = {
        name: "Updated Name",
      };
      const result = await updateContact(context, contact.id, input);

      expect(result.isOk()).toBe(true);
      const updatedContact = result._unsafeUnwrap();
      expect(updatedContact.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
      expect(updatedContact.createdAt).toEqual(contact.createdAt);
    });
  });
});
