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

let db: Database;
let context: Context;

describe("createApprovalRequest", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate approval request requirements", async () => {
      const userId = uuidv7();
      const invalidInputs = [
        {
          entityType: "deal",
          entityId: uuidv7(),
          title: "", // Empty title
          assignedTo: uuidv7(),
          priority: "medium",
        },
        {
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
          entityType: "invalid_type" as any, // Invalid entity type
          entityId: uuidv7(),
          title: "Valid Title",
          assignedTo: uuidv7(),
          priority: "medium",
        },
      ];

      for (const input of invalidInputs) {
        const result = await createApprovalRequest(
          context,
          userId,
          input as CreateApprovalInput,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });
  });

  describe("entity validation", () => {
    it("should reject creation if deal entity does not exist", async () => {
      const userId = uuidv7();
      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: uuidv7(),
        title: "Valid Title",
        assignedTo: uuidv7(),
        priority: "medium",
      };

      const result = await createApprovalRequest(context, userId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Deal not found");
    });
  });

  describe("approver validation", () => {
    it("should reject creation if approver does not exist", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const userId = uuidv7();
      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "Valid Title",
        assignedTo: uuidv7(),
        priority: "medium",
      };

      const result = await createApprovalRequest(context, userId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Approver not found");
    });

    it("should reject creation if approver is not active", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an inactive approver
      const approverResult = await context.userRepository.create({
        name: "Inactive Approver",
        email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "manager",
        isActive: false,
        passwordHash: "hash",
      });
      expect(approverResult.isOk()).toBe(true);
      const approver = approverResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "0",
        probability: 0,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const userId = uuidv7();
      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "Valid Title",
        assignedTo: approver.id,
        priority: "medium",
      };

      const result = await createApprovalRequest(context, userId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Approver is not active");
    });
  });

  describe("successful creation", () => {
    it("should create approval request for deal with minimal fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an active approver
      const approverResult = await context.userRepository.create({
        name: "Active Approver",
        email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "manager",
        isActive: true,
        passwordHash: "hash",
      });
      expect(approverResult.isOk()).toBe(true);
      const approver = approverResult._unsafeUnwrap();

      // Set up permissions for approver
      const permissionResult =
        await context.permissionRepository.createPermission({
          name: "approve_deals",
          description: "Can approve deals",
          resource: "deals",
          action: "approve",
        });
      expect(permissionResult.isOk()).toBe(true);
      const permission = permissionResult._unsafeUnwrap();

      // Create a role for approvers
      const roleResult = await context.permissionRepository.createRole({
        name: "approver_role",
        description: "Role for users who can approve deals",
      });
      expect(roleResult.isOk()).toBe(true);
      const role = roleResult._unsafeUnwrap();

      // Assign permission to role
      const assignPermissionResult =
        await context.permissionRepository.assignPermissionToRole({
          roleId: role.id,
          permissionId: permission.id,
        });
      expect(assignPermissionResult.isOk()).toBe(true);

      // Assign role to approver
      const assignRoleResult =
        await context.permissionRepository.assignRoleToUser({
          userId: approver.id,
          roleId: role.id,
          assignedBy: user.id,
        });
      expect(assignRoleResult.isOk()).toBe(true);

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "prospecting",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "Deal Approval Request",
        assignedTo: approver.id,
        priority: "medium",
      };

      const result = await createApprovalRequest(context, user.id, input);

      if (result.isErr()) {
        console.error("Error creating approval request:", result.error);
      }

      expect(result.isOk()).toBe(true);
      const approvalRequest = result._unsafeUnwrap();
      expect(approvalRequest.entityType).toBe("deal");
      expect(approvalRequest.entityId).toBe(deal.id);
      expect(approvalRequest.title).toBe("Deal Approval Request");
      expect(approvalRequest.assignedTo).toBe(approver.id);
      expect(approvalRequest.priority).toBe("medium");
      expect(approvalRequest.status).toBe("pending");
      expect(approvalRequest.requestedBy).toBe(user.id);
      expect(approvalRequest.id).toBeDefined();
      expect(approvalRequest.createdAt).toBeDefined();
    });

    it("should create approval request with high priority", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an active approver
      const approverResult = await context.userRepository.create({
        name: "Active Approver",
        email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "manager",
        isActive: true,
        passwordHash: "hash",
      });
      expect(approverResult.isOk()).toBe(true);
      const approver = approverResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "High Value Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "negotiation",
        amount: "100000.00",
        probability: 90,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "High Value Deal Approval",
        assignedTo: approver.id,
        priority: "high",
        description: "This is a high-value deal requiring urgent approval",
      };

      const result = await createApprovalRequest(context, user.id, input);

      expect(result.isOk()).toBe(true);
      const approvalRequest = result._unsafeUnwrap();
      expect(approvalRequest.priority).toBe("high");
      expect(approvalRequest.description).toBe(
        "This is a high-value deal requiring urgent approval",
      );
    });

    it("should create approval request with low priority", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an active approver
      const approverResult = await context.userRepository.create({
        name: "Active Approver",
        email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "manager",
        isActive: true,
        passwordHash: "hash",
      });
      expect(approverResult.isOk()).toBe(true);
      const approver = approverResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Small Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "qualification",
        amount: "5000.00",
        probability: 30,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "Small Deal Approval",
        assignedTo: approver.id,
        priority: "low",
      };

      const result = await createApprovalRequest(context, user.id, input);

      expect(result.isOk()).toBe(true);
      const approvalRequest = result._unsafeUnwrap();
      expect(approvalRequest.priority).toBe("low");
    });

    it("should create approval request with detailed description", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an active approver
      const approverResult = await context.userRepository.create({
        name: "Active Approver",
        email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "manager",
        isActive: true,
        passwordHash: "hash",
      });
      expect(approverResult.isOk()).toBe(true);
      const approver = approverResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Enterprise Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "proposal",
        amount: "50000.00",
        probability: 75,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const detailedDescription = `
        This approval request is for an enterprise deal with the following details:
        - Customer: ${customer.name}
        - Deal value: $50,000
        - Stage: Proposal
        - Probability: 75%
        - Requires manager approval due to deal size
        - Timeline: 30 days to close
      `;

      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "Enterprise Deal Approval",
        assignedTo: approver.id,
        priority: "medium",
        description: detailedDescription,
      };

      const result = await createApprovalRequest(context, user.id, input);

      expect(result.isOk()).toBe(true);
      const approvalRequest = result._unsafeUnwrap();
      expect(approvalRequest.description).toBe(detailedDescription);
    });
  });

  describe("edge cases", () => {
    it("should handle approval request creation with different deal stages", async () => {
      const dealStages = [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
      ] as const;

      for (const stage of dealStages) {
        // Create a customer first
        const customerResult = await context.customerRepository.create({
          name: `Test Company ${stage}`,
          status: "active",
        });
        expect(customerResult.isOk()).toBe(true);
        const customer = customerResult._unsafeUnwrap();

        // Create a user for the deal
        const userResult = await context.userRepository.create({
          name: `Test User ${stage}`,
          email: `test-${stage}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        // Create an active approver
        const approverResult = await context.userRepository.create({
          name: `Active Approver ${stage}`,
          email: `approver-${stage}@example.com`,
          role: "manager",
          isActive: true,
          passwordHash: "hash",
        });
        expect(approverResult.isOk()).toBe(true);
        const approver = approverResult._unsafeUnwrap();

        // Create a deal
        const dealResult = await context.dealRepository.create({
          title: `${stage} Deal`,
          customerId: customer.id,
          assignedUserId: user.id,
          stage: stage,
          amount: "25000.00",
          probability: 50,
          competitors: [],
        });
        expect(dealResult.isOk()).toBe(true);
        const deal = dealResult._unsafeUnwrap();

        const input: CreateApprovalInput = {
          entityType: "deal",
          entityId: deal.id,
          title: `${stage} Deal Approval`,
          assignedTo: approver.id,
          priority: "medium",
        };

        const result = await createApprovalRequest(context, user.id, input);

        expect(result.isOk()).toBe(true);
        const approvalRequest = result._unsafeUnwrap();
        expect(approvalRequest.entityId).toBe(deal.id);
        expect(approvalRequest.title).toBe(`${stage} Deal Approval`);
      }
    });

    it("should handle approval request creation with different user roles", async () => {
      const userRoles = ["user", "manager", "admin"] as const;

      for (const role of userRoles) {
        // Create a customer first
        const customerResult = await context.customerRepository.create({
          name: `Test Company ${role}`,
          status: "active",
        });
        expect(customerResult.isOk()).toBe(true);
        const customer = customerResult._unsafeUnwrap();

        // Create a user for the deal
        const userResult = await context.userRepository.create({
          name: `Test User ${role}`,
          email: `test-${role}@example.com`,
          role: role,
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        // Create an active approver
        const approverResult = await context.userRepository.create({
          name: `Active Approver ${role}`,
          email: `approver-${role}@example.com`,
          role: "manager",
          isActive: true,
          passwordHash: "hash",
        });
        expect(approverResult.isOk()).toBe(true);
        const approver = approverResult._unsafeUnwrap();

        // Create a deal
        const dealResult = await context.dealRepository.create({
          title: `${role} Deal`,
          customerId: customer.id,
          assignedUserId: user.id,
          stage: "qualification",
          amount: "15000.00",
          probability: 40,
          competitors: [],
        });
        expect(dealResult.isOk()).toBe(true);
        const deal = dealResult._unsafeUnwrap();

        const input: CreateApprovalInput = {
          entityType: "deal",
          entityId: deal.id,
          title: `${role} Deal Approval`,
          assignedTo: approver.id,
          priority: "medium",
        };

        const result = await createApprovalRequest(context, user.id, input);

        expect(result.isOk()).toBe(true);
        const approvalRequest = result._unsafeUnwrap();
        expect(approvalRequest.requestedBy).toBe(user.id);
        expect(approvalRequest.title).toBe(`${role} Deal Approval`);
      }
    });

    it("should handle approval request creation with maximum title length", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an active approver
      const approverResult = await context.userRepository.create({
        name: "Active Approver",
        email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "manager",
        isActive: true,
        passwordHash: "hash",
      });
      expect(approverResult.isOk()).toBe(true);
      const approver = approverResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "qualification",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const longTitle = "A".repeat(255); // Maximum allowed title length

      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: longTitle,
        assignedTo: approver.id,
        priority: "medium",
      };

      const result = await createApprovalRequest(context, user.id, input);

      expect(result.isOk()).toBe(true);
      const approvalRequest = result._unsafeUnwrap();
      expect(approvalRequest.title).toBe(longTitle);
    });

    it("should handle approval request creation with maximum description length", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for the deal
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create an active approver
      const approverResult = await context.userRepository.create({
        name: "Active Approver",
        email: `approver-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`,
        role: "manager",
        isActive: true,
        passwordHash: "hash",
      });
      expect(approverResult.isOk()).toBe(true);
      const approver = approverResult._unsafeUnwrap();

      // Create a deal
      const dealResult = await context.dealRepository.create({
        title: "Test Deal",
        customerId: customer.id,
        assignedUserId: user.id,
        stage: "qualification",
        amount: "10000.00",
        probability: 50,
        competitors: [],
      });
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      const longDescription = "B".repeat(1000); // Maximum allowed description length

      const input: CreateApprovalInput = {
        entityType: "deal",
        entityId: deal.id,
        title: "Test Approval",
        assignedTo: approver.id,
        priority: "medium",
        description: longDescription,
      };

      const result = await createApprovalRequest(context, user.id, input);

      expect(result.isOk()).toBe(true);
      const approvalRequest = result._unsafeUnwrap();
      expect(approvalRequest.description).toBe(longDescription);
    });
  });
});
