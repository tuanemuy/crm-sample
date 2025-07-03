import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  ContactHistory,
  ContactHistoryWithRelations,
  CreateContactHistoryParams,
  ListContactHistoryQuery,
  UpdateContactHistoryParams,
} from "../types";

export interface ContactHistoryRepository {
  create(
    params: CreateContactHistoryParams,
  ): Promise<Result<ContactHistory, RepositoryError>>;

  getById(
    id: string,
  ): Promise<Result<ContactHistoryWithRelations | null, RepositoryError>>;

  list(
    query: ListContactHistoryQuery,
  ): Promise<
    Result<
      { items: ContactHistoryWithRelations[]; count: number },
      RepositoryError
    >
  >;

  update(
    id: string,
    params: UpdateContactHistoryParams,
  ): Promise<Result<ContactHistory, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  listByCustomer(
    customerId: string,
    query: ListContactHistoryQuery,
  ): Promise<
    Result<
      { items: ContactHistoryWithRelations[]; count: number },
      RepositoryError
    >
  >;

  listByContact(
    contactId: string,
    query: ListContactHistoryQuery,
  ): Promise<
    Result<
      { items: ContactHistoryWithRelations[]; count: number },
      RepositoryError
    >
  >;
}
