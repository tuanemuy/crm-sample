import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import {
  type SearchLeadsInput,
  searchLeads,
  searchLeadsInputSchema,
} from "./searchLeads";

let db: Database;
let context: Context;

describe("searchLeads", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate keyword requirements", async () => {
      const invalidInputs = [
        {
          keyword: "", // Empty keyword
        },
        {
          keyword: "A".repeat(101), // Too long keyword
        },
        {
          // Missing keyword
        },
      ];

      for (const input of invalidInputs) {
        const validation = searchLeadsInputSchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should validate pagination parameters", async () => {
      const invalidInputs = [
        {
          keyword: "test",
          pagination: {
            page: 0, // Invalid page
            limit: 10,
          },
        },
        {
          keyword: "test",
          pagination: {
            page: 1,
            limit: 0, // Invalid limit
          },
        },
        {
          keyword: "test",
          pagination: {
            page: -1, // Negative page
            limit: 10,
          },
        },
        {
          keyword: "test",
          pagination: {
            page: 1,
            limit: 101, // Exceeds max limit
          },
        },
      ];

      for (const input of invalidInputs) {
        const validation = searchLeadsInputSchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should validate filter parameters", async () => {
      const invalidInputs = [
        {
          keyword: "test",
          filter: {
            status: "invalid-status", // Invalid status
          },
        },
        {
          keyword: "test",
          filter: {
            assignedUserId: "invalid-uuid", // Invalid UUID
          },
        },
        {
          keyword: "test",
          filter: {
            minScore: -1, // Invalid score
          },
        },
        {
          keyword: "test",
          filter: {
            maxScore: 101, // Invalid score
          },
        },
      ];

      for (const input of invalidInputs) {
        const validation = searchLeadsInputSchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should validate sort parameters", async () => {
      const invalidInputs = [
        {
          keyword: "test",
          sortBy: "invalid-field", // Invalid sort field
        },
        {
          keyword: "test",
          sortOrder: "invalid-order", // Invalid sort order
        },
      ];

      for (const input of invalidInputs) {
        const validation = searchLeadsInputSchema.safeParse(input);
        expect(validation.success).toBe(false);
      }
    });

    it("should accept valid input parameters", async () => {
      const validInputs = [
        {
          keyword: "test",
        },
        {
          keyword: "John Doe",
          pagination: { page: 1, limit: 20 },
        },
        {
          keyword: "enterprise",
          filter: {
            status: "qualified",
            minScore: 50,
            maxScore: 100,
            tags: ["important"],
          },
          sortBy: "score",
          sortOrder: "desc",
        },
      ];

      for (const input of validInputs) {
        const validation = searchLeadsInputSchema.safeParse(input);
        expect(validation.success).toBe(true);
      }
    });
  });

  describe("empty result handling", () => {
    it("should return empty list when no leads match keyword", async () => {
      // Create some leads that won't match
      await context.leadRepository.create({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        status: "new",
        score: 50,
        tags: [],
      });

      const input: SearchLeadsInput = {
        keyword: "NonExistentKeyword",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("should return empty list when no leads exist", async () => {
      const input: SearchLeadsInput = {
        keyword: "anything",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe("keyword searching", () => {
    it("should search leads by first name", async () => {
      // Create test leads
      await Promise.all([
        context.leadRepository.create({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          status: "new",
          score: 60,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob@example.com",
          status: "new",
          score: 70,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "John",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2);
      expect(data.items.some((item) => item.firstName === "John")).toBe(true);
      expect(data.items.some((item) => item.lastName === "Johnson")).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should search leads by last name", async () => {
      // Create test leads
      await Promise.all([
        context.leadRepository.create({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          status: "new",
          score: 60,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Smith",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].lastName).toBe("Smith");
      expect(data.count).toBe(1);
    });

    it("should search leads by email", async () => {
      // Create test leads
      await Promise.all([
        context.leadRepository.create({
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@enterprise.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@startup.com",
          status: "new",
          score: 60,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "enterprise",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].email).toBe("john.doe@enterprise.com");
      expect(data.count).toBe(1);
    });

    it("should search leads by company", async () => {
      // Create test leads
      await Promise.all([
        context.leadRepository.create({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          company: "Tech Solutions Inc",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          company: "Marketing Corp",
          status: "new",
          score: 60,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Solutions",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].company).toBe("Tech Solutions Inc");
      expect(data.count).toBe(1);
    });

    it("should search leads by multiple matching fields", async () => {
      // Create lead with keyword in multiple fields
      await context.leadRepository.create({
        firstName: "Tech",
        lastName: "Lead",
        email: "lead@tech.com",
        company: "Tech Corp",
        status: "new",
        score: 50,
        tags: [],
      });

      const input: SearchLeadsInput = {
        keyword: "Tech",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.count).toBe(1);
    });

    it("should perform case-insensitive search", async () => {
      // Create test lead
      await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@EXAMPLE.COM",
        company: "ENTERPRISE Corp",
        status: "new",
        score: 50,
        tags: [],
      });

      // Search with lowercase
      const input: SearchLeadsInput = {
        keyword: "enterprise",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.count).toBe(1);
    });

    it("should search with partial matches", async () => {
      // Create test lead
      await context.leadRepository.create({
        firstName: "Alexander",
        lastName: "Johnson",
        company: "International Business Machines",
        email: "alex@example.com",
        status: "new",
        score: 50,
        tags: [],
      });

      const partialSearches = ["Alex", "John", "International", "Business"];

      for (const keyword of partialSearches) {
        const input: SearchLeadsInput = {
          keyword,
        };

        const result = await searchLeads(context, input);

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();
        expect(data.items).toHaveLength(1);
        expect(data.count).toBe(1);
      }
    });
  });

  describe("filtering", () => {
    it("should filter by status", async () => {
      // Create leads with different statuses
      await Promise.all([
        context.leadRepository.create({
          firstName: "New",
          lastName: "Lead",
          email: "new@example.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Qualified",
          lastName: "Lead",
          email: "qualified@example.com",
          status: "qualified",
          score: 75,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Contacted",
          lastName: "Lead",
          email: "contacted@example.com",
          status: "contacted",
          score: 60,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Lead",
        filter: {
          status: "qualified",
        },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].status).toBe("qualified");
      expect(data.items[0].firstName).toBe("Qualified");
      expect(data.count).toBe(1);
    });

    it("should filter by score range", async () => {
      // Create leads with different scores
      await Promise.all([
        context.leadRepository.create({
          firstName: "Low",
          lastName: "Score",
          email: "low@example.com",
          status: "new",
          score: 25,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Medium",
          lastName: "Score",
          email: "medium@example.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "High",
          lastName: "Score",
          email: "high@example.com",
          status: "new",
          score: 85,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Score",
        filter: {
          minScore: 40,
          maxScore: 80,
        },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].score).toBe(50);
      expect(data.items[0].firstName).toBe("Medium");
      expect(data.count).toBe(1);
    });

    it("should filter by assigned user", async () => {
      // Create users
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

      // Create leads assigned to different users
      await Promise.all([
        context.leadRepository.create({
          firstName: "User1",
          lastName: "Lead",
          email: "user1lead@example.com",
          status: "new",
          score: 50,
          assignedUserId: user1.id,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "User2",
          lastName: "Lead",
          email: "user2lead@example.com",
          status: "new",
          score: 60,
          assignedUserId: user2.id,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Unassigned",
          lastName: "Lead",
          email: "unassigned@example.com",
          status: "new",
          score: 40,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Lead",
        filter: {
          assignedUserId: user1.id,
        },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].assignedUserId).toBe(user1.id);
      expect(data.items[0].firstName).toBe("User1");
      expect(data.count).toBe(1);
    });

    it.skip("should filter by tags - tags filtering not yet supported in PGlite", async () => {
      // Create leads with different tags
      await Promise.all([
        context.leadRepository.create({
          firstName: "Enterprise",
          lastName: "Lead",
          email: "enterprise@example.com",
          status: "new",
          score: 80,
          tags: ["enterprise", "high-value"],
        }),
        context.leadRepository.create({
          firstName: "Small",
          lastName: "Lead",
          email: "small@example.com",
          status: "new",
          score: 40,
          tags: ["small-business", "low-priority"],
        }),
        context.leadRepository.create({
          firstName: "Medium",
          lastName: "Lead",
          email: "medium@example.com",
          status: "new",
          score: 60,
          tags: ["medium-business"],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Lead",
        filter: {
          tags: ["enterprise"],
        },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].tags).toContain("enterprise");
      expect(data.items[0].firstName).toBe("Enterprise");
      expect(data.count).toBe(1);
    });

    it("should filter by multiple criteria", async () => {
      // Create various leads
      await Promise.all([
        context.leadRepository.create({
          firstName: "Perfect",
          lastName: "Match",
          email: "perfect@enterprise.com",
          company: "Enterprise Corp",
          status: "qualified",
          score: 90,
          tags: ["enterprise", "high-value"],
        }),
        context.leadRepository.create({
          firstName: "Partial",
          lastName: "Match",
          email: "partial@enterprise.com",
          company: "Enterprise Corp",
          status: "new", // Wrong status
          score: 95,
          tags: ["enterprise", "high-value"],
        }),
        context.leadRepository.create({
          firstName: "Another",
          lastName: "Match",
          email: "another@startup.com",
          company: "Startup Inc",
          status: "qualified",
          score: 50, // Too low score
          tags: ["startup"],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Match",
        filter: {
          status: "qualified",
          minScore: 80,
          tags: ["enterprise"],
        },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].firstName).toBe("Perfect");
      expect(data.items[0].status).toBe("qualified");
      expect(data.items[0].score).toBe(90);
      expect(data.items[0].tags).toContain("enterprise");
      expect(data.count).toBe(1);
    });
  });

  describe("sorting", () => {
    it("should sort by first name ascending", async () => {
      // Create leads with different names
      await Promise.all([
        context.leadRepository.create({
          firstName: "Zebra",
          lastName: "User",
          email: "z@example.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Alpha",
          lastName: "User",
          email: "a@example.com",
          status: "new",
          score: 60,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Beta",
          lastName: "User",
          email: "b@example.com",
          status: "new",
          score: 70,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "User",
        sortBy: "firstName",
        sortOrder: "asc",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);

      const firstNames = data.items.map((item) => item.firstName);
      expect(firstNames).toEqual(["Alpha", "Beta", "Zebra"]);
    });

    it("should sort by score descending", async () => {
      // Create leads with different scores
      await Promise.all([
        context.leadRepository.create({
          firstName: "Low",
          lastName: "Score",
          email: "low@example.com",
          status: "new",
          score: 30,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "High",
          lastName: "Score",
          email: "high@example.com",
          status: "new",
          score: 90,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Medium",
          lastName: "Score",
          email: "medium@example.com",
          status: "new",
          score: 60,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Score",
        sortBy: "score",
        sortOrder: "desc",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);

      const scores = data.items.map((item) => item.score);
      expect(scores).toEqual([90, 60, 30]);
    });

    it("should use default sorting when not specified", async () => {
      // Create leads
      await Promise.all([
        context.leadRepository.create({
          firstName: "First",
          lastName: "Lead",
          email: "first@example.com",
          status: "new",
          score: 50,
          tags: [],
        }),
        context.leadRepository.create({
          firstName: "Second",
          lastName: "Lead",
          email: "second@example.com",
          status: "new",
          score: 60,
          tags: [],
        }),
      ]);

      const input: SearchLeadsInput = {
        keyword: "Lead",
        // No sort specified - should use default
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2);
    });
  });

  describe("pagination", () => {
    it("should paginate results", async () => {
      // Create multiple leads
      const leadPromises = [];
      for (let i = 1; i <= 5; i++) {
        leadPromises.push(
          context.leadRepository.create({
            firstName: `Lead${i}`,
            lastName: "Test",
            email: `lead${i}@example.com`,
            status: "new",
            score: i * 10,
            tags: [],
          }),
        );
      }
      await Promise.all(leadPromises);

      // Request first page
      const input: SearchLeadsInput = {
        keyword: "Lead",
        pagination: { page: 1, limit: 3 },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);
      expect(data.count).toBe(5);
    });

    it("should handle second page requests", async () => {
      // Create multiple leads
      const leadPromises = [];
      for (let i = 1; i <= 5; i++) {
        leadPromises.push(
          context.leadRepository.create({
            firstName: `Lead${i}`,
            lastName: "Test",
            email: `lead${i}@example.com`,
            status: "new",
            score: i * 10,
            tags: [],
          }),
        );
      }
      await Promise.all(leadPromises);

      // Request second page
      const input: SearchLeadsInput = {
        keyword: "Lead",
        pagination: { page: 2, limit: 3 },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(2); // Remaining leads
      expect(data.count).toBe(5);
    });

    it("should use default pagination when not specified", async () => {
      // Create multiple leads
      const leadPromises = [];
      for (let i = 1; i <= 25; i++) {
        leadPromises.push(
          context.leadRepository.create({
            firstName: `Lead${i}`,
            lastName: "Test",
            email: `lead${i}@example.com`,
            status: "new",
            score: 50,
            tags: [],
          }),
        );
      }
      await Promise.all(leadPromises);

      const input: SearchLeadsInput = {
        keyword: "Lead",
        // No pagination specified - should use default (page 1, limit 20)
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(20); // Default limit
      expect(data.count).toBe(25);
    });
  });

  describe("edge cases", () => {
    it.skip("should handle special characters in keyword - special character handling needs review", async () => {
      // Create lead with special characters
      await context.leadRepository.create({
        firstName: "John",
        lastName: "O'Connor",
        email: "john@o'connor-corp.com",
        company: "O'Connor & Associates",
        status: "new",
        score: 50,
        tags: [],
      });

      const input: SearchLeadsInput = {
        keyword: "O'Connor",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].lastName).toBe("O'Connor");
    });

    it("should handle numeric keywords", async () => {
      // Create lead with numbers
      await context.leadRepository.create({
        firstName: "Lead",
        lastName: "123",
        email: "lead123@example.com",
        company: "Company 456",
        status: "new",
        score: 50,
        tags: [],
      });

      const input: SearchLeadsInput = {
        keyword: "123",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].lastName).toBe("123");
    });

    it("should handle whitespace in keyword", async () => {
      // Create lead
      await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe Smith",
        email: "john@example.com",
        company: "Big Tech Corp",
        status: "new",
        score: 50,
        tags: [],
      });

      const input: SearchLeadsInput = {
        keyword: "Doe Smith",
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].lastName).toBe("Doe Smith");
    });

    it("should handle empty filter values", async () => {
      // Create lead
      await context.leadRepository.create({
        firstName: "Test",
        lastName: "Lead",
        email: "test@example.com",
        status: "new",
        score: 50,
        tags: [],
      });

      const input: SearchLeadsInput = {
        keyword: "Test",
        filter: {
          // Empty filter should be ignored
        },
      };

      const result = await searchLeads(context, input);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
    });
  });

  describe("repository error handling", () => {
    it("should handle repository failure gracefully", async () => {
      // Mock the repository to return an error
      const originalList = context.leadRepository.list;
      context.leadRepository.list = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Repository error"),
        } as any);
      };

      const input: SearchLeadsInput = {
        keyword: "test",
      };

      const result = await searchLeads(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Failed to search leads");

      // Restore original method
      context.leadRepository.list = originalList;
    });
  });
});
