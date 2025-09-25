import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { CreateContactHistoryInput } from "@/core/domain/contactHistory/types";
import { ApplicationError } from "@/lib/error";
import { addContactRecord } from "./addContactRecord";

let db: Database;
let context: Context;

describe("addContactRecord", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate contact record requirements", async () => {
      const contactedByUserId = uuidv7();
      const invalidInputs = [
        {
          customerId: uuidv7(),
          type: "call",
          subject: "", // Empty subject
        },
        {
          customerId: uuidv7(),
          type: "call",
          subject: "A".repeat(256), // Subject too long
        },
        {
          customerId: "invalid-uuid", // Invalid UUID
          type: "call",
          subject: "Test Call",
        },
        {
          customerId: uuidv7(),
          type: "invalid" as "call", // Invalid contact type
          subject: "Test Contact",
        },
        {
          customerId: uuidv7(),
          type: "call" as const,
          subject: "Test Call",
          direction: "invalid" as "inbound", // Invalid direction
        },
        {
          customerId: uuidv7(),
          type: "call" as const,
          subject: "Test Call",
          status: "invalid" as "completed", // Invalid status
        },
        {
          customerId: uuidv7(),
          type: "call",
          subject: "Test Call",
          duration: -30, // Negative duration
        },
        {
          customerId: uuidv7(),
          type: "call",
          subject: "Test Call",
          duration: 0, // Zero duration
        },
      ];

      for (const input of invalidInputs) {
        const result = await addContactRecord(
          context,
          input as CreateContactHistoryInput,
          contactedByUserId,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });
  });

  describe("customer existence validation", () => {
    it("should reject when customer does not exist", async () => {
      const customerId = uuidv7();
      const contactedByUserId = uuidv7();
      const input: CreateContactHistoryInput = {
        customerId,
        type: "call",
        subject: "Test Call",
      };

      const result = await addContactRecord(context, input, contactedByUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer not found");
    });
  });

  describe("contact existence validation", () => {
    it("should reject when contact does not exist", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const contactId = uuidv7();
      const contactedByUserId = uuidv7();
      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        contactId,
        type: "call",
        subject: "Test Call",
      };

      const result = await addContactRecord(context, input, contactedByUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact not found");
    });

    it("should succeed when contactId is not provided", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "call",
        subject: "Test Call",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.customerId).toBe(customer.id);
      expect(contactHistory.contactId).toBeNull();
      expect(contactHistory.type).toBe("call");
      expect(contactHistory.subject).toBe("Test Call");
    });
  });

  describe("successful contact record creation", () => {
    it("should create a basic call record", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "call",
        subject: "Initial contact call",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.customerId).toBe(customer.id);
      expect(contactHistory.type).toBe("call");
      expect(contactHistory.subject).toBe("Initial contact call");
      expect(contactHistory.contactedByUserId).toBe(user.id);
      expect(contactHistory.contactedAt).toBeInstanceOf(Date);
      expect(contactHistory.createdAt).toBeInstanceOf(Date);
      expect(contactHistory.updatedAt).toBeInstanceOf(Date);
    });

    it("should create a call record with contact", async () => {
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

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        contactId: contact.id,
        type: "call",
        subject: "Follow-up call with John",
        content: "Discussed pricing and next steps",
        direction: "outbound",
        status: "completed",
        duration: 1800,
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.customerId).toBe(customer.id);
      expect(contactHistory.contactId).toBe(contact.id);
      expect(contactHistory.type).toBe("call");
      expect(contactHistory.subject).toBe("Follow-up call with John");
      expect(contactHistory.content).toBe("Discussed pricing and next steps");
      expect(contactHistory.direction).toBe("outbound");
      expect(contactHistory.status).toBe("completed");
      expect(contactHistory.duration).toBe(1800);
      expect(contactHistory.contactedByUserId).toBe(user.id);
    });

    it("should create an email record", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "email",
        subject: "Proposal sent",
        content: "Sent detailed proposal with pricing information",
        direction: "outbound",
        status: "completed",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.customerId).toBe(customer.id);
      expect(contactHistory.type).toBe("email");
      expect(contactHistory.subject).toBe("Proposal sent");
      expect(contactHistory.content).toBe(
        "Sent detailed proposal with pricing information",
      );
      expect(contactHistory.direction).toBe("outbound");
      expect(contactHistory.status).toBe("completed");
      expect(contactHistory.duration).toBeNull();
    });

    it("should create a meeting record", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const customContactedAt = new Date("2024-01-15T10:00:00Z");
      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "meeting",
        subject: "Product demo meeting",
        content: "Demonstrated key features and answered questions",
        status: "completed",
        duration: 3600,
        contactedAt: customContactedAt,
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.customerId).toBe(customer.id);
      expect(contactHistory.type).toBe("meeting");
      expect(contactHistory.subject).toBe("Product demo meeting");
      expect(contactHistory.content).toBe(
        "Demonstrated key features and answered questions",
      );
      expect(contactHistory.status).toBe("completed");
      expect(contactHistory.duration).toBe(3600);
      expect(contactHistory.contactedAt).toEqual(customContactedAt);
    });

    it("should create a note record", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "note",
        subject: "Customer research notes",
        content: "Company is expanding rapidly, looking for scalable solutions",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.customerId).toBe(customer.id);
      expect(contactHistory.type).toBe("note");
      expect(contactHistory.subject).toBe("Customer research notes");
      expect(contactHistory.content).toBe(
        "Company is expanding rapidly, looking for scalable solutions",
      );
      expect(contactHistory.direction).toBeNull();
      expect(contactHistory.status).toBeNull();
      expect(contactHistory.duration).toBeNull();
    });

    it("should create inbound contact records", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "call",
        subject: "Customer inquiry call",
        content: "Customer called with questions about pricing",
        direction: "inbound",
        status: "completed",
        duration: 900,
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.direction).toBe("inbound");
      expect(contactHistory.status).toBe("completed");
    });

    it("should create attempted contact records", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "call",
        subject: "Follow-up call attempt",
        direction: "outbound",
        status: "attempted",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.status).toBe("attempted");
      expect(contactHistory.duration).toBeNull();
    });

    it("should create failed contact records", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "email",
        subject: "Bounce back email",
        content: "Email bounced due to invalid address",
        direction: "outbound",
        status: "failed",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.status).toBe("failed");
    });
  });

  describe("edge cases", () => {
    it("should handle very long content", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const longContent = "Very detailed discussion notes. ".repeat(100);
      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "meeting",
        subject: "Detailed meeting",
        content: longContent,
        status: "completed",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.content).toBe(longContent);
    });

    it("should handle special characters in subject and content", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "note",
        subject: "Follow-up: Q&A about José's proposal (50% discount)",
        content:
          "Discussed José's feedback on pricing. Customer mentioned they're comparing with competitors (€10k vs $12k). Next step: send revised proposal.",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.subject).toBe(
        "Follow-up: Q&A about José's proposal (50% discount)",
      );
      expect(contactHistory.content).toContain("José's feedback");
      expect(contactHistory.content).toContain("€10k vs $12k");
    });

    it("should handle large duration values", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "meeting",
        subject: "All-day workshop",
        duration: 28800, // 8 hours in seconds
        status: "completed",
      };

      const result = await addContactRecord(context, input, user.id);

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.duration).toBe(28800);
    });

    it("should use current time when contactedAt is not provided", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const beforeTime = new Date();
      const input: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "call",
        subject: "Quick call",
      };

      const result = await addContactRecord(context, input, user.id);
      const afterTime = new Date();

      expect(result.isOk()).toBe(true);
      const contactHistory = result._unsafeUnwrap();
      expect(contactHistory.contactedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(contactHistory.contactedAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe("data integrity", () => {
    it("should create multiple contact records for same customer", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for contactedByUserId
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create first contact record
      const input1: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "call",
        subject: "Initial call",
      };
      const result1 = await addContactRecord(context, input1, user.id);
      expect(result1.isOk()).toBe(true);

      // Create second contact record
      const input2: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "email",
        subject: "Follow-up email",
      };
      const result2 = await addContactRecord(context, input2, user.id);
      expect(result2.isOk()).toBe(true);

      // Both should be created successfully
      const contactHistory1 = result1._unsafeUnwrap();
      const contactHistory2 = result2._unsafeUnwrap();
      expect(contactHistory1.id).not.toBe(contactHistory2.id);
      expect(contactHistory1.customerId).toBe(customer.id);
      expect(contactHistory2.customerId).toBe(customer.id);
    });

    it("should create contact records with different users", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create two users
      const user1Result = await context.userRepository.create({
        name: "User One",
        email: "user1@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(user1Result.isOk()).toBe(true);
      const user1 = user1Result._unsafeUnwrap();

      const user2Result = await context.userRepository.create({
        name: "User Two",
        email: "user2@example.com",
        passwordHash: "hashed-password",
        role: "user",
        isActive: true,
      });
      expect(user2Result.isOk()).toBe(true);
      const user2 = user2Result._unsafeUnwrap();

      // Create contact records with different users
      const input1: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "call",
        subject: "Call by User One",
      };
      const result1 = await addContactRecord(context, input1, user1.id);
      expect(result1.isOk()).toBe(true);

      const input2: CreateContactHistoryInput = {
        customerId: customer.id,
        type: "email",
        subject: "Email by User Two",
      };
      const result2 = await addContactRecord(context, input2, user2.id);
      expect(result2.isOk()).toBe(true);

      const contactHistory1 = result1._unsafeUnwrap();
      const contactHistory2 = result2._unsafeUnwrap();
      expect(contactHistory1.contactedByUserId).toBe(user1.id);
      expect(contactHistory2.contactedByUserId).toBe(user2.id);
    });
  });
});
