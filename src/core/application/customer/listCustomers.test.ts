import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ListCustomersQuery } from "@/core/domain/customer/types";
import { ApplicationError } from "@/lib/error";
import { listCustomers } from "./listCustomers";

let db: Database;
let context: Context;

describe("listCustomers", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("pagination functionality", () => {
    it("should return paginated customer list", async () => {
      // Create multiple customers for pagination testing
      for (let i = 1; i <= 15; i++) {
        await context.customerRepository.create({
          name: `Customer ${i}`,
          status: "active",
          industry:
            i % 3 === 0
              ? "Technology"
              : i % 3 === 1
                ? "Healthcare"
                : "Manufacturing",
        });
      }

      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(15);
      expect(data.items).toHaveLength(10);
      expect(data.items[0].name).toBe("Customer 15"); // Most recent first
    });

    it("should return second page of results", async () => {
      // Create 25 customers
      for (let i = 1; i <= 25; i++) {
        await context.customerRepository.create({
          name: `Customer ${i}`,
          status: "active",
        });
      }

      const query: ListCustomersQuery = {
        pagination: {
          page: 2,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(25);
      expect(data.items).toHaveLength(10);
      // Should be different from first page results
      expect(data.items[0].name).toBe("Customer 15");
    });

    it("should handle empty results gracefully", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(0);
      expect(data.items).toHaveLength(0);
    });
  });

  describe("filtering functionality", () => {
    beforeEach(async () => {
      // Create test customers with different attributes
      await context.customerRepository.create({
        name: "Tech Solutions Inc",
        industry: "Technology",
        size: "large",
        status: "active",
      });

      await context.customerRepository.create({
        name: "Healthcare Corp",
        industry: "Healthcare",
        size: "medium",
        status: "active",
      });

      await context.customerRepository.create({
        name: "Manufacturing Ltd",
        industry: "Manufacturing",
        size: "small",
        status: "inactive",
      });

      await context.customerRepository.create({
        name: "Tech Startup",
        industry: "Technology",
        size: "startup",
        status: "prospect",
      });
    });

    it("should filter customers by industry", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          industry: "Technology",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(2);
      expect(data.items).toHaveLength(2);
      data.items.forEach((customer) => {
        expect(customer.industry).toBe("Technology");
      });
    });

    it("should filter customers by size", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          size: "large",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(1);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].size).toBe("large");
      expect(data.items[0].name).toBe("Tech Solutions Inc");
    });

    it("should filter customers by status", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          status: "inactive",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(1);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].status).toBe("inactive");
      expect(data.items[0].name).toBe("Manufacturing Ltd");
    });

    it("should filter customers by keyword (name search)", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          keyword: "Healthcare",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(1);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe("Healthcare Corp");
    });

    it("should combine multiple filters", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          industry: "Technology",
          status: "active",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(1);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe("Tech Solutions Inc");
      expect(data.items[0].industry).toBe("Technology");
      expect(data.items[0].status).toBe("active");
    });

    it("should return empty results when no matches found", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          industry: "Finance",
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(0);
      expect(data.items).toHaveLength(0);
    });
  });

  describe("sorting functionality", () => {
    beforeEach(async () => {
      // Create customers with different timestamps
      await context.customerRepository.create({
        name: "Alpha Corp",
        industry: "Technology",
        status: "active",
      });

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await context.customerRepository.create({
        name: "Beta Inc",
        industry: "Healthcare",
        status: "active",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await context.customerRepository.create({
        name: "Gamma Ltd",
        industry: "Manufacturing",
        status: "active",
      });
    });

    it("should sort customers by name in ascending order", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortBy: "name",
        sortOrder: "asc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);
      expect(data.items[0].name).toBe("Alpha Corp");
      expect(data.items[1].name).toBe("Beta Inc");
      expect(data.items[2].name).toBe("Gamma Ltd");
    });

    it("should sort customers by name in descending order", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "name",
        },
        sortBy: "name",
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);
      expect(data.items[0].name).toBe("Gamma Ltd");
      expect(data.items[1].name).toBe("Beta Inc");
      expect(data.items[2].name).toBe("Alpha Corp");
    });

    it("should sort customers by creation date", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);
      // Most recent first
      expect(data.items[0].name).toBe("Gamma Ltd");
      expect(data.items[1].name).toBe("Beta Inc");
      expect(data.items[2].name).toBe("Alpha Corp");
    });

    it("should sort customers by industry", async () => {
      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "industry",
        },
        sortBy: "industry",
        sortOrder: "asc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(3);
      expect(data.items[0].industry).toBe("Healthcare");
      expect(data.items[1].industry).toBe("Manufacturing");
      expect(data.items[2].industry).toBe("Technology");
    });
  });

  describe("complex scenarios", () => {
    it("should handle pagination with filtering and sorting", async () => {
      // Create multiple customers with same industry
      for (let i = 1; i <= 15; i++) {
        await context.customerRepository.create({
          name: `Tech Company ${i}`,
          industry: "Technology",
          size: i % 2 === 0 ? "large" : "small",
          status: "active",
        });
      }

      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 5,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          industry: "Technology",
          size: "large",
        },
        sortBy: "name",
        sortOrder: "asc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(7); // 7 large tech companies
      expect(data.items).toHaveLength(5); // First page with limit 5
      expect(data.items[0].name).toBe("Tech Company 10");
      expect(data.items[0].industry).toBe("Technology");
      expect(data.items[0].size).toBe("large");
    });

    it("should handle assignment-based filtering", async () => {
      // Create assigned user first
      const userResult = await context.userRepository.create({
        name: "John Manager",
        email: "john@example.com",
        role: "manager",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create customers assigned to the user
      await context.customerRepository.create({
        name: "Assigned Customer 1",
        industry: "Technology",
        status: "active",
        assignedUserId: user.id,
      });

      await context.customerRepository.create({
        name: "Assigned Customer 2",
        industry: "Healthcare",
        status: "active",
        assignedUserId: user.id,
      });

      await context.customerRepository.create({
        name: "Unassigned Customer",
        industry: "Technology",
        status: "active",
      });

      const query: ListCustomersQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          assignedUserId: user.id,
        },
        sortOrder: "desc",
      };

      const result = await listCustomers(context, query);

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.count).toBe(2);
      expect(data.items).toHaveLength(2);
      data.items.forEach((customer) => {
        expect(customer.assignedUserId).toBe(user.id);
      });
    });
  });

  describe("input validation", () => {
    it("should validate pagination parameters", async () => {
      const invalidQuery = {
        pagination: {
          page: -1, // Invalid negative page
          limit: 0, // Invalid zero limit
          order: "invalid" as any,
          orderBy: "createdAt",
        },
        sortOrder: "desc" as const,
      };

      const result = await listCustomers(context, invalidQuery);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "入力内容に誤りがあります",
      );
    });

    it("should validate filter parameters", async () => {
      const invalidQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          size: "invalid_size" as any,
        },
        sortOrder: "desc" as const,
      };

      const result = await listCustomers(context, invalidQuery);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "入力内容に誤りがあります",
      );
    });
  });
});
