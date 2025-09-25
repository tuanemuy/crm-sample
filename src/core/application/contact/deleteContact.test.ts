import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { deleteContact } from "./deleteContact";

let db: Database;
let context: Context;

describe("deleteContact", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid contact ID", async () => {
      const result = await deleteContact(context, "invalid-uuid");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
    });
  });

  describe("contact existence validation", () => {
    it("should reject deletion if contact does not exist", async () => {
      const contactId = uuidv7();

      const result = await deleteContact(context, contactId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact not found");
    });
  });

  describe("successful deletion", () => {
    it("should delete existing contact", async () => {
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

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete primary contact", async () => {
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

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete inactive contact", async () => {
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

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete contact with all optional fields filled", async () => {
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

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete contact with minimal fields", async () => {
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

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle deletion of contact when customer has multiple contacts", async () => {
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

      const contact3Result = await context.contactRepository.create({
        customerId: customer.id,
        name: "Bob Johnson",
        email: "bob@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contact3Result.isOk()).toBe(true);
      const contact3 = contact3Result._unsafeUnwrap();

      // Delete one contact
      const result = await deleteContact(context, contact2.id);

      expect(result.isOk()).toBe(true);

      // Verify only the specific contact was deleted
      const getResult1 = await context.contactRepository.findById(contact1.id);
      expect(getResult1.isOk()).toBe(true);
      expect(getResult1._unsafeUnwrap()).not.toBeNull();

      const getResult2 = await context.contactRepository.findById(contact2.id);
      expect(getResult2.isOk()).toBe(true);
      expect(getResult2._unsafeUnwrap()).toBeNull();

      const getResult3 = await context.contactRepository.findById(contact3.id);
      expect(getResult3.isOk()).toBe(true);
      expect(getResult3._unsafeUnwrap()).not.toBeNull();
    });

    it("should handle deletion of last contact for a customer", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a single contact
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "Only Contact",
        email: "only@example.com",
        isPrimary: true,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();

      // Verify customer still exists
      const customerGetResult = await context.customerRepository.findById(
        customer.id,
      );
      expect(customerGetResult.isOk()).toBe(true);
      expect(customerGetResult._unsafeUnwrap()).not.toBeNull();
    });

    it("should handle multiple consecutive deletions", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create multiple contacts
      const contactIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const contactResult = await context.contactRepository.create({
          customerId: customer.id,
          name: `Contact ${i}`,
          email: `contact${i}@example.com`,
          isPrimary: i === 0,
          isActive: true,
        });
        expect(contactResult.isOk()).toBe(true);
        const contact = contactResult._unsafeUnwrap();
        contactIds.push(contact.id);
      }

      // Delete all contacts one by one
      for (const contactId of contactIds) {
        const result = await deleteContact(context, contactId);
        expect(result.isOk()).toBe(true);

        // Verify contact was deleted
        const getResult = await context.contactRepository.findById(contactId);
        expect(getResult.isOk()).toBe(true);
        expect(getResult._unsafeUnwrap()).toBeNull();
      }
    });

    it("should fail gracefully when trying to delete same contact twice", async () => {
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

      // Delete contact first time
      const result1 = await deleteContact(context, contact.id);
      expect(result1.isOk()).toBe(true);

      // Try to delete same contact again
      const result2 = await deleteContact(context, contact.id);
      expect(result2.isErr()).toBe(true);
      expect(result2._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result2._unsafeUnwrapErr().message).toBe("Contact not found");
    });

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

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();
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

      const result = await deleteContact(context, contact.id);

      expect(result.isOk()).toBe(true);

      // Verify contact was deleted
      const getResult = await context.contactRepository.findById(contact.id);
      expect(getResult.isOk()).toBe(true);
      expect(getResult._unsafeUnwrap()).toBeNull();
    });
  });
});
