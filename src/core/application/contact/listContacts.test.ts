import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ListContactsQuery } from "@/core/domain/contact/types";
import { listContacts } from "./listContacts";

let db: Database;
let context: Context;

/**
 * listContacts関数の基本的な機能テスト
 *
 * その他のテストは関心事別に以下のファイルに分割されています：
 * - listContacts.validation.test.ts: 入力検証
 * - listContacts.pagination.test.ts: ページネーション機能
 * - listContacts.filtering.test.ts: フィルタリング機能
 * - listContacts.edge-cases.test.ts: エッジケース
 */
describe("listContacts", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("successful listing", () => {
    it("should return empty list when no contacts exist", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(0);
      expect(contactList.count).toBe(0);
    });

    it("should return all contacts when they exist", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create multiple contacts
      const contactNames = ["Alice", "Bob", "Charlie"];
      const createdContacts = [];

      for (const name of contactNames) {
        const contactResult = await context.contactRepository.create({
          customerId: customer.id,
          name,
          email: `${name.toLowerCase()}@example.com`,
          isPrimary: name === "Alice",
          isActive: true,
        });
        expect(contactResult.isOk()).toBe(true);
        createdContacts.push(contactResult._unsafeUnwrap());
      }

      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(3);
      expect(contactList.count).toBe(3);
      expect(contactList.items[0].name).toBe("Alice");
      expect(contactList.items[1].name).toBe("Bob");
      expect(contactList.items[2].name).toBe("Charlie");
    });

    it("should sort contacts by name in ascending order", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create contacts in random order
      const contactNames = ["Zebra", "Alpha", "Beta"];

      for (const name of contactNames) {
        const contactResult = await context.contactRepository.create({
          customerId: customer.id,
          name,
          email: `${name.toLowerCase()}@example.com`,
          isPrimary: false,
          isActive: true,
        });
        expect(contactResult.isOk()).toBe(true);
      }

      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(3);
      expect(contactList.items[0].name).toBe("Alpha");
      expect(contactList.items[1].name).toBe("Beta");
      expect(contactList.items[2].name).toBe("Zebra");
    });

    it("should sort contacts by name in descending order", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create contacts in random order
      const contactNames = ["Beta", "Alpha", "Zebra"];

      for (const name of contactNames) {
        const contactResult = await context.contactRepository.create({
          customerId: customer.id,
          name,
          email: `${name.toLowerCase()}@example.com`,
          isPrimary: false,
          isActive: true,
        });
        expect(contactResult.isOk()).toBe(true);
      }

      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "desc",
          orderBy: "name",
        },
        sortOrder: "desc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(3);
      expect(contactList.items[0].name).toBe("Zebra");
      expect(contactList.items[1].name).toBe("Beta");
      expect(contactList.items[2].name).toBe("Alpha");
    });

    it("should sort contacts by creation date", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create contacts with slight delays to ensure different timestamps
      const contactNames = ["First", "Second", "Third"];

      for (const name of contactNames) {
        const contactResult = await context.contactRepository.create({
          customerId: customer.id,
          name,
          email: `${name.toLowerCase()}@example.com`,
          isPrimary: false,
          isActive: true,
        });
        expect(contactResult.isOk()).toBe(true);
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "createdAt",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(3);
      expect(contactList.items[0].name).toBe("First");
      expect(contactList.items[1].name).toBe("Second");
      expect(contactList.items[2].name).toBe("Third");
    });
  });

  describe("pagination", () => {
    beforeEach(async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create 25 contacts for pagination testing
      for (let i = 1; i <= 25; i++) {
        const contactResult = await context.contactRepository.create({
          customerId: customer.id,
          name: `Contact ${i.toString().padStart(2, "0")}`,
          email: `contact${i}@example.com`,
          isPrimary: i === 1,
          isActive: true,
        });
        expect(contactResult.isOk()).toBe(true);
      }
    });

    it("should return first page of results", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(10);
      expect(contactList.count).toBe(25);
      expect(contactList.items[0].name).toBe("Contact 01");
      expect(contactList.items[9].name).toBe("Contact 10");
    });

    it("should return second page of results", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 2,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(10);
      expect(contactList.count).toBe(25);
      expect(contactList.items[0].name).toBe("Contact 11");
      expect(contactList.items[9].name).toBe("Contact 20");
    });

    it("should return partial last page", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 3,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(5);
      expect(contactList.count).toBe(25);
      expect(contactList.items[0].name).toBe("Contact 21");
      expect(contactList.items[4].name).toBe("Contact 25");
    });

    it("should return empty results for out of range page", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 10,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(0);
      expect(contactList.count).toBe(25);
    });

    it("should work with different page sizes", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 5,
          order: "asc",
          orderBy: "name",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(5);
      expect(contactList.count).toBe(25);
      expect(contactList.items[0].name).toBe("Contact 01");
      expect(contactList.items[4].name).toBe("Contact 05");
    });
  });

  describe("filtering", () => {
    let customer1Id: string;
    let customer2Id: string;

    beforeEach(async () => {
      // Create two customers
      const customer1Result = await context.customerRepository.create({
        name: "Company A",
        status: "active",
      });
      expect(customer1Result.isOk()).toBe(true);
      const customer1 = customer1Result._unsafeUnwrap();
      customer1Id = customer1.id;

      const customer2Result = await context.customerRepository.create({
        name: "Company B",
        status: "active",
      });
      expect(customer2Result.isOk()).toBe(true);
      const customer2 = customer2Result._unsafeUnwrap();
      customer2Id = customer2.id;

      // Create contacts for customer 1
      const contact1Result = await context.contactRepository.create({
        customerId: customer1Id,
        name: "John Doe",
        email: "john@companya.com",
        department: "Engineering",
        isPrimary: true,
        isActive: true,
      });
      expect(contact1Result.isOk()).toBe(true);

      const contact2Result = await context.contactRepository.create({
        customerId: customer1Id,
        name: "Jane Smith",
        email: "jane@companya.com",
        department: "Engineering",
        isPrimary: false,
        isActive: false,
      });
      expect(contact2Result.isOk()).toBe(true);

      // Create contacts for customer 2
      const contact3Result = await context.contactRepository.create({
        customerId: customer2Id,
        name: "Bob Johnson",
        email: "bob@companyb.com",
        department: "Sales",
        isPrimary: true,
        isActive: true,
      });
      expect(contact3Result.isOk()).toBe(true);

      const contact4Result = await context.contactRepository.create({
        customerId: customer2Id,
        name: "Alice Brown",
        email: "alice@companyb.com",
        department: "Marketing",
        isPrimary: false,
        isActive: true,
      });
      expect(contact4Result.isOk()).toBe(true);
    });

    it("should filter by customer ID", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          customerId: customer1Id,
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(2);
      expect(contactList.count).toBe(2);
      expect(contactList.items[0].name).toBe("Jane Smith");
      expect(contactList.items[1].name).toBe("John Doe");
    });

    it("should filter by keyword in name", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          keyword: "John",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(2);
      expect(contactList.count).toBe(2);
      expect(contactList.items.some((c) => c.name === "John Doe")).toBe(true);
      expect(contactList.items.some((c) => c.name === "Bob Johnson")).toBe(
        true,
      );
    });

    it("should filter by department", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          department: "Engineering",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(2);
      expect(contactList.count).toBe(2);
      expect(contactList.items[0].name).toBe("Jane Smith");
      expect(contactList.items[1].name).toBe("John Doe");
    });

    it("should filter by active status", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          isActive: true,
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(3);
      expect(contactList.count).toBe(3);
      expect(contactList.items.every((c) => c.isActive === true)).toBe(true);
    });

    it("should filter by primary status", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          isPrimary: true,
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(2);
      expect(contactList.count).toBe(2);
      expect(contactList.items.every((c) => c.isPrimary === true)).toBe(true);
    });

    it("should apply multiple filters", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          customerId: customer1Id,
          isActive: true,
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(1);
      expect(contactList.count).toBe(1);
      expect(contactList.items[0].name).toBe("John Doe");
    });

    it("should return empty results for non-matching filters", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          keyword: "NonExistentName",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(0);
      expect(contactList.count).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle contacts with null optional fields", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with minimal fields
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "Minimal Contact",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);

      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(1);
      expect(contactList.items[0].name).toBe("Minimal Contact");
    });

    it("should handle large page sizes", async () => {
      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 1000,
          order: "asc",
          orderBy: "name",
        },

        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(0);
      expect(contactList.count).toBe(0);
    });

    it("should handle special characters in search", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Company",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a contact with special characters
      const contactResult = await context.contactRepository.create({
        customerId: customer.id,
        name: "José María O'Connor-Smith",
        email: "jose@example.com",
        isPrimary: false,
        isActive: true,
      });
      expect(contactResult.isOk()).toBe(true);

      const query: ListContactsQuery = {
        pagination: {
          page: 1,
          limit: 10,
          order: "asc",
          orderBy: "name",
        },
        filter: {
          keyword: "José",
        },
        sortOrder: "asc",
      };

      const result = await listContacts(context, query);

      expect(result.isOk()).toBe(true);
      const contactList = result._unsafeUnwrap();
      expect(contactList.items).toHaveLength(1);
      expect(contactList.items[0].name).toBe("José María O'Connor-Smith");
    });
  });
});
