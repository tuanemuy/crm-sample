import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createCustomerTestData } from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { CreateContactInput } from "@/core/domain/contact/types";
import { ApplicationError } from "@/lib/error";
import { createContact } from "./createContact";

let db: Database;
let context: Context;

describe("createContact - Boundary Value Tests", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("Name Boundary Values", () => {
    it("should reject contact with empty name", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "",
      };

      const result = await createContact(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.CONTACT_INVALID_INPUT,
      );
    });

    it("should create contact with minimum name length (1 character)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "A",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("A");
    });

    it("should create contact with maximum name length (255 characters)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const longName = "A".repeat(255);
      const input: CreateContactInput = {
        customerId: customer.id,
        name: longName,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe(longName);
    });

    it("should reject contact with name exceeding maximum length (256 characters)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const tooLongName = "A".repeat(256);
      const input: CreateContactInput = {
        customerId: customer.id,
        name: tooLongName,
      };

      const result = await createContact(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.CONTACT_INVALID_INPUT,
      );
    });
  });

  describe("Customer ID Boundary Values", () => {
    it("should reject contact with invalid customer ID format", async () => {
      const input: CreateContactInput = {
        customerId: "invalid-uuid",
        name: "John Doe",
      };

      const result = await createContact(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.CONTACT_INVALID_INPUT,
      );
    });

    it("should create contact with valid customer ID", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.customerId).toBe(customer.id);
    });
  });

  describe("Email Boundary Values", () => {
    it("should create contact with valid email", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: "john.doe@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.email).toBe("john.doe@example.com");
    });

    it("should create contact with shortest valid email", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: "a@b.co",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.email).toBe("a@b.co");
    });

    it("should create contact with long valid email", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const longEmail = `${"a".repeat(50)}@${"b".repeat(50)}.com`;
      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: longEmail,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.email).toBe(longEmail);
    });

    it("should create contact with complex valid email", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const complexEmail = "john.doe+test@sub.example-domain.co.uk";
      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: complexEmail,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.email).toBe(complexEmail);
    });

    it("should reject contact with invalid email format (no @)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: "johndoe.example.com",
      };

      const result = await createContact(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.CONTACT_INVALID_INPUT,
      );
    });

    it("should reject contact with invalid email format (no domain)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: "john@",
      };

      const result = await createContact(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.CONTACT_INVALID_INPUT,
      );
    });

    it("should reject contact with invalid email format (no local part)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: "@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.CONTACT_INVALID_INPUT,
      );
    });

    it("should reject contact with invalid email format (multiple @)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        email: "john@doe@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.CONTACT_INVALID_INPUT,
      );
    });

    it("should create contact without email (optional field)", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.email).toBeUndefined();
    });
  });

  describe("Boolean Fields Boundary Values", () => {
    it("should create contact with isPrimary set to true", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        isPrimary: true,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.isPrimary).toBe(true);
    });

    it("should create contact with isPrimary set to false", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        isPrimary: false,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.isPrimary).toBe(false);
    });

    it("should create contact with isActive set to true", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        isActive: true,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.isActive).toBe(true);
    });

    it("should create contact with isActive set to false", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        isActive: false,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.isActive).toBe(true); // Service always sets isActive to true
    });

    it("should create contact with default boolean values when not specified", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.isPrimary).toBe(false); // Default value
      expect(contact.isActive).toBe(true); // Service always sets to true
    });
  });

  describe("Optional Text Fields Boundary Values", () => {
    it("should create contact with all optional text fields provided", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        title: "Chief Technology Officer",
        department: "Engineering",
        email: "john.doe@example.com",
        phone: "+1-555-123-4567",
        mobile: "+1-555-987-6543",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.title).toBe("Chief Technology Officer");
      expect(contact.department).toBe("Engineering");
      expect(contact.email).toBe("john.doe@example.com");
      expect(contact.phone).toBe("+1-555-123-4567");
      expect(contact.mobile).toBe("+1-555-987-6543");
    });

    it("should create contact with very long optional text fields", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const longText = "A".repeat(1000);
      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        title: longText,
        department: longText,
        phone: longText,
        mobile: longText,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.title).toBe(longText);
      expect(contact.department).toBe(longText);
      expect(contact.phone).toBe(longText);
      expect(contact.mobile).toBe(longText);
    });

    it("should create contact with special characters in optional text fields", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        title: "VP of R&D",
        department: "Research & Development",
        phone: "+1 (555) 123-4567 ext. 890",
        mobile: "+1.555.987.6543",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.title).toBe("VP of R&D");
      expect(contact.department).toBe("Research & Development");
      expect(contact.phone).toBe("+1 (555) 123-4567 ext. 890");
      expect(contact.mobile).toBe("+1.555.987.6543");
    });

    it("should create contact with empty optional text fields", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
        title: "",
        department: "",
        phone: "",
        mobile: "",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.title).toBe("");
      expect(contact.department).toBe("");
      expect(contact.phone).toBe("");
      expect(contact.mobile).toBe("");
    });

    it("should create contact without optional text fields", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.title).toBeUndefined();
      expect(contact.department).toBeUndefined();
      expect(contact.phone).toBeUndefined();
      expect(contact.mobile).toBeUndefined();
    });
  });

  describe("Unicode and International Characters", () => {
    it("should create contact with international characters in name", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "José García",
        title: "Gérant",
        department: "Département IT",
        email: "jose.garcia@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("José García");
      expect(contact.title).toBe("Gérant");
      expect(contact.department).toBe("Département IT");
    });

    it("should create contact with Chinese characters", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "张伟",
        title: "软件工程师",
        department: "技术部",
        email: "zhang.wei@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("张伟");
      expect(contact.title).toBe("软件工程师");
      expect(contact.department).toBe("技术部");
    });

    it("should create contact with Japanese characters", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "田中太郎",
        title: "エンジニア",
        department: "開発部",
        email: "tanaka.taro@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("田中太郎");
      expect(contact.title).toBe("エンジニア");
      expect(contact.department).toBe("開発部");
    });

    it("should create contact with emoji characters", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe 🚀",
        title: "CEO 💼",
        department: "Executive Team 🌟",
        email: "john@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("John Doe 🚀");
      expect(contact.title).toBe("CEO 💼");
      expect(contact.department).toBe("Executive Team 🌟");
    });

    it("should create contact with mixed script characters", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John 田中 García",
        title: "Global Manager 国际经理",
        department: "International Division 国际部",
        email: "john.tanaka@example.com",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("John 田中 García");
      expect(contact.title).toBe("Global Manager 国际经理");
      expect(contact.department).toBe("International Division 国际部");
    });
  });

  describe("Edge Cases", () => {
    it("should create contact with whitespace in name", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "  John   Doe  ",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("  John   Doe  ");
    });

    it("should create contact with all fields at boundary values", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const longName = "A".repeat(255);
      const input: CreateContactInput = {
        customerId: customer.id,
        name: longName,
        title: "Chief Technology Officer",
        department: "Engineering",
        email: "john.doe@example.com",
        phone: "+1-555-123-4567",
        mobile: "+1-555-987-6543",
        isPrimary: true,
        isActive: true,
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe(longName);
      expect(contact.title).toBe("Chief Technology Officer");
      expect(contact.department).toBe("Engineering");
      expect(contact.email).toBe("john.doe@example.com");
      expect(contact.phone).toBe("+1-555-123-4567");
      expect(contact.mobile).toBe("+1-555-987-6543");
      expect(contact.isPrimary).toBe(true);
      expect(contact.isActive).toBe(true);
    });

    it("should create contact with minimal required fields only", async () => {
      // Create a test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const input: CreateContactInput = {
        customerId: customer.id,
        name: "John Doe",
      };

      const result = await createContact(context, input);

      expect(result.isOk()).toBe(true);
      const contact = result._unsafeUnwrap();
      expect(contact.name).toBe("John Doe");
      expect(contact.customerId).toBe(customer.id);
      expect(contact.title).toBeUndefined();
      expect(contact.department).toBeUndefined();
      expect(contact.email).toBeUndefined();
      expect(contact.phone).toBeUndefined();
      expect(contact.mobile).toBeUndefined();
      expect(contact.isPrimary).toBe(false);
      expect(contact.isActive).toBe(true);
    });
  });
});
