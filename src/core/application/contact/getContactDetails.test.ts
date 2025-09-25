import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { getContactDetails } from "./getContactDetails";

let db: Database;
let context: Context;

describe("getContactDetails", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid contact ID", async () => {
      const result = await getContactDetails(context, "invalid-uuid");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get contact details",
      );
    });

    it("should reject empty contact ID", async () => {
      const result = await getContactDetails(context, "");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get contact details",
      );
    });

    it("should reject null contact ID", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getContactDetails(context, null as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get contact details",
      );
    });

    it("should reject undefined contact ID", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getContactDetails(context, undefined as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to get contact details",
      );
    });
  });

  describe("contact existence validation", () => {
    it("should return error when contact does not exist", async () => {
      const contactId = uuidv7();

      const result = await getContactDetails(context, contactId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact not found");
    });

    it("should return error when contact ID is valid UUID but non-existent", async () => {
      const contactId = uuidv7();

      const result = await getContactDetails(context, contactId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact not found");
    });
  });

  describe("successful retrieval", () => {
    it("should return contact details for existing contact", async () => {
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
        isPrimary: true,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("John Doe");
      expect(retrievedContact.email).toBe("john@example.com");
      expect(retrievedContact.isPrimary).toBe(true);
      expect(retrievedContact.isActive).toBe(true);
      expect(retrievedContact.customerId).toBe(customer.id);
    });

    it("should return contact details with all fields populated", async () => {
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
        title: "Software Engineer",
        department: "Engineering",
        email: "john@example.com",
        phone: "+1-555-0123",
        mobile: "+1-555-9876",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("John Doe");
      expect(retrievedContact.title).toBe("Software Engineer");
      expect(retrievedContact.department).toBe("Engineering");
      expect(retrievedContact.email).toBe("john@example.com");
      expect(retrievedContact.phone).toBe("+1-555-0123");
      expect(retrievedContact.mobile).toBe("+1-555-9876");
      expect(retrievedContact.isPrimary).toBe(false);
      expect(retrievedContact.isActive).toBe(true);
      expect(retrievedContact.customerId).toBe(customer.id);
    });

    it("should return contact details with minimal fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with minimal fields
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "Jane Smith",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("Jane Smith");
      expect(retrievedContact.title).toBeUndefined();
      expect(retrievedContact.department).toBeUndefined();
      expect(retrievedContact.email).toBeUndefined();
      expect(retrievedContact.phone).toBeUndefined();
      expect(retrievedContact.mobile).toBeUndefined();
      expect(retrievedContact.isPrimary).toBe(false);
      expect(retrievedContact.isActive).toBe(true);
      expect(retrievedContact.customerId).toBe(customer.id);
    });

    it("should return primary contact details", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a primary contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "Primary Contact",
        email: "primary@example.com",
        isPrimary: true,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("Primary Contact");
      expect(retrievedContact.email).toBe("primary@example.com");
      expect(retrievedContact.isPrimary).toBe(true);
      expect(retrievedContact.isActive).toBe(true);
    });

    it("should return inactive contact details", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create an inactive contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "Inactive Contact",
        email: "inactive@example.com",
        isPrimary: false,
        isActive: false,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("Inactive Contact");
      expect(retrievedContact.email).toBe("inactive@example.com");
      expect(retrievedContact.isPrimary).toBe(false);
      expect(retrievedContact.isActive).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle contact with special characters in name", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with special characters
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "José María O'Connor-Smith",
        email: "jose@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("José María O'Connor-Smith");
      expect(retrievedContact.email).toBe("jose@example.com");
    });

    it("should handle contact with international phone numbers", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with international phone numbers
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "International Contact",
        email: "international@example.com",
        phone: "+44 20 7946 0958",
        mobile: "+81 3-1234-5678",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("International Contact");
      expect(retrievedContact.email).toBe("international@example.com");
      expect(retrievedContact.phone).toBe("+44 20 7946 0958");
      expect(retrievedContact.mobile).toBe("+81 3-1234-5678");
    });

    it("should handle contact with long field values", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with long field values
      const longName = "A".repeat(255);
      const longTitle =
        "Senior Executive Vice President of Strategic Business Development";
      const longDepartment =
        "Department of Advanced Technology Research and Development";

      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: longName,
        title: longTitle,
        department: longDepartment,
        email: "long@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe(longName);
      expect(retrievedContact.title).toBe(longTitle);
      expect(retrievedContact.department).toBe(longDepartment);
      expect(retrievedContact.email).toBe("long@example.com");
    });

    it("should handle contact with empty optional fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with empty optional fields
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "Empty Fields Contact",
        title: undefined,
        department: undefined,
        phone: undefined,
        mobile: undefined,
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.id).toBe(contact.id);
      expect(retrievedContact.name).toBe("Empty Fields Contact");
      expect(retrievedContact.title).toBeUndefined();
      expect(retrievedContact.department).toBeUndefined();
      expect(retrievedContact.email).toBeUndefined();
      expect(retrievedContact.phone).toBeUndefined();
      expect(retrievedContact.mobile).toBeUndefined();
    });

    it("should handle multiple contacts for same customer", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create multiple contacts
      const contact1Result = await context.contactRepository.create({
        customerId: customer.id,
        name: "John Doe",
        email: "john@example.com",
        isPrimary: true,
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

      // Get details for first contact
      const result1 = await getContactDetails(context, contact1.id);
      expect(result1.isOk()).toBe(true);
      const retrievedContact1 = result1._unsafeUnwrap();
      expect(retrievedContact1.id).toBe(contact1.id);
      expect(retrievedContact1.name).toBe("John Doe");
      expect(retrievedContact1.isPrimary).toBe(true);

      // Get details for second contact
      const result2 = await getContactDetails(context, contact2.id);
      expect(result2.isOk()).toBe(true);
      const retrievedContact2 = result2._unsafeUnwrap();
      expect(retrievedContact2.id).toBe(contact2.id);
      expect(retrievedContact2.name).toBe("Jane Smith");
      expect(retrievedContact2.isPrimary).toBe(false);
    });
  });

  describe("data integrity", () => {
    it("should return consistent data on multiple calls", async () => {
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
        name: "Consistent Contact",
        email: "consistent@example.com",
        isPrimary: true,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      // Call getContactDetails multiple times
      const result1 = await getContactDetails(context, contact.id);
      const result2 = await getContactDetails(context, contact.id);
      const result3 = await getContactDetails(context, contact.id);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result3.isOk()).toBe(true);

      const contact1 = result1._unsafeUnwrap();
      const contact2 = result2._unsafeUnwrap();
      const contact3 = result3._unsafeUnwrap();

      expect(contact1).toEqual(contact2);
      expect(contact2).toEqual(contact3);
    });

    it("should include createdAt and updatedAt timestamps", async () => {
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
        name: "Timestamped Contact",
        email: "timestamped@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await getContactDetails(context, contact.id);

      expect(result.isOk()).toBe(true);
      const retrievedContact = result._unsafeUnwrap();
      expect(retrievedContact.createdAt).toBeInstanceOf(Date);
      expect(retrievedContact.updatedAt).toBeInstanceOf(Date);
      expect(retrievedContact.createdAt.getTime()).toBeLessThanOrEqual(
        retrievedContact.updatedAt.getTime(),
      );
    });
  });
});
