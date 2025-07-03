import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ContactRepository } from "@/core/domain/contact/ports/contactRepository";
import {
  type Contact,
  type ContactWithCustomer,
  type CreateContactParams,
  contactSchema,
  type ListContactsQuery,
  type UpdateContactParams,
} from "@/core/domain/contact/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { contacts, customers } from "./schema";

export class DrizzlePqliteContactRepository implements ContactRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateContactParams,
  ): Promise<Result<Contact, RepositoryError>> {
    try {
      // If this is set as primary, unset other primary contacts for the same customer
      if (params.isPrimary) {
        await this.db
          .update(contacts)
          .set({ isPrimary: false })
          .where(eq(contacts.customerId, params.customerId));
      }

      const result = await this.db.insert(contacts).values(params).returning();

      const contact = result[0];
      if (!contact) {
        return err(new RepositoryError("Failed to create contact"));
      }

      return validate(contactSchema, contact).mapErr((error) => {
        return new RepositoryError("Invalid contact data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create contact", error));
    }
  }

  async findById(id: string): Promise<Result<Contact | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(contactSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid contact data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find contact", error));
    }
  }

  async findByIdWithCustomer(
    id: string,
  ): Promise<Result<ContactWithCustomer | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          contact: contacts,
          customer: {
            id: customers.id,
            name: customers.name,
            industry: customers.industry,
          },
        })
        .from(contacts)
        .innerJoin(customers, eq(contacts.customerId, customers.id))
        .where(eq(contacts.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const contact = result[0].contact;
      const customer = result[0].customer;

      const contactWithCustomer = {
        ...contact,
        title: contact.title || undefined,
        department: contact.department || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        mobile: contact.mobile || undefined,
        customer: {
          ...customer,
          industry: customer.industry || undefined,
        },
      };

      return ok(contactWithCustomer);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find contact with customer", error),
      );
    }
  }

  async list(
    query: ListContactsQuery,
  ): Promise<Result<{ items: Contact[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword
        ? sql`${contacts.name} ILIKE ${`%${filter.keyword}%`} OR ${contacts.email} ILIKE ${`%${filter.keyword}%`}`
        : undefined,
      filter?.customerId
        ? eq(contacts.customerId, filter.customerId)
        : undefined,
      filter?.department
        ? eq(contacts.department, filter.department)
        : undefined,
      filter?.isActive !== undefined
        ? eq(contacts.isActive, filter.isActive)
        : undefined,
      filter?.isPrimary !== undefined
        ? eq(contacts.isPrimary, filter.isPrimary)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "name"
        ? contacts.name
        : sortBy === "title"
          ? contacts.title
          : sortBy === "updatedAt"
            ? contacts.updatedAt
            : contacts.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(contacts)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(contacts)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(contactSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list contacts", error));
    }
  }

  async findByCustomerId(
    customerId: string,
  ): Promise<Result<Contact[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.customerId, customerId))
        .orderBy(desc(contacts.isPrimary), asc(contacts.name));

      return ok(
        result
          .map((item) => validate(contactSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find contacts by customer", error),
      );
    }
  }

  async findPrimaryByCustomerId(
    customerId: string,
  ): Promise<Result<Contact | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.customerId, customerId),
            eq(contacts.isPrimary, true),
            eq(contacts.isActive, true),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(contactSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid contact data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find primary contact", error));
    }
  }

  async update(
    id: string,
    params: UpdateContactParams,
  ): Promise<Result<Contact, RepositoryError>> {
    try {
      // If this is being set as primary, first get the current contact to know the customer
      if (params.isPrimary === true) {
        const currentContact = await this.findById(id);
        if (currentContact.isOk() && currentContact.value) {
          // Unset other primary contacts for the same customer
          await this.db
            .update(contacts)
            .set({ isPrimary: false })
            .where(
              and(
                eq(contacts.customerId, currentContact.value.customerId),
                sql`${contacts.id} != ${id}`,
              ),
            );
        }
      }

      const result = await this.db
        .update(contacts)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(contacts.id, id))
        .returning();

      const contact = result[0];
      if (!contact) {
        return err(new RepositoryError("Contact not found"));
      }

      return validate(contactSchema, contact).mapErr((error) => {
        return new RepositoryError("Invalid contact data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update contact", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(contacts)
        .where(eq(contacts.id, id))
        .returning({ id: contacts.id });

      if (result.length === 0) {
        return err(new RepositoryError("Contact not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete contact", error));
    }
  }

  async setPrimary(
    id: string,
    customerId: string,
  ): Promise<Result<Contact, RepositoryError>> {
    try {
      // First unset all primary contacts for this customer
      await this.db
        .update(contacts)
        .set({ isPrimary: false })
        .where(eq(contacts.customerId, customerId));

      // Then set this contact as primary
      const result = await this.db
        .update(contacts)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(contacts.id, id))
        .returning();

      const contact = result[0];
      if (!contact) {
        return err(new RepositoryError("Contact not found"));
      }

      return validate(contactSchema, contact).mapErr((error) => {
        return new RepositoryError("Invalid contact data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to set primary contact", error));
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Result<Contact[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.email, email))
        .orderBy(desc(contacts.updatedAt));

      return ok(
        result
          .map((item) => validate(contactSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find contacts by email", error),
      );
    }
  }

  async search(
    keyword: string,
    customerId?: string,
    limit = 10,
  ): Promise<Result<Contact[], RepositoryError>> {
    try {
      const baseFilters = [
        sql`${contacts.name} ILIKE ${`%${keyword}%`} OR ${contacts.email} ILIKE ${`%${keyword}%`} OR ${contacts.title} ILIKE ${`%${keyword}%`}`,
        eq(contacts.isActive, true),
      ];

      if (customerId) {
        baseFilters.push(eq(contacts.customerId, customerId));
      }

      const result = await this.db
        .select()
        .from(contacts)
        .where(and(...baseFilters))
        .orderBy(desc(contacts.isPrimary), asc(contacts.name))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(contactSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to search contacts", error));
    }
  }
}
