import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  Contact,
  ContactWithCustomer,
  CreateContactParams,
  ListContactsQuery,
  UpdateContactParams,
} from "../types";

export interface ContactRepository {
  create(
    params: CreateContactParams,
  ): Promise<Result<Contact, RepositoryError>>;

  findById(id: string): Promise<Result<Contact | null, RepositoryError>>;

  findByIdWithCustomer(
    id: string,
  ): Promise<Result<ContactWithCustomer | null, RepositoryError>>;

  list(
    query: ListContactsQuery,
  ): Promise<Result<{ items: Contact[]; count: number }, RepositoryError>>;

  findByCustomerId(
    customerId: string,
  ): Promise<Result<Contact[], RepositoryError>>;

  findPrimaryByCustomerId(
    customerId: string,
  ): Promise<Result<Contact | null, RepositoryError>>;

  update(
    id: string,
    params: UpdateContactParams,
  ): Promise<Result<Contact, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  setPrimary(
    id: string,
    customerId: string,
  ): Promise<Result<Contact, RepositoryError>>;

  findByEmail(email: string): Promise<Result<Contact[], RepositoryError>>;

  search(
    keyword: string,
    customerId?: string,
    limit?: number,
  ): Promise<Result<Contact[], RepositoryError>>;
}
