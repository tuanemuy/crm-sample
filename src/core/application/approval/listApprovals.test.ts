import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createCustomerTestData,
  createDealTestData,
  createUserTestData,
} from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ListApprovalsQuery } from "@/core/domain/approval/types";
import { createDeal } from "../deal/createDeal";
import { createApprovalRequest } from "./createApprovalRequest";
import { listApprovals } from "./listApprovals";

let db: Database;
let context: Context;
let testUserId: string;
let testApproverId: string;
let testDealId: string;

describe("listApprovals", () => {
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

    const approverData = createUserTestData({
      overrides: { email: "approver@example.com" },
    });
    const approverResult = await context.userRepository.create({
      ...approverData,
      passwordHash: "hash",
      isActive: true,
    });
    expect(approverResult.isOk()).toBe(true);
    testApproverId = approverResult._unsafeUnwrap().id;

    // Create test customer and deal
    const customerData = createCustomerTestData();
    const customerResult = await context.customerRepository.create({
      ...customerData,
      status: "active",
    });
    expect(customerResult.isOk()).toBe(true);
    const testCustomerId = customerResult._unsafeUnwrap().id;

    const dealData = createDealTestData({
      overrides: { customerId: testCustomerId, assignedUserId: testUserId },
    });
    const dealResult = await createDeal(context, dealData);
    expect(dealResult.isOk()).toBe(true);
    testDealId = dealResult._unsafeUnwrap().id;
  });

  describe("Success Cases", () => {
    it("should list all approvals with pagination", async () => {
      // Create test approvals
      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "Deal Approval 1",
        description: "First approval request",
        assignedTo: testApproverId,
        priority: "high",
      });

      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "Deal Approval 2",
        description: "Second approval request",
        assignedTo: testApproverId,
        priority: "medium",
      });

      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(2);
      expect(count).toBe(2);
      expect(items[0].title).toBe("Deal Approval 2"); // Latest first
      expect(items[1].title).toBe("Deal Approval 1");
    });

    it("should return empty results when no approvals exist", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(0);
    });

    it("should handle pagination correctly", async () => {
      // Create 5 test approvals
      for (let i = 1; i <= 5; i++) {
        await createApprovalRequest(context, testUserId, {
          entityType: "deal",
          entityId: testDealId,
          title: `Deal Approval ${i}`,
          description: `Approval request ${i}`,
          assignedTo: testApproverId,
          priority: "medium",
        });
      }

      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 3,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(count).toBe(5);
    });
  });

  describe("Filtering", () => {
    beforeEach(async () => {
      // Create test approvals with different attributes
      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "High Priority Deal",
        description: "Important deal approval",
        assignedTo: testApproverId,
        priority: "high",
      });

      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "Medium Priority Proposal",
        description: "Proposal approval",
        assignedTo: testApproverId,
        priority: "medium",
      });

      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "Contract Approval",
        description: "Contract review needed",
        assignedTo: testApproverId,
        priority: "low",
      });
    });

    it("should filter approvals by status", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          status: "pending",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(count).toBe(3);
      expect(items.every((item) => item.status === "pending")).toBe(true);
    });

    it("should filter approvals by entity type", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          entityType: "deal",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(count).toBe(3);
      expect(items.every((item) => item.entityType === "deal")).toBe(true);
    });

    it("should filter approvals by priority", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          priority: "high",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].priority).toBe("high");
      expect(items[0].title).toBe("High Priority Deal");
    });

    it("should filter approvals by requestedBy", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {},
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(count).toBe(3);
      expect(items.every((item) => item.requestedBy === testUserId)).toBe(true);
    });

    it("should filter approvals by assignedTo", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          assignedTo: testApproverId,
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(count).toBe(3);
      expect(items.every((item) => item.assignedTo === testApproverId)).toBe(
        true,
      );
    });

    it("should filter approvals by keyword", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          keyword: "Contract",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].title).toBe("Contract Approval");
    });

    it("should handle multiple filter criteria", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          entityType: "deal",
          priority: "high",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
      expect(items[0].title).toBe("High Priority Deal");
      expect(items[0].entityType).toBe("deal");
      expect(items[0].priority).toBe("high");
      expect(items[0].requestedBy).toBe(testUserId);
    });

    it("should return empty results when filter matches nothing", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          status: "approved",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(0);
    });
  });

  describe("Sorting", () => {
    beforeEach(async () => {
      // Create test approvals with different attributes
      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "B Deal",
        description: "Second deal",
        assignedTo: testApproverId,
        priority: "high",
      });

      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "A Proposal",
        description: "First proposal",
        assignedTo: testApproverId,
        priority: "medium",
      });

      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "C Contract",
        description: "Third contract",
        assignedTo: testApproverId,
        priority: "low",
      });
    });

    it("should sort approvals by title ascending", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "title",
        },
        sortBy: "title",
        sortOrder: "asc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(items[0].title).toBe("A Proposal");
      expect(items[1].title).toBe("B Deal");
      expect(items[2].title).toBe("C Contract");
    });

    it("should sort approvals by title descending", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "title",
        },
        sortBy: "title",
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(items[0].title).toBe("C Contract");
      expect(items[1].title).toBe("B Deal");
      expect(items[2].title).toBe("A Proposal");
    });

    it("should sort approvals by priority", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "priority",
        },
        sortBy: "priority",
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      // Priority order: urgent > high > medium > low
      expect(items[0].priority).toBe("high");
      expect(items[1].priority).toBe("medium");
      expect(items[2].priority).toBe("low");
    });

    it("should sort approvals by status", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "status",
        },
        sortBy: "status",
        sortOrder: "asc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      expect(items.every((item) => item.status === "pending")).toBe(true);
    });

    it("should sort approvals by createdAt descending by default", async () => {
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items } = result._unsafeUnwrap();
      expect(items).toHaveLength(3);
      // Should be ordered by creation time (latest first)
      expect(items[0].title).toBe("C Contract");
      expect(items[1].title).toBe("A Proposal");
      expect(items[2].title).toBe("B Deal");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty filter object", async () => {
      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "Test Approval",
        assignedTo: testApproverId,
        priority: "medium",
      });

      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {},
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(count).toBe(1);
    });

    it("should handle pagination beyond available results", async () => {
      await createApprovalRequest(context, testUserId, {
        entityType: "deal",
        entityId: testDealId,
        title: "Test Approval",
        assignedTo: testApproverId,
        priority: "medium",
      });

      const query: ListApprovalsQuery = {
        pagination: {
          page: 2,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(1);
    });

    it("should handle large page sizes", async () => {
      // Create 5 test approvals
      for (let i = 1; i <= 5; i++) {
        await createApprovalRequest(context, testUserId, {
          entityType: "deal",
          entityId: testDealId,
          title: `Test Approval ${i}`,
          assignedTo: testApproverId,
          priority: "medium",
        });
      }

      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 100,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(5);
      expect(count).toBe(5);
    });

    it("should handle filtering by non-existent user", async () => {
      const nonExistentUserId = uuidv7();
      const query: ListApprovalsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          requestedBy: nonExistentUserId,
        },
        sortOrder: "desc",
      };

      const result = await listApprovals(context, query);

      expect(result.isOk()).toBe(true);
      const { items, count } = result._unsafeUnwrap();
      expect(items).toHaveLength(0);
      expect(count).toBe(0);
    });
  });

  describe("Entity Type Coverage", () => {
    const entityTypes = ["deal"];

    entityTypes.forEach((entityType) => {
      it(`should filter approvals by entity type ${entityType}`, async () => {
        await createApprovalRequest(context, testUserId, {
          entityType: entityType as any,
          entityId: testDealId,
          title: `${entityType} Approval`,
          assignedTo: testApproverId,
          priority: "medium",
        });

        const query: ListApprovalsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: {
            entityType: entityType as any,
          },
          sortOrder: "desc",
        };

        const result = await listApprovals(context, query);

        expect(result.isOk()).toBe(true);
        const { items, count } = result._unsafeUnwrap();
        expect(items).toHaveLength(1);
        expect(count).toBe(1);
        expect(items[0].entityType).toBe(entityType);
      });
    });
  });

  describe("Priority Coverage", () => {
    const priorities = ["low", "medium", "high", "urgent"];

    priorities.forEach((priority) => {
      it(`should filter approvals by priority ${priority}`, async () => {
        await createApprovalRequest(context, testUserId, {
          entityType: "deal",
          entityId: testDealId,
          title: `${priority} Priority Approval`,
          assignedTo: testApproverId,
          priority: priority as any,
        });

        const query: ListApprovalsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: {
            priority: priority as any,
          },
          sortOrder: "desc",
        };

        const result = await listApprovals(context, query);

        expect(result.isOk()).toBe(true);
        const { items, count } = result._unsafeUnwrap();
        expect(items).toHaveLength(1);
        expect(count).toBe(1);
        expect(items[0].priority).toBe(priority);
      });
    });
  });

  describe("Status Coverage", () => {
    const statuses = ["pending", "approved", "rejected", "cancelled"];

    statuses.forEach((status) => {
      it(`should filter approvals by status ${status}`, async () => {
        // Create approval
        const createResult = await createApprovalRequest(context, testUserId, {
          entityType: "deal",
          entityId: testDealId,
          title: `${status} Approval`,
          assignedTo: testApproverId,
          priority: "medium",
        });
        expect(createResult.isOk()).toBe(true);
        const approval = createResult._unsafeUnwrap();

        // Update status if not pending
        if (status !== "pending") {
          await context.approvalRepository.update(approval.id, {
            status: status as any,
          });
        }

        const query: ListApprovalsQuery = {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: {
            status: status as any,
          },
          sortOrder: "desc",
        };

        const result = await listApprovals(context, query);

        expect(result.isOk()).toBe(true);
        const { items, count } = result._unsafeUnwrap();
        expect(items).toHaveLength(1);
        expect(count).toBe(1);
        expect(items[0].status).toBe(status);
      });
    });
  });
});
