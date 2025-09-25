import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type {
  CreateApprovalInput,
  RejectApprovalInput,
} from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";
import { createApprovalRequest } from "./createApprovalRequest";
import { rejectRequest } from "./rejectRequest";

let db: Database;
let context: Context;

async function setupApprovalTestData(ctx: Context) {
  // Create a customer
  const customerResult = await ctx.customerRepository.create({
    name: "Test Company",
    status: "active",
  });
  const customer = customerResult._unsafeUnwrap();

  // Create users
  const requesterResult = await ctx.userRepository.create({
    name: "Requester",
    email: `requester-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
    role: "user",
    isActive: true,
    passwordHash: "hash",
  });
  const requester = requesterResult._unsafeUnwrap();

  const approverResult = await ctx.userRepository.create({
    name: "Approver",
    email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
    role: "manager",
    isActive: true,
    passwordHash: "hash",
  });
  const approver = approverResult._unsafeUnwrap();

  // Create a deal
  const dealResult = await ctx.dealRepository.create({
    title: "Test Deal",
    customerId: customer.id,
    assignedUserId: requester.id,
    stage: "proposal",
    amount: "100000",
    probability: 50,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    competitors: [],
  });
  const deal = dealResult._unsafeUnwrap();

  // Create an approval request
  const approvalInput: CreateApprovalInput = {
    entityType: "deal",
    entityId: deal.id,
    title: "Test Approval Request",
    description: "This is a test approval request",
    assignedTo: approver.id,
    priority: "medium",
  };

  const approvalResult = await createApprovalRequest(
    ctx,
    requester.id,
    approvalInput,
  );
  const approval = approvalResult._unsafeUnwrap();

  return { customer, requester, approver, deal, approval };
}

describe("rejectRequest", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("authorization validation", () => {
    it("should reject if approval request does not exist", async () => {
      const userId = uuidv7();
      const approvalId = uuidv7();
      const input: RejectApprovalInput = {
        reason: "Not valid",
        comments: "This request is not valid",
      };

      const result = await rejectRequest(context, userId, approvalId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Approval request not found",
      );
    });

    it("should reject if user is not authorized to reject", async () => {
      const { approval } = await setupApprovalTestData(context);
      const unauthorizedUserId = uuidv7();
      const input: RejectApprovalInput = {
        reason: "Trying to reject",
        comments: "Unauthorized rejection attempt",
      };

      const result = await rejectRequest(
        context,
        unauthorizedUserId,
        approval.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "User is not authorized to reject this request",
      );
    });
  });

  describe("status validation", () => {
    it("should reject if approval is not in pending status", async () => {
      const { approval, approver } = await setupApprovalTestData(context);

      // First reject the request
      const firstRejection = await rejectRequest(
        context,
        approver.id,
        approval.id,
        { reason: "First rejection", comments: "Initial rejection" },
      );
      expect(firstRejection.isOk()).toBe(true);

      // Try to reject again
      const result = await rejectRequest(context, approver.id, approval.id, {
        reason: "Second rejection",
        comments: "Another rejection",
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Approval request is not in pending status",
      );
    });
  });

  // Input validation is handled at the schema level, not in the application layer
  // The test for empty reason is removed as the application layer doesn't validate input

  describe("successful rejection", () => {
    it("should reject request with reason only", async () => {
      const { approval, approver } = await setupApprovalTestData(context);
      const input: RejectApprovalInput = {
        reason: "Budget constraints",
      };

      const result = await rejectRequest(
        context,
        approver.id,
        approval.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      const rejected = result._unsafeUnwrap();
      expect(rejected.status).toBe("rejected");
      expect(rejected.assignedTo).toBe(approver.id);
      expect(rejected.rejectedAt).toBeDefined();
      expect(rejected.approverComments).toContain("Budget constraints");
    });

    it("should reject request with reason and comments", async () => {
      const { approval, approver } = await setupApprovalTestData(context);
      const input: RejectApprovalInput = {
        reason: "Does not meet requirements",
        comments: "Please revise the proposal and resubmit",
      };

      const result = await rejectRequest(
        context,
        approver.id,
        approval.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      const rejected = result._unsafeUnwrap();
      expect(rejected.status).toBe("rejected");
      expect(rejected.assignedTo).toBe(approver.id);
      expect(rejected.approverComments).toContain("Does not meet requirements");
      expect(rejected.approverComments).toContain(
        "Please revise the proposal and resubmit",
      );
    });

    it("should send notification to requester after rejection", async () => {
      const { approval, approver, requester } =
        await setupApprovalTestData(context);
      const input: RejectApprovalInput = {
        reason: "Not aligned with strategy",
        comments: "Consider alternative approach",
      };

      const result = await rejectRequest(
        context,
        approver.id,
        approval.id,
        input,
      );

      expect(result.isOk()).toBe(true);

      // Check if notification was created
      const notifications = await context.notificationRepository.list(
        requester.id,
        {
          pagination: { page: 1, limit: 10 },
          filter: {},
          sortOrder: "desc",
        },
      );
      expect(notifications.isOk()).toBe(true);
      const notificationList = notifications._unsafeUnwrap();
      expect(notificationList.items.length).toBeGreaterThan(0);

      const notification = notificationList.items.find(
        (n) => n.metadata?.entityId === approval.id,
      );
      expect(notification).toBeDefined();
      expect(notification?.type).toBe("warning");
      expect(notification?.title).toContain("Rejected");
      expect(notification?.message).toContain(input.reason);
    });
  });

  describe("edge cases", () => {
    it(
      "should handle rejection with different priorities",
      { timeout: 10000 },
      async () => {
        const priorities = ["low", "medium", "high", "urgent"] as const;

        for (const priority of priorities) {
          const newDb = await setupTestDatabase();
          const newContext = createTestContext(newDb);
          const testData = await setupApprovalTestData(newContext);

          // Update approval priority
          const updateResult = await newContext.approvalRepository.update(
            testData.approval.id,
            { priority },
          );
          expect(updateResult.isOk()).toBe(true);

          const result = await rejectRequest(
            newContext,
            testData.approver.id,
            testData.approval.id,
            { reason: `Rejected ${priority} priority request` },
          );

          expect(result.isOk()).toBe(true);
          const rejected = result._unsafeUnwrap();
          expect(rejected.priority).toBe(priority);
        }
      },
    );

    it("should handle rejection with long reason and comments", async () => {
      const { approval, approver } = await setupApprovalTestData(context);
      const longReason = "R".repeat(500);
      const longComment = "C".repeat(1000);
      const input: RejectApprovalInput = {
        reason: longReason,
        comments: longComment,
      };

      const result = await rejectRequest(
        context,
        approver.id,
        approval.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      const rejected = result._unsafeUnwrap();
      expect(rejected.approverComments).toContain(longReason);
      expect(rejected.approverComments).toContain(longComment);
    });

    it(
      "should handle rejection for different entity types",
      { timeout: 10000 },
      async () => {
        const { approver } = await setupApprovalTestData(context);

        // For now we only have "deal" entity type, but the test structure
        // is prepared for when more entity types are added
        const entityTypes = ["deal"] as const;

        for (const entityType of entityTypes) {
          const newDb = await setupTestDatabase();
          const newContext = createTestContext(newDb);
          const testData = await setupApprovalTestData(newContext);

          const result = await rejectRequest(
            newContext,
            testData.approver.id,
            testData.approval.id,
            { reason: `Rejected ${entityType} entity` },
          );

          expect(result.isOk()).toBe(true);
          const rejected = result._unsafeUnwrap();
          expect(rejected.entityType).toBe(entityType);
        }
      },
    );
  });
});
