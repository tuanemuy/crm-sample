import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { listCampaignsQuerySchema } from "@/core/domain/campaign/types";
import { ApplicationError } from "@/lib/error";
import { type ListCampaignsInput, listCampaigns } from "./listCampaigns";

let db: Database;
let context: Context;

describe("listCampaigns", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate pagination parameters", async () => {
      const invalidInputs = [
        {
          pagination: {
            page: 0, // Invalid page (must be >= 1)
            limit: 10,
            order: "desc",
            orderBy: "name",
          },
        },
        {
          pagination: {
            page: 1,
            limit: 0, // Invalid limit (must be >= 1)
            order: "desc",
            orderBy: "name",
          },
        },
        {
          pagination: {
            page: -1, // Negative page
            limit: 10,
            order: "desc",
            orderBy: "name",
          },
        },
        {
          pagination: {
            page: 1,
            limit: -5, // Negative limit
            order: "desc",
            orderBy: "name",
          },
        },
        {
          pagination: {
            page: 1,
            limit: 1001, // Exceeds maximum limit
            order: "desc",
            orderBy: "name",
          },
        },
      ];

      for (const input of invalidInputs) {
        const validation = listCampaignsQuerySchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should validate filter parameters", async () => {
      const invalidInputs = [
        {
          pagination: { page: 1, limit: 10, order: "desc", orderBy: "name" },
          filter: {
            type: "invalid-type", // Invalid campaign type
          },
        },
        {
          pagination: { page: 1, limit: 10, order: "desc", orderBy: "name" },
          filter: {
            status: "invalid-status", // Invalid campaign status
          },
        },
        {
          pagination: { page: 1, limit: 10, order: "desc", orderBy: "name" },
          filter: {
            createdBy: "invalid-uuid", // Invalid user UUID
          },
        },
      ];

      for (const input of invalidInputs) {
        const validation = listCampaignsQuerySchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should validate sort parameters", async () => {
      const invalidInputs = [
        {
          pagination: { page: 1, limit: 10, order: "desc", orderBy: "name" },
          sort: {
            field: "invalid-field", // Invalid sort field
            order: "asc",
          },
        },
        {
          pagination: { page: 1, limit: 10, order: "desc", orderBy: "name" },
          sort: {
            field: "name",
            order: "invalid-order", // Invalid sort order
          },
        },
      ];

      for (const input of invalidInputs) {
        const validation = listCampaignsQuerySchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should accept valid input parameters", async () => {
      const validInputs = [
        {
          pagination: {
            page: 1,
            limit: 10,
            order: "desc",
            orderBy: "createdAt",
          },
        },
        {
          pagination: { page: 5, limit: 50, order: "asc", orderBy: "name" },
          filter: {
            keyword: "test",
            type: "email",
            status: "active",
            createdBy: uuidv7(),
          },
          sort: {
            field: "name",
            order: "asc",
          },
        },
        {
          pagination: {
            page: 1,
            limit: 1000,
            order: "desc",
            orderBy: "createdAt",
          }, // Maximum limit
        },
      ];

      for (const input of validInputs) {
        const validation = listCampaignsQuerySchema.safeParse(input);
        expect(validation.success).toBe(true);
      }
    });
  });

  describe("empty result handling", () => {
    it("should return empty list when no campaigns exist", async () => {
      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("should return empty list when page exceeds available data", async () => {
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

      // Create one campaign
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);

      // Request page 2 when only 1 campaign exists
      const input: ListCampaignsInput = {
        pagination: { page: 2, limit: 10, order: "desc", orderBy: "createdAt" },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toEqual([]);
      expect(data.count).toBe(1); // Total count should still be 1
    });
  });

  describe("basic listing", () => {
    it("should list campaigns with pagination", async () => {
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

      // Create multiple campaigns
      const campaignResults = await Promise.all([
        context.campaignRepository.create({
          name: "Campaign 1",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Campaign 2",
          type: "sms",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Campaign 3",
          type: "social",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      expect(campaignResults.every((r) => r.isOk())).toBe(true);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);
      expect(data.count).toBe(3);

      // Verify campaign data
      const campaignNames = data.items.map((c) => c.name);
      expect(campaignNames).toContain("Campaign 1");
      expect(campaignNames).toContain("Campaign 2");
      expect(campaignNames).toContain("Campaign 3");
    });

    it("should respect pagination limits", async () => {
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

      // Create 5 campaigns
      const campaignPromises = [];
      for (let i = 1; i <= 5; i++) {
        campaignPromises.push(
          context.campaignRepository.create({
            name: `Campaign ${i}`,
            type: "email",
            createdBy: user.id,
            metadata: {},
          }),
        );
      }
      const campaignResults = await Promise.all(campaignPromises);
      expect(campaignResults.every((r) => r.isOk())).toBe(true);

      // Request first 3 campaigns
      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 3, order: "desc", orderBy: "createdAt" },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);
      expect(data.count).toBe(5);
    });

    it("should handle second page requests", async () => {
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

      // Create 5 campaigns
      const campaignPromises = [];
      for (let i = 1; i <= 5; i++) {
        campaignPromises.push(
          context.campaignRepository.create({
            name: `Campaign ${i}`,
            type: "email",
            createdBy: user.id,
            metadata: {},
          }),
        );
      }
      await Promise.all(campaignPromises);

      // Request second page
      const input: ListCampaignsInput = {
        pagination: { page: 2, limit: 3, order: "desc", orderBy: "createdAt" },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2); // Remaining 2 campaigns
      expect(data.count).toBe(5);
    });
  });

  describe("filtering", () => {
    it("should filter campaigns by keyword", async () => {
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

      // Create campaigns with different names
      await Promise.all([
        context.campaignRepository.create({
          name: "Email Marketing Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "SMS Blast Campaign",
          type: "sms",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Social Media Marketing",
          type: "social",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        filter: {
          keyword: "Marketing",
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2);
      expect(data.count).toBe(2);

      const campaignNames = data.items.map((c) => c.name);
      expect(campaignNames).toContain("Email Marketing Campaign");
      expect(campaignNames).toContain("Social Media Marketing");
    });

    it("should filter campaigns by type", async () => {
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

      // Create campaigns with different types
      await Promise.all([
        context.campaignRepository.create({
          name: "Email Campaign 1",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Email Campaign 2",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "SMS Campaign",
          type: "sms",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        filter: {
          type: "email",
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.items.every((c) => c.type === "email")).toBe(true);
    });

    it("should filter campaigns by status", async () => {
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

      // Create campaigns
      const campaignResults = await Promise.all([
        context.campaignRepository.create({
          name: "Draft Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Active Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const campaigns = campaignResults.map((r) => r._unsafeUnwrap());

      // Update one campaign to be active
      await context.campaignRepository.update({
        id: campaigns[1].id,
        status: "active",
      });

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        filter: {
          status: "active",
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.count).toBe(1);
      expect(data.items[0].status).toBe("active");
      expect(data.items[0].name).toBe("Active Campaign");
    });

    it("should filter campaigns by creator", async () => {
      // Create two users
      const user1Result = await context.userRepository.create({
        name: "User 1",
        email: "user1@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      const user2Result = await context.userRepository.create({
        name: "User 2",
        email: "user2@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });

      expect(user1Result.isOk() && user2Result.isOk()).toBe(true);
      const user1 = user1Result._unsafeUnwrap();
      const user2 = user2Result._unsafeUnwrap();

      // Create campaigns by different users
      await Promise.all([
        context.campaignRepository.create({
          name: "User 1 Campaign 1",
          type: "email",
          createdBy: user1.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "User 1 Campaign 2",
          type: "sms",
          createdBy: user1.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "User 2 Campaign",
          type: "email",
          createdBy: user2.id,
          metadata: {},
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        filter: {
          createdBy: user1.id,
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.items.every((c) => c.createdBy === user1.id)).toBe(true);
    });

    it("should filter campaigns with multiple criteria", async () => {
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

      // Create various campaigns
      const campaignResults = await Promise.all([
        context.campaignRepository.create({
          name: "Email Marketing Active",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "SMS Marketing Draft",
          type: "sms",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Email Sales Active",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const campaigns = campaignResults.map((r) => r._unsafeUnwrap());

      // Set first and third campaign to active
      await Promise.all([
        context.campaignRepository.update({
          id: campaigns[0].id,
          status: "active",
        }),
        context.campaignRepository.update({
          id: campaigns[2].id,
          status: "active",
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        filter: {
          keyword: "Marketing",
          type: "email",
          status: "active",
          createdBy: user.id,
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.count).toBe(1);
      expect(data.items[0].name).toBe("Email Marketing Active");
      expect(data.items[0].type).toBe("email");
      expect(data.items[0].status).toBe("active");
    });
  });

  describe("sorting", () => {
    it("should sort campaigns by name ascending", async () => {
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

      // Create campaigns with different names
      await Promise.all([
        context.campaignRepository.create({
          name: "Zebra Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Alpha Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Beta Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        sort: {
          field: "name",
          order: "asc",
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);

      const names = data.items.map((c) => c.name);
      expect(names).toEqual([
        "Alpha Campaign",
        "Beta Campaign",
        "Zebra Campaign",
      ]);
    });

    it("should sort campaigns by name descending", async () => {
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

      // Create campaigns with different names
      await Promise.all([
        context.campaignRepository.create({
          name: "Alpha Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Beta Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Zebra Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        sort: {
          field: "name",
          order: "desc",
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);

      const names = data.items.map((c) => c.name);
      expect(names).toEqual([
        "Zebra Campaign",
        "Beta Campaign",
        "Alpha Campaign",
      ]);
    });

    it("should sort campaigns by type", async () => {
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

      // Create campaigns with different types
      await Promise.all([
        context.campaignRepository.create({
          name: "Webinar Campaign",
          type: "webinar",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Email Campaign",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "SMS Campaign",
          type: "sms",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        sort: {
          field: "type",
          order: "asc",
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);

      const types = data.items.map((c) => c.type);
      expect(types).toEqual(["email", "sms", "webinar"]);
    });

    it("should use default sorting when not specified", async () => {
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

      // Create campaigns
      await Promise.all([
        context.campaignRepository.create({
          name: "Campaign 1",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
        context.campaignRepository.create({
          name: "Campaign 2",
          type: "email",
          createdBy: user.id,
          metadata: {},
        }),
      ]);

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        // No sort specified - should use default (createdAt desc)
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2);
      // Should be sorted by creation time, newest first by default
    });
  });

  describe("edge cases", () => {
    it("should handle empty filter values", async () => {
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

      // Create a campaign
      await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        filter: {
          keyword: "",
          // Empty string should be ignored
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
    });

    it("should handle maximum pagination limit", async () => {
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

      // Create multiple campaigns
      const campaignPromises = [];
      for (let i = 1; i <= 50; i++) {
        campaignPromises.push(
          context.campaignRepository.create({
            name: `Campaign ${i}`,
            type: "email",
            createdBy: user.id,
            metadata: {},
          }),
        );
      }
      await Promise.all(campaignPromises);

      const input: ListCampaignsInput = {
        pagination: {
          page: 1,
          limit: 1000,
          order: "desc",
          orderBy: "createdAt",
        }, // Maximum allowed limit
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(50);
      expect(data.count).toBe(50);
    });

    it("should handle case insensitive keyword search", async () => {
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

      // Create campaign with mixed case name
      await context.campaignRepository.create({
        name: "Marketing Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
        filter: {
          keyword: "marketing", // lowercase search
        },
      };

      const result = await listCampaigns(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe("Marketing Campaign");
    });
  });

  describe("repository error handling", () => {
    it("should handle repository failure gracefully", async () => {
      // Mock the repository to return an error
      const originalList = context.campaignRepository.list;
      context.campaignRepository.list = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Repository error"),
        } as any);
      };

      const input: ListCampaignsInput = {
        pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
      };

      const result = await listCampaigns(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Failed to list campaigns",
      );

      // Restore original method
      context.campaignRepository.list = originalList;
    });
  });
});
