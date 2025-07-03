import { and, asc, count, desc, eq, isNull, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { CustomerRepository } from "@/core/domain/customer/ports/customerRepository";
import {
  type CreateCustomerParams,
  type Customer,
  type CustomerStats,
  type CustomerWithRelations,
  customerSchema,
  customerWithRelationsSchema,
  type ListCustomersQuery,
  type UpdateCustomerParams,
} from "@/core/domain/customer/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { contacts, customers, deals, users } from "./schema";

export class DrizzlePqliteCustomerRepository implements CustomerRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateCustomerParams,
  ): Promise<Result<Customer, RepositoryError>> {
    try {
      const result = await this.db.insert(customers).values(params).returning();

      if (!Array.isArray(result) || result.length === 0) {
        return err(new RepositoryError("Failed to create customer"));
      }

      const customer = result[0];
      return validate(customerSchema, customer).mapErr((error) => {
        return new RepositoryError("Invalid customer data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create customer", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Customer | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(customerSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid customer data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find customer", error));
    }
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<Result<CustomerWithRelations | null, RepositoryError>> {
    try {
      const [
        customerResult,
        contactsResult,
        dealsResult,
        assignedUserResult,
        parentResult,
        childrenResult,
      ] = await Promise.all([
        this.db.select().from(customers).where(eq(customers.id, id)).limit(1),
        this.db
          .select({
            id: contacts.id,
            name: contacts.name,
            email: contacts.email,
            title: contacts.title,
            isPrimary: contacts.isPrimary,
          })
          .from(contacts)
          .where(eq(contacts.customerId, id)),
        this.db
          .select({
            id: deals.id,
            title: deals.title,
            amount: deals.amount,
            stage: deals.stage,
          })
          .from(deals)
          .where(eq(deals.customerId, id)),
        this.db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .innerJoin(customers, eq(customers.assignedUserId, users.id))
          .where(eq(customers.id, id))
          .limit(1),
        this.db
          .select({
            id: customers.id,
            name: customers.name,
          })
          .from(customers)
          .where(
            eq(
              customers.id,
              sql`(SELECT parent_customer_id FROM customers WHERE id = ${id})`,
            ),
          )
          .limit(1),
        this.db
          .select({
            id: customers.id,
            name: customers.name,
          })
          .from(customers)
          .where(eq(customers.parentCustomerId, id)),
      ]);

      if (customerResult.length === 0) {
        return ok(null);
      }

      const customer = customerResult[0];

      // Transform database data to match domain schema
      const customerWithRelations = {
        ...customer,
        industry: customer.industry || undefined,
        size: customer.size || undefined,
        location: customer.location || undefined,
        foundedYear: customer.foundedYear || undefined,
        website: customer.website || undefined,
        description: customer.description || undefined,
        parentCustomerId: customer.parentCustomerId || undefined,
        assignedUserId: customer.assignedUserId || undefined,
        contacts: contactsResult.map((contact) => ({
          ...contact,
          email: contact.email || undefined,
          title: contact.title || undefined,
        })),
        deals: dealsResult,
        assignedUser: assignedUserResult[0] || undefined,
        parentCustomer: parentResult[0] || undefined,
        childCustomers: childrenResult,
      };

      return validate(
        customerWithRelationsSchema,
        customerWithRelations,
      ).mapErr((error) => new RepositoryError("Invalid customer data", error));
    } catch (error) {
      return err(
        new RepositoryError("Failed to find customer with relations", error),
      );
    }
  }

  async list(
    query: ListCustomersQuery,
  ): Promise<Result<{ items: Customer[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword ? like(customers.name, `%${filter.keyword}%`) : undefined,
      filter?.industry ? eq(customers.industry, filter.industry) : undefined,
      filter?.size ? eq(customers.size, filter.size) : undefined,
      filter?.status ? eq(customers.status, filter.status) : undefined,
      filter?.assignedUserId
        ? eq(customers.assignedUserId, filter.assignedUserId)
        : undefined,
      filter?.parentCustomerId === null
        ? isNull(customers.parentCustomerId)
        : filter?.parentCustomerId
          ? eq(customers.parentCustomerId, filter.parentCustomerId)
          : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "name"
        ? customers.name
        : sortBy === "industry"
          ? customers.industry
          : sortBy === "updatedAt"
            ? customers.updatedAt
            : customers.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(customers)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(customers)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(customerSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list customers", error));
    }
  }

  async update(
    id: string,
    params: UpdateCustomerParams,
  ): Promise<Result<Customer, RepositoryError>> {
    try {
      const result = await this.db
        .update(customers)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();

      const customer = result[0];
      if (!customer) {
        return err(new RepositoryError("Customer not found"));
      }

      return validate(customerSchema, customer).mapErr((error) => {
        return new RepositoryError("Invalid customer data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update customer", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(customers)
        .where(eq(customers.id, id))
        .returning({ id: customers.id });

      if (result.length === 0) {
        return err(new RepositoryError("Customer not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete customer", error));
    }
  }

  async findByName(
    name: string,
  ): Promise<Result<Customer | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(customers)
        .where(eq(customers.name, name))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(customerSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid customer data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find customer by name", error));
    }
  }

  async findByAssignedUser(
    userId: string,
  ): Promise<Result<Customer[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(customers)
        .where(eq(customers.assignedUserId, userId))
        .orderBy(desc(customers.updatedAt));

      return ok(
        result
          .map((item) => validate(customerSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find customers by assigned user", error),
      );
    }
  }

  async findChildren(
    parentId: string,
  ): Promise<Result<Customer[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(customers)
        .where(eq(customers.parentCustomerId, parentId))
        .orderBy(asc(customers.name));

      return ok(
        result
          .map((item) => validate(customerSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find child customers", error));
    }
  }

  async getStats(): Promise<Result<CustomerStats, RepositoryError>> {
    try {
      const [
        totalCount,
        statusCounts,
        industryCounts,
        sizeCounts,
        recentCustomers,
      ] = await Promise.all([
        this.db.select({ count: count() }).from(customers),
        this.db
          .select({ status: customers.status, count: count() })
          .from(customers)
          .groupBy(customers.status),
        this.db
          .select({ industry: customers.industry, count: count() })
          .from(customers)
          .where(sql`${customers.industry} IS NOT NULL`)
          .groupBy(customers.industry),
        this.db
          .select({ size: customers.size, count: count() })
          .from(customers)
          .where(sql`${customers.size} IS NOT NULL`)
          .groupBy(customers.size),
        this.db
          .select()
          .from(customers)
          .orderBy(desc(customers.createdAt))
          .limit(5),
      ]);

      const stats = {
        totalCustomers: totalCount[0]?.count || 0,
        activeCustomers:
          statusCounts.find((s) => s.status === "active")?.count || 0,
        inactiveCustomers:
          statusCounts.find((s) => s.status === "inactive")?.count || 0,
        archivedCustomers:
          statusCounts.find((s) => s.status === "archived")?.count || 0,
        customersByIndustry: Object.fromEntries(
          industryCounts.map((item) => [
            item.industry || "Unknown",
            item.count,
          ]),
        ),
        customersBySize: Object.fromEntries(
          sizeCounts.map((item) => [item.size || "Unknown", item.count]),
        ),
        recentCustomers: recentCustomers
          .map((item) => validate(customerSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      };

      return ok(stats);
    } catch (error) {
      return err(new RepositoryError("Failed to get customer stats", error));
    }
  }

  async search(
    keyword: string,
    limit = 10,
  ): Promise<Result<Customer[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(customers)
        .where(
          sql`${customers.name} ILIKE ${`%${keyword}%`} OR ${customers.description} ILIKE ${`%${keyword}%`}`,
        )
        .orderBy(desc(customers.updatedAt))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(customerSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to search customers", error));
    }
  }
}
