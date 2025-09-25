import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createContactTestData,
  createCustomerTestData,
  createDealTestData,
  createLeadTestData,
  createUserTestData,
} from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { CreateActivityInput } from "@/core/domain/activity/types";
import { ApplicationError } from "@/lib/error";
import { createDeal } from "../deal/createDeal";
import { createLead } from "../lead/createLead";
import { createActivity } from "./createActivity";

let db: Database;
let context: Context;
let testUserId: string;
let testAssignedUserId: string;

describe("createActivity - Boundary Value Tests", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);

    // Create test users
    const userData = createUserTestData();
    const userResult = await context.userRepository.create({
      ...userData,
      passwordHash: "hash",
      isActive: true,
    });
    expect(userResult.isOk()).toBe(true);
    testUserId = userResult._unsafeUnwrap().id;

    const assignedUserData = createUserTestData({
      overrides: { email: "assigned@example.com" },
    });
    const assignedUserResult = await context.userRepository.create({
      ...assignedUserData,
      passwordHash: "hash",
      isActive: true,
    });
    expect(assignedUserResult.isOk()).toBe(true);
    testAssignedUserId = assignedUserResult._unsafeUnwrap().id;
  });

  describe("Subject Boundary Values", () => {
    it("should reject activity with empty subject", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should create activity with minimum subject length (1 character)", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "A",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.subject).toBe("A");
    });

    it("should create activity with maximum subject length (255 characters)", async () => {
      const longSubject = "A".repeat(255);
      const input: CreateActivityInput = {
        type: "task",
        subject: longSubject,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.subject).toBe(longSubject);
    });

    it("should reject activity with subject exceeding maximum length (256 characters)", async () => {
      const tooLongSubject = "A".repeat(256);
      const input: CreateActivityInput = {
        type: "task",
        subject: tooLongSubject,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });
  });

  describe("Duration Boundary Values", () => {
    it("should reject activity with zero duration", async () => {
      const input: CreateActivityInput = {
        type: "meeting",
        subject: "Test Meeting",
        duration: 0,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should reject activity with negative duration", async () => {
      const input: CreateActivityInput = {
        type: "meeting",
        subject: "Test Meeting",
        duration: -1,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should create activity with minimum duration (1 minute)", async () => {
      const input: CreateActivityInput = {
        type: "meeting",
        subject: "Quick Meeting",
        duration: 1,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.duration).toBe(1);
    });

    it("should create activity with large duration (24 hours)", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Long Task",
        duration: 1440, // 24 hours in minutes
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.duration).toBe(1440);
    });

    it("should create activity without duration (optional field)", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Task Without Duration",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.duration).toBeUndefined();
    });
  });

  describe("Activity Type Boundary Values", () => {
    const activityTypes = ["call", "email", "meeting", "task", "note"];

    activityTypes.forEach((type) => {
      it(`should create activity with type ${type}`, async () => {
        const input: CreateActivityInput = {
          type: type as any,
          subject: `Test ${type}`,
          assignedUserId: testAssignedUserId,
        };

        const result = await createActivity(context, input, testUserId);

        expect(result.isOk()).toBe(true);
        const activity = result._unsafeUnwrap();
        expect(activity.type).toBe(type);
      });
    });

    it("should reject activity with invalid type", async () => {
      const input = {
        type: "invalid_type",
        subject: "Test Activity",
        assignedUserId: testAssignedUserId,
      } as CreateActivityInput;

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });
  });

  describe("Priority Boundary Values", () => {
    const priorities = ["low", "medium", "high", "urgent"];

    priorities.forEach((priority) => {
      it(`should create activity with priority ${priority}`, async () => {
        const input: CreateActivityInput = {
          type: "task",
          subject: "Test Task",
          priority: priority as any,
          assignedUserId: testAssignedUserId,
        };

        const result = await createActivity(context, input, testUserId);

        expect(result.isOk()).toBe(true);
        const activity = result._unsafeUnwrap();
        expect(activity.priority).toBe(priority);
      });
    });

    it("should default to medium priority when not specified", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.priority).toBe("medium");
    });

    it("should reject activity with invalid priority", async () => {
      const input = {
        type: "task",
        subject: "Test Task",
        priority: "invalid_priority",
        assignedUserId: testAssignedUserId,
      } as CreateActivityInput;

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });
  });

  describe("UUID Boundary Values", () => {
    it("should reject activity with invalid assignedUserId UUID", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: "invalid-uuid",
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should reject activity with invalid customerId UUID", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        customerId: "invalid-uuid",
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should reject activity with invalid contactId UUID", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        contactId: "invalid-uuid",
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should reject activity with invalid dealId UUID", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        dealId: "invalid-uuid",
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should reject activity with invalid leadId UUID", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        leadId: "invalid-uuid",
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for activity creation",
      );
    });

    it("should reject activity with non-existent assignedUserId", async () => {
      const nonExistentUserId = uuidv7();
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: nonExistentUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Assigned user does not exist",
      );
    });

    it("should reject activity with non-existent customerId", async () => {
      const nonExistentCustomerId = uuidv7();
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        customerId: nonExistentCustomerId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Customer does not exist");
    });

    it("should reject activity with non-existent contactId", async () => {
      const nonExistentContactId = uuidv7();
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        contactId: nonExistentContactId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Contact does not exist");
    });

    it("should reject activity with non-existent dealId", async () => {
      const nonExistentDealId = uuidv7();
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        dealId: nonExistentDealId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Deal does not exist");
    });

    it("should reject activity with non-existent leadId", async () => {
      const nonExistentLeadId = uuidv7();
      const input: CreateActivityInput = {
        type: "task",
        subject: "Test Task",
        assignedUserId: testAssignedUserId,
        leadId: nonExistentLeadId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Lead does not exist");
    });
  });

  describe("Date Boundary Values", () => {
    it("should create activity with scheduled date in the future", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const input: CreateActivityInput = {
        type: "meeting",
        subject: "Future Meeting",
        scheduledAt: futureDate,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.scheduledAt).toEqual(futureDate);
    });

    it("should create activity with scheduled date in the past", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const input: CreateActivityInput = {
        type: "meeting",
        subject: "Past Meeting",
        scheduledAt: pastDate,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.scheduledAt).toEqual(pastDate);
    });

    it("should create activity with due date in the future", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
      const input: CreateActivityInput = {
        type: "task",
        subject: "Task with Due Date",
        dueDate: futureDate,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.dueDate).toEqual(futureDate);
    });

    it("should create activity with both scheduled and due dates", async () => {
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
      const input: CreateActivityInput = {
        type: "task",
        subject: "Scheduled Task",
        scheduledAt: scheduledDate,
        dueDate: dueDate,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.scheduledAt).toEqual(scheduledDate);
      expect(activity.dueDate).toEqual(dueDate);
    });

    it("should create activity without dates (optional fields)", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Task Without Dates",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.scheduledAt).toBeUndefined();
      expect(activity.dueDate).toBeUndefined();
    });
  });

  describe("Association Boundary Values", () => {
    it("should create activity with valid customer association", async () => {
      // Create test customer
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customerId = customerResult._unsafeUnwrap().id;

      const input: CreateActivityInput = {
        type: "call",
        subject: "Customer Call",
        assignedUserId: testAssignedUserId,
        customerId: customerId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.customerId).toBe(customerId);
    });

    it("should create activity with valid contact association", async () => {
      // Create test customer first
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customerId = customerResult._unsafeUnwrap().id;

      // Create test contact
      const contactData = createContactTestData({ overrides: { customerId } });
      const contactResult = await context.contactRepository.create({
        ...contactData,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contactId = contactResult._unsafeUnwrap().id;

      const input: CreateActivityInput = {
        type: "email",
        subject: "Contact Email",
        assignedUserId: testAssignedUserId,
        contactId: contactId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.contactId).toBe(contactId);
    });

    it("should create activity with valid deal association", async () => {
      // Create test customer
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customerId = customerResult._unsafeUnwrap().id;

      // Create test deal
      const dealData = createDealTestData({
        overrides: { customerId, assignedUserId: testAssignedUserId },
      });
      const dealResult = await createDeal(context, dealData);
      expect(dealResult.isOk()).toBe(true);
      const dealId = dealResult._unsafeUnwrap().id;

      const input: CreateActivityInput = {
        type: "meeting",
        subject: "Deal Meeting",
        assignedUserId: testAssignedUserId,
        dealId: dealId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.dealId).toBe(dealId);
    });

    it("should create activity with valid lead association", async () => {
      // Create test lead
      const leadData = createLeadTestData();
      const leadResult = await createLead(context, leadData);
      expect(leadResult.isOk()).toBe(true);
      const leadId = leadResult._unsafeUnwrap().id;

      const input: CreateActivityInput = {
        type: "call",
        subject: "Lead Call",
        assignedUserId: testAssignedUserId,
        leadId: leadId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.leadId).toBe(leadId);
    });

    it("should create activity with multiple associations", async () => {
      // Create test customer
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customerId = customerResult._unsafeUnwrap().id;

      // Create test contact
      const contactData = createContactTestData({ overrides: { customerId } });
      const contactResult = await context.contactRepository.create({
        ...contactData,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contactId = contactResult._unsafeUnwrap().id;

      // Create test deal
      const dealData = createDealTestData({
        overrides: { customerId, assignedUserId: testAssignedUserId },
      });
      const dealResult = await createDeal(context, dealData);
      expect(dealResult.isOk()).toBe(true);
      const dealId = dealResult._unsafeUnwrap().id;

      const input: CreateActivityInput = {
        type: "meeting",
        subject: "Comprehensive Meeting",
        assignedUserId: testAssignedUserId,
        customerId: customerId,
        contactId: contactId,
        dealId: dealId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.customerId).toBe(customerId);
      expect(activity.contactId).toBe(contactId);
      expect(activity.dealId).toBe(dealId);
    });

    it("should create activity without any associations", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Standalone Task",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.customerId).toBeUndefined();
      expect(activity.contactId).toBeUndefined();
      expect(activity.dealId).toBeUndefined();
      expect(activity.leadId).toBeUndefined();
    });
  });

  describe("Description Boundary Values", () => {
    it("should create activity with empty description", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Task with Empty Description",
        description: "",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.description).toBe("");
    });

    it("should create activity with long description", async () => {
      const longDescription = "A".repeat(1000);
      const input: CreateActivityInput = {
        type: "task",
        subject: "Task with Long Description",
        description: longDescription,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.description).toBe(longDescription);
    });

    it("should create activity with special characters in description", async () => {
      const specialDescription =
        "Description with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";
      const input: CreateActivityInput = {
        type: "task",
        subject: "Task with Special Characters",
        description: specialDescription,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.description).toBe(specialDescription);
    });

    it("should create activity without description (optional field)", async () => {
      const input: CreateActivityInput = {
        type: "task",
        subject: "Task Without Description",
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.description).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should create activity with all maximum values", async () => {
      // Create test customer, contact, and deal
      const customerData = createCustomerTestData();
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customerId = customerResult._unsafeUnwrap().id;

      const contactData = createContactTestData({ overrides: { customerId } });
      const contactResult = await context.contactRepository.create({
        ...contactData,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);
      const contactId = contactResult._unsafeUnwrap().id;

      const dealData = createDealTestData({
        overrides: { customerId, assignedUserId: testAssignedUserId },
      });
      const dealResult = await createDeal(context, dealData);
      expect(dealResult.isOk()).toBe(true);
      const dealId = dealResult._unsafeUnwrap().id;

      const maxSubject = "A".repeat(255);
      const maxDescription = "B".repeat(1000);
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const input: CreateActivityInput = {
        type: "meeting",
        subject: maxSubject,
        description: maxDescription,
        priority: "urgent",
        scheduledAt: scheduledDate,
        dueDate: dueDate,
        duration: 1440, // 24 hours
        customerId: customerId,
        contactId: contactId,
        dealId: dealId,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.subject).toBe(maxSubject);
      expect(activity.description).toBe(maxDescription);
      expect(activity.priority).toBe("urgent");
      expect(activity.scheduledAt).toEqual(scheduledDate);
      expect(activity.dueDate).toEqual(dueDate);
      expect(activity.duration).toBe(1440);
      expect(activity.customerId).toBe(customerId);
      expect(activity.contactId).toBe(contactId);
      expect(activity.dealId).toBe(dealId);
    });

    it("should create activity with all minimum values", async () => {
      const input: CreateActivityInput = {
        type: "note",
        subject: "A",
        priority: "low",
        duration: 1,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.subject).toBe("A");
      expect(activity.priority).toBe("low");
      expect(activity.duration).toBe(1);
      expect(activity.type).toBe("note");
    });

    it("should create activity with mixed boundary values", async () => {
      const longSubject = "B".repeat(255);
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Next year

      const input: CreateActivityInput = {
        type: "task",
        subject: longSubject,
        priority: "high",
        scheduledAt: futureDate,
        duration: 1,
        assignedUserId: testAssignedUserId,
      };

      const result = await createActivity(context, input, testUserId);

      expect(result.isOk()).toBe(true);
      const activity = result._unsafeUnwrap();
      expect(activity.subject).toBe(longSubject);
      expect(activity.priority).toBe("high");
      expect(activity.scheduledAt).toEqual(futureDate);
      expect(activity.duration).toBe(1);
    });
  });
});
