import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ContactHistoryRepository } from "@/core/domain/contactHistory/ports/contactHistoryRepository";
import {
  type ContactHistory,
  type ContactHistoryWithRelations,
  type CreateContactHistoryParams,
  contactHistorySchema,
  contactHistoryWithRelationsSchema,
  type ListContactHistoryQuery,
  type UpdateContactHistoryParams,
} from "@/core/domain/contactHistory/types";
import type { RepositoryError } from "@/lib/error";
import { RepositoryError as RepoError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { contactHistory, contacts, customers, users } from "./schema";

export class DrizzlePqliteContactHistoryRepository
  implements ContactHistoryRepository
{
  constructor(private readonly db: Database) {}

  async create(
    params: CreateContactHistoryParams,
  ): Promise<Result<ContactHistory, RepositoryError>> {
    try {
      const result = await this.db
        .insert(contactHistory)
        .values(params)
        .returning();

      const record = result[0];
      if (!record) {
        return err(new RepoError("Failed to create contact history"));
      }

      return validate(contactHistorySchema, record).mapErr((error) => {
        return new RepoError("Invalid contact history data", error);
      });
    } catch (error) {
      return err(new RepoError("Failed to create contact history", error));
    }
  }

  async getById(
    id: string,
  ): Promise<Result<ContactHistoryWithRelations | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: contactHistory.id,
          customerId: contactHistory.customerId,
          contactId: contactHistory.contactId,
          type: contactHistory.type,
          subject: contactHistory.subject,
          content: contactHistory.content,
          direction: contactHistory.direction,
          status: contactHistory.status,
          duration: contactHistory.duration,
          contactedByUserId: contactHistory.contactedByUserId,
          contactedAt: contactHistory.contactedAt,
          createdAt: contactHistory.createdAt,
          updatedAt: contactHistory.updatedAt,
          customer: {
            id: customers.id,
            name: customers.name,
          },
          contact: {
            id: contacts.id,
            name: contacts.name,
            email: contacts.email,
          },
          contactedByUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(contactHistory)
        .leftJoin(customers, eq(contactHistory.customerId, customers.id))
        .leftJoin(contacts, eq(contactHistory.contactId, contacts.id))
        .leftJoin(users, eq(contactHistory.contactedByUserId, users.id))
        .where(eq(contactHistory.id, id))
        .limit(1);

      const record = result[0];
      if (!record) {
        return ok(null);
      }

      return validate(contactHistoryWithRelationsSchema, record).mapErr(
        (error) => {
          return new RepoError("Invalid contact history data", error);
        },
      );
    } catch (error) {
      return err(new RepoError("Failed to get contact history", error));
    }
  }

  async list(
    query: ListContactHistoryQuery,
  ): Promise<
    Result<
      { items: ContactHistoryWithRelations[]; count: number },
      RepositoryError
    >
  > {
    const {
      pagination,
      filter,
      sortBy = "contactedAt",
      sortOrder = "desc",
    } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.customerId
        ? eq(contactHistory.customerId, filter.customerId)
        : undefined,
      filter?.contactId
        ? eq(contactHistory.contactId, filter.contactId)
        : undefined,
      filter?.type ? eq(contactHistory.type, filter.type) : undefined,
      filter?.direction
        ? eq(contactHistory.direction, filter.direction)
        : undefined,
      filter?.status ? eq(contactHistory.status, filter.status) : undefined,
      filter?.contactedByUserId
        ? eq(contactHistory.contactedByUserId, filter.contactedByUserId)
        : undefined,
      filter?.dateFrom
        ? gte(contactHistory.contactedAt, filter.dateFrom)
        : undefined,
      filter?.dateTo
        ? lte(contactHistory.contactedAt, filter.dateTo)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderColumn = contactHistory[sortBy];
    const orderFn = sortOrder === "asc" ? orderColumn : desc(orderColumn);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            id: contactHistory.id,
            customerId: contactHistory.customerId,
            contactId: contactHistory.contactId,
            type: contactHistory.type,
            subject: contactHistory.subject,
            content: contactHistory.content,
            direction: contactHistory.direction,
            status: contactHistory.status,
            duration: contactHistory.duration,
            contactedByUserId: contactHistory.contactedByUserId,
            contactedAt: contactHistory.contactedAt,
            createdAt: contactHistory.createdAt,
            updatedAt: contactHistory.updatedAt,
            customer: {
              id: customers.id,
              name: customers.name,
            },
            contact: {
              id: contacts.id,
              name: contacts.name,
              email: contacts.email,
            },
            contactedByUser: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(contactHistory)
          .leftJoin(customers, eq(contactHistory.customerId, customers.id))
          .leftJoin(contacts, eq(contactHistory.contactId, contacts.id))
          .leftJoin(users, eq(contactHistory.contactedByUserId, users.id))
          .where(and(...filters))
          .orderBy(orderFn)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(contactHistory)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) =>
            validate(contactHistoryWithRelationsSchema, item).unwrapOr(null),
          )
          .filter((item) => item !== null),
        count: Number(countResult[0].count),
      });
    } catch (error) {
      return err(new RepoError("Failed to list contact history", error));
    }
  }

  async update(
    id: string,
    params: UpdateContactHistoryParams,
  ): Promise<Result<ContactHistory, RepositoryError>> {
    try {
      const result = await this.db
        .update(contactHistory)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(contactHistory.id, id))
        .returning();

      const record = result[0];
      if (!record) {
        return err(new RepoError("Contact history not found"));
      }

      return validate(contactHistorySchema, record).mapErr((error) => {
        return new RepoError("Invalid contact history data", error);
      });
    } catch (error) {
      return err(new RepoError("Failed to update contact history", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(contactHistory)
        .where(eq(contactHistory.id, id))
        .returning({ id: contactHistory.id });

      if (result.length === 0) {
        return err(new RepoError("Contact history not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepoError("Failed to delete contact history", error));
    }
  }

  async listByCustomer(
    customerId: string,
    query: ListContactHistoryQuery,
  ): Promise<
    Result<
      { items: ContactHistoryWithRelations[]; count: number },
      RepositoryError
    >
  > {
    const queryWithCustomerFilter = {
      ...query,
      filter: { ...query.filter, customerId },
    };
    return this.list(queryWithCustomerFilter);
  }

  async listByContact(
    contactId: string,
    query: ListContactHistoryQuery,
  ): Promise<
    Result<
      { items: ContactHistoryWithRelations[]; count: number },
      RepositoryError
    >
  > {
    const queryWithContactFilter = {
      ...query,
      filter: { ...query.filter, contactId },
    };
    return this.list(queryWithContactFilter);
  }
}
