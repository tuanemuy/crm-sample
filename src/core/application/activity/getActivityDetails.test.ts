import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { createActivity } from "./createActivity";
import { getActivityDetails } from "./getActivityDetails";

let db: Database;
let context: Context;

describe("getActivityDetails", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid activity ID", async () => {
      const result = await getActivityDetails(context, {
        id: "invalid-id",
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for getting activity details",
      );
    });

    it("should reject empty activity ID", async () => {
      const result = await getActivityDetails(context, {
        id: "",
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Invalid input for getting activity details",
      );
    });
  });

  describe("activity retrieval", () => {
    it("should return error for non-existent activity", async () => {
      const result = await getActivityDetails(context, {
        id: "123e4567-e89b-12d3-a456-426614174000",
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Activity not found");
    });

    it("should return activity details for existing activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Important Call",
          description: "Call with potential client",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.id).toBe(activity.id);
      expect(activityDetails.subject).toBe("Important Call");
      expect(activityDetails.description).toBe("Call with potential client");
      expect(activityDetails.type).toBe("call");
      expect(activityDetails.priority).toBe("high");
      expect(activityDetails.assignedUser).toBeDefined();
      expect(activityDetails.assignedUser.id).toBe(user.id);
      expect(activityDetails.assignedUser.name).toBe("Test User");
      expect(activityDetails.assignedUser.email).toBe("test@example.com");
      expect(activityDetails.createdByUser).toBeDefined();
      expect(activityDetails.createdByUser.id).toBe(user.id);
      expect(activityDetails.createdByUser.name).toBe("Test User");
      expect(activityDetails.createdByUser.email).toBe("test@example.com");
    });

    it("should return activity details with customer relation", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a customer
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        industry: "Technology",
        size: "medium",
        status: "active",
        assignedUserId: user.id,
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create an activity with customer relation
      const createResult = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Customer Meeting",
          description: "Meeting with customer",
          priority: "high",
          customerId: customer.id,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.id).toBe(activity.id);
      expect(activityDetails.customer).toBeDefined();
      expect(activityDetails.customer?.id).toBe(customer.id);
      expect(activityDetails.customer?.name).toBe("Test Customer");
    });

    it("should return activity details with deal relation", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a customer
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        industry: "Technology",
        size: "medium",
        status: "active",
        assignedUserId: user.id,
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        description: "Test deal description",
        amount: "50000",
        stage: "prospecting",
        probability: 25,
        expectedCloseDate: new Date("2024-12-31"),
        competitors: [],
        customerId: customer.id,
        assignedUserId: user.id,
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      // Create an activity with deal relation
      const createResult = await createActivity(
        context,
        {
          type: "email",
          subject: "Deal Follow-up",
          description: "Follow-up email for deal",
          priority: "medium",
          dealId: deal.id,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.id).toBe(activity.id);
      expect(activityDetails.deal).toBeDefined();
      expect(activityDetails.deal?.id).toBe(deal.id);
      expect(activityDetails.deal?.title).toBe("Test Deal");
      expect(activityDetails.deal?.amount).toBe("50000.00");
      expect(activityDetails.deal?.stage).toBe("prospecting");
    });

    it("should return activity details with all relation types", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a customer
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        industry: "Technology",
        size: "medium",
        status: "active",
        assignedUserId: user.id,
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact
      const contactResult = await context.contactRepository.create({
        name: "Test Contact",
        email: "contact@example.com",
        phone: "123-456-7890",
        title: "Manager",
        isPrimary: true,
        isActive: true,
        customerId: customer.id,
      });
      expect(contactResult.isOk()).toBe(true);
      const contact = contactResult._unsafeUnwrap();

      // Create an activity with multiple relations
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Comprehensive Call",
          description: "Call with customer and contact",
          priority: "urgent",
          customerId: customer.id,
          contactId: contact.id,
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.id).toBe(activity.id);
      expect(activityDetails.customer).toBeDefined();
      expect(activityDetails.customer?.id).toBe(customer.id);
      expect(activityDetails.customer?.name).toBe("Test Customer");
      expect(activityDetails.contact).toBeDefined();
      expect(activityDetails.contact?.id).toBe(contact.id);
      expect(activityDetails.contact?.name).toBe("Test Contact");
      expect(activityDetails.contact?.email).toBe("contact@example.com");
    });
  });

  describe("activity types", () => {
    it("should return details for call activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a call activity
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Sales Call",
          description: "Important sales call",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.type).toBe("call");
      expect(activityDetails.subject).toBe("Sales Call");
    });

    it("should return details for email activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an email activity
      const createResult = await createActivity(
        context,
        {
          type: "email",
          subject: "Follow-up Email",
          description: "Email follow-up",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.type).toBe("email");
      expect(activityDetails.subject).toBe("Follow-up Email");
    });

    it("should return details for meeting activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a meeting activity
      const createResult = await createActivity(
        context,
        {
          type: "meeting",
          subject: "Team Meeting",
          description: "Weekly team meeting",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.type).toBe("meeting");
      expect(activityDetails.subject).toBe("Team Meeting");
    });

    it("should return details for task activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a task activity
      const createResult = await createActivity(
        context,
        {
          type: "task",
          subject: "Important Task",
          description: "Complete important task",
          priority: "urgent",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.type).toBe("task");
      expect(activityDetails.subject).toBe("Important Task");
    });

    it("should return details for note activity", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a note activity
      const createResult = await createActivity(
        context,
        {
          type: "note",
          subject: "Important Note",
          description: "Important note content",
          priority: "low",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.type).toBe("note");
      expect(activityDetails.subject).toBe("Important Note");
    });
  });

  describe("edge cases", () => {
    it("should handle activity with optional fields", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity with minimal fields
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Simple Call",
          priority: "medium",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.id).toBe(activity.id);
      expect(activityDetails.subject).toBe("Simple Call");
      expect(activityDetails.description).toBeUndefined();
      expect(activityDetails.customer).toBeUndefined();
      expect(activityDetails.contact).toBeUndefined();
      expect(activityDetails.deal).toBeUndefined();
      expect(activityDetails.lead).toBeUndefined();
    });

    it("should return complete activity details with all timestamps", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an activity
      const createResult = await createActivity(
        context,
        {
          type: "call",
          subject: "Detailed Call",
          description: "Call with all details",
          priority: "high",
          assignedUserId: user.id,
        },
        user.id,
      );
      expect(createResult.isOk()).toBe(true);
      const activity = createResult._unsafeUnwrap();

      // Get activity details
      const result = await getActivityDetails(context, {
        id: activity.id,
      });

      expect(result.isOk()).toBe(true);
      const activityDetails = result._unsafeUnwrap();
      expect(activityDetails.id).toBe(activity.id);
      expect(activityDetails.createdAt).toBeDefined();
      expect(activityDetails.updatedAt).toBeDefined();
      expect(activityDetails.createdAt).toBeInstanceOf(Date);
      expect(activityDetails.updatedAt).toBeInstanceOf(Date);
    });
  });
});
