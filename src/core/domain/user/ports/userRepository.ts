import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateUserParams,
  ListUsersQuery,
  UpdateLastLoginParams,
  UpdateUserParams,
  User,
  UserProfile,
} from "../types";

export interface UserRepository {
  create(params: CreateUserParams): Promise<Result<User, RepositoryError>>;

  findById(id: string): Promise<Result<User | null, RepositoryError>>;

  findByEmail(email: string): Promise<Result<User | null, RepositoryError>>;

  list(
    query: ListUsersQuery,
  ): Promise<Result<{ items: User[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateUserParams,
  ): Promise<Result<User, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findActiveUsers(): Promise<Result<User[], RepositoryError>>;

  findByRole(
    role: "admin" | "manager" | "user",
  ): Promise<Result<User[], RepositoryError>>;

  getProfile(id: string): Promise<Result<UserProfile | null, RepositoryError>>;

  updateLastLogin(
    params: UpdateLastLoginParams,
  ): Promise<Result<User, RepositoryError>>;

  deactivate(id: string): Promise<Result<User, RepositoryError>>;

  activate(id: string): Promise<Result<User, RepositoryError>>;

  search(
    keyword: string,
    limit?: number,
  ): Promise<Result<User[], RepositoryError>>;
}
