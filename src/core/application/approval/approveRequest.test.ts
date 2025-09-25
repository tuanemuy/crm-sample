import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type {
  ApproveApprovalInput,
  CreateApprovalInput,
} from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";
import { approveRequest } from "./approveRequest";
import { createApprovalRequest } from "./createApprovalRequest";

let db: Database;
let context: Context;

async function setupApprovalTestData(ctx: Context) {
  // Create a customer
  const customerResult = await ctx.customerRepository.create({
    name: "Test Company",
    status: "active",
  });
  if (customerResult.isErr()) {
    throw new Error(
      `Failed to create customer: ${customerResult.error.message}`,
    );
  }
  const customer = customerResult.value;

  // Create users
  const requesterResult = await ctx.userRepository.create({
    name: "Requester",
    email: `requester-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
    role: "user",
    isActive: true,
    passwordHash: "hash",
  });
  if (requesterResult.isErr()) {
    throw new Error(
      `Failed to create requester: ${requesterResult.error.message}`,
    );
  }
  const requester = requesterResult.value;

  const approverResult = await ctx.userRepository.create({
    name: "Approver",
    email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
    role: "manager",
    isActive: true,
    passwordHash: "hash",
  });
  if (approverResult.isErr()) {
    throw new Error(
      `Failed to create approver: ${approverResult.error.message}`,
    );
  }
  const approver = approverResult.value;

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
  if (dealResult.isErr()) {
    throw new Error(`Failed to create deal: ${dealResult.error.message}`);
  }
  const deal = dealResult.value;

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
  if (approvalResult.isErr()) {
    throw new Error(
      `Failed to create approval request: ${approvalResult.error.message}`,
    );
  }
  const approval = approvalResult.value;

  return { customer, requester, approver, deal, approval };
}

describe("approveRequest", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("authorization validation", () => {
    it("should reject if approval request does not exist", async () => {
      const userId = uuidv7();
      const approvalId = uuidv7();
      const input: ApproveApprovalInput = {
        comments: "Approved",
      };

      const result = await approveRequest(context, userId, approvalId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Approval request not found",
      );
    });

    it("should reject if user is not authorized to approve", async () => {
      const { approval } = await setupApprovalTestData(context);
      const unauthorizedUserId = uuidv7();
      const input: ApproveApprovalInput = {
        comments: "Trying to approve",
      };

      const result = await approveRequest(
        context,
        unauthorizedUserId,
        approval.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "User is not authorized to approve this request",
      );
    });
  });

  describe("status validation", () => {
    it("should reject if approval is not in pending status", async () => {
      const { approval, approver } = await setupApprovalTestData(context);

      // First approve the request
      const firstApproval = await approveRequest(
        context,
        approver.id,
        approval.id,
        { comments: "First approval" },
      );
      expect(firstApproval.isOk()).toBe(true);

      // Try to approve again
      const result = await approveRequest(context, approver.id, approval.id, {
        comments: "Second approval",
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Approval request is not in pending status",
      );
    });
  });

  describe("successful approval", () => {
    it("should approve request with minimal input", async () => {
      const { approval, approver } = await setupApprovalTestData(context);
      const input: ApproveApprovalInput = {};

      const result = await approveRequest(
        context,
        approver.id,
        approval.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      const approved = result._unsafeUnwrap();
      expect(approved.status).toBe("approved");
      expect(approved.assignedTo).toBe(approver.id);
      expect(approved.approvedAt).toBeDefined();
    });

    it("should approve request with comments", async () => {
      const { approval, approver } = await setupApprovalTestData(context);
      const input: ApproveApprovalInput = {
        comments: "Looks good, approved!",
      };

      const result = await approveRequest(
        context,
        approver.id,
        approval.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      const approved = result._unsafeUnwrap();
      expect(approved.status).toBe("approved");
      expect(approved.assignedTo).toBe(approver.id);
      expect(approved.approverComments).toBe("Looks good, approved!");
    });

    it("should send notification to requester after approval", async () => {
      const { approval, approver, requester } =
        await setupApprovalTestData(context);
      const input: ApproveApprovalInput = {
        comments: "Approved with notification",
      };

      const result = await approveRequest(
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
      expect(notification?.type).toBe("success");
      expect(notification?.title).toContain("Approved");
    });
  });

  describe("edge cases", () => {
    it(
      "should handle approval with different priorities",
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

          const result = await approveRequest(
            newContext,
            testData.approver.id,
            testData.approval.id,
            { comments: `Approved ${priority} priority request` },
          );

          expect(result.isOk()).toBe(true);
          const approved = result._unsafeUnwrap();
          expect(approved.priority).toBe(priority);
        }
      },
    );

    it("should handle approval with long comments", async () => {
      const { approval, approver } = await setupApprovalTestData(context);
      const longComment = "A".repeat(1000);
      const input: ApproveApprovalInput = {
        comments: longComment,
      };

      const result = await approveRequest(
        context,
        approver.id,
        approval.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      const approved = result._unsafeUnwrap();
      expect(approved.approverComments).toBe(longComment);
    });
  });
});
