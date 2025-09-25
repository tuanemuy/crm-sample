import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { CreateApprovalInput } from "@/core/domain/approval/types";
import { ApplicationError } from "@/lib/error";
import { createApprovalRequest } from "./createApprovalRequest";
import { getApprovalDetails } from "./getApprovalDetails";

let db: Database;
let context: Context;

async function setupApprovalTestData(ctx: Context) {
  // Create a customer
  const customerResult = await ctx.customerRepository.create({
    name: "Test Company",
    status: "active",
    industry: "Technology",
    revenue: 1000000,
  });
  const customer = customerResult._unsafeUnwrap();

  // Create users
  const requesterResult = await ctx.userRepository.create({
    name: "Requester User",
    email: `requester-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
    role: "user",
    isActive: true,
    passwordHash: "hash",
  });
  const requester = requesterResult._unsafeUnwrap();

  const approverResult = await ctx.userRepository.create({
    name: "Approver Manager",
    email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
    role: "manager",
    isActive: true,
    passwordHash: "hash",
  });
  const approver = approverResult._unsafeUnwrap();

  // Create a deal
  const dealResult = await ctx.dealRepository.create({
    title: "Enterprise Deal",
    customerId: customer.id,
    assignedUserId: requester.id,
    stage: "proposal",
    amount: "500000",
    probability: 75,
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    description: "Large enterprise software deal",
    competitors: [],
  });
  const deal = dealResult._unsafeUnwrap();

  // Create an approval request
  const approvalInput: CreateApprovalInput = {
    entityType: "deal",
    entityId: deal.id,
    title: "Deal Approval Request",
    description: "Need approval for enterprise deal",
    assignedTo: approver.id,
    priority: "high",
  };

  const approvalResult = await createApprovalRequest(
    ctx,
    requester.id,
    approvalInput,
  );
  const approval = approvalResult._unsafeUnwrap();

  return { customer, requester, approver, deal, approval };
}

describe("getApprovalDetails", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject empty approvalId", async () => {
      const result = await getApprovalDetails(context, "");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject undefined approvalId", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getApprovalDetails(context, undefined as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject null approvalId", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getApprovalDetails(context, null as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("business logic validation", () => {
    it("should return error for non-existent approval", async () => {
      const nonExistentId = uuidv7();
      const result = await getApprovalDetails(context, nonExistentId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message.toLowerCase()).toContain(
        "approval",
      );
    });
  });

  describe("successful retrieval", () => {
    it("should return approval details for existing approval", async () => {
      const { approval } = await setupApprovalTestData(context);

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();
      expect(details.id).toBe(approval.id);
      expect(details.title).toBe(approval.title);
      expect(details.status).toBe("pending");
    });

    it("should return approval with requester information", async () => {
      const { approval, requester } = await setupApprovalTestData(context);

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();
      expect(details.requestedByUser).toBeDefined();
      expect(details.requestedByUser?.id).toBe(requester.id);
      expect(details.requestedByUser?.name).toBe("Requester User");
    });

    it("should return approval with approver information", async () => {
      const { approval, approver } = await setupApprovalTestData(context);

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();
      expect(details.assignedToUser).toBeDefined();
      expect(details.assignedToUser?.id).toBe(approver.id);
      expect(details.assignedToUser?.name).toBe("Approver Manager");
    });

    it("should return approval with deal entity information", async () => {
      const { approval, deal } = await setupApprovalTestData(context);

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();
      expect(details.entityType).toBe("deal");
      expect(details.entityId).toBe(deal.id);
      // Entity details would be populated if the repository implementation includes them
    });
  });

  describe("data structure validation", () => {
    it("should return approval with proper structure", async () => {
      const { approval } = await setupApprovalTestData(context);

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();

      // Check required fields
      expect(details).toHaveProperty("id");
      expect(details).toHaveProperty("title");
      expect(details).toHaveProperty("status");
      expect(details).toHaveProperty("entityType");
      expect(details).toHaveProperty("entityId");
      expect(details).toHaveProperty("requestedBy");
      expect(details).toHaveProperty("assignedTo");
      expect(details).toHaveProperty("priority");
      expect(details).toHaveProperty("createdAt");
      expect(details).toHaveProperty("updatedAt");

      // Check optional relation fields
      expect(details).toHaveProperty("requestedByUser");
      expect(details).toHaveProperty("assignedToUser");
    });

    it("should handle approvals with all optional fields", async () => {
      const { approval } = await setupApprovalTestData(context);

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();
      expect(details.description).toBe("Need approval for enterprise deal");
    });
  });

  describe("edge cases", () => {
    it("should handle approval with minimal required fields", async () => {
      const customerResult = await context.customerRepository.create({
        name: "Minimal Company",
        status: "active",
      });
      const customer = customerResult._unsafeUnwrap();

      const userResult = await context.userRepository.create({
        name: "User",
        email: `user-${Date.now()}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      const user = userResult._unsafeUnwrap();

      const dealResult = await context.dealRepository.create({
        title: "Minimal Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "1000",
        probability: 10,
        expectedCloseDate: new Date(),
        competitors: [],
      });
      const deal = dealResult._unsafeUnwrap();

      const approvalInput: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "Minimal Approval",
        assignedTo: user.id,
        priority: "low",
      };

      const approvalResult = await createApprovalRequest(
        context,
        user.id,
        approvalInput,
      );
      const approval = approvalResult._unsafeUnwrap();

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();
      expect(details.id).toBe(approval.id);
      expect(details.description).toBeNull();
    });

    it(
      "should handle various approval statuses",
      { timeout: 10000 },
      async () => {
        const statuses = [
          "pending",
          "approved",
          "rejected",
          "cancelled",
        ] as const;

        for (const status of statuses) {
          const newDb = await setupTestDatabase();
          const newContext = createTestContext(newDb);
          const testData = await setupApprovalTestData(newContext);

          // Update approval status
          const updateResult = await newContext.approvalRepository.update(
            testData.approval.id,
            { status },
          );
          expect(updateResult.isOk()).toBe(true);

          const result = await getApprovalDetails(
            newContext,
            testData.approval.id,
          );

          expect(result.isOk()).toBe(true);
          const details = result._unsafeUnwrap();
          expect(details.status).toBe(status);
        }
      },
    );

    it(
      "should handle various priority levels",
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

          const result = await getApprovalDetails(
            newContext,
            testData.approval.id,
          );

          expect(result.isOk()).toBe(true);
          const details = result._unsafeUnwrap();
          expect(details.priority).toBe(priority);
        }
      },
    );

    it("should handle approval with completed workflow", async () => {
      const { approval, approver } = await setupApprovalTestData(context);

      // Approve the request
      const approveResult = await context.approvalRepository.approve(
        approval.id,
        approver.id,
        { comments: "Approved for processing" },
      );
      expect(approveResult.isOk()).toBe(true);

      const result = await getApprovalDetails(context, approval.id);

      expect(result.isOk()).toBe(true);
      const details = result._unsafeUnwrap();
      expect(details.status).toBe("approved");
      expect(details.assignedTo).toBe(approver.id);
      expect(details.approvedAt).toBeDefined();
      expect(details.approverComments).toBe("Approved for processing");
    });
  });
});
