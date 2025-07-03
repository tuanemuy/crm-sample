import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateCustomerParams,
  Customer,
  CustomerStats,
  CustomerWithRelations,
  ListCustomersQuery,
  UpdateCustomerParams,
} from "../types";

export interface CustomerRepository {
  create(
    params: CreateCustomerParams,
  ): Promise<Result<Customer, RepositoryError>>;

  findById(id: string): Promise<Result<Customer | null, RepositoryError>>;

  findByIdWithRelations(
    id: string,
  ): Promise<Result<CustomerWithRelations | null, RepositoryError>>;

  list(
    query: ListCustomersQuery,
  ): Promise<Result<{ items: Customer[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateCustomerParams,
  ): Promise<Result<Customer, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findByName(name: string): Promise<Result<Customer | null, RepositoryError>>;

  findByAssignedUser(
    userId: string,
  ): Promise<Result<Customer[], RepositoryError>>;

  findChildren(parentId: string): Promise<Result<Customer[], RepositoryError>>;

  getStats(): Promise<Result<CustomerStats, RepositoryError>>;

  search(
    keyword: string,
    limit?: number,
  ): Promise<Result<Customer[], RepositoryError>>;
}
