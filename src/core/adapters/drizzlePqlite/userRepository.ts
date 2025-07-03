import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { UserRepository } from "@/core/domain/user/ports/userRepository";
import {
  type CreateUserParams,
  type ListUsersQuery,
  type UpdateLastLoginParams,
  type UpdateUserParams,
  type User,
  type UserProfile,
  userSchema,
} from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { activities, customers, deals, leads, users } from "./schema";

export class DrizzlePqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateUserParams,
  ): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db.insert(users).values(params).returning();

      const user = result[0];
      if (!user) {
        return err(new RepositoryError("Failed to create user"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create user", error));
    }
  }

  async findById(id: string): Promise<Result<User | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find user", error));
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Result<User | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find user by email", error));
    }
  }

  async list(
    query: ListUsersQuery,
  ): Promise<Result<{ items: User[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortBy, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword
        ? sql`${users.name} ILIKE ${`%${filter.keyword}%`} OR ${users.email} ILIKE ${`%${filter.keyword}%`}`
        : undefined,
      filter?.role ? eq(users.role, filter.role) : undefined,
      filter?.isActive !== undefined
        ? eq(users.isActive, filter.isActive)
        : undefined,
    ].filter((filter) => filter !== undefined);

    const orderBy =
      sortBy === "name"
        ? users.name
        : sortBy === "email"
          ? users.email
          : sortBy === "role"
            ? users.role
            : sortBy === "lastLoginAt"
              ? users.lastLoginAt
              : sortBy === "updatedAt"
                ? users.updatedAt
                : users.createdAt;

    const orderDirection = sortOrder === "asc" ? asc(orderBy) : desc(orderBy);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(users)
          .where(and(...filters))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(users)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(userSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list users", error));
    }
  }

  async update(
    id: string,
    params: UpdateUserParams,
  ): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set({ ...params, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new RepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update user", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (result.length === 0) {
        return err(new RepositoryError("User not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete user", error));
    }
  }

  async findActiveUsers(): Promise<Result<User[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(asc(users.name));

      return ok(
        result
          .map((item) => validate(userSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find active users", error));
    }
  }

  async findByRole(
    role: "admin" | "manager" | "user",
  ): Promise<Result<User[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(and(eq(users.role, role), eq(users.isActive, true)))
        .orderBy(asc(users.name));

      return ok(
        result
          .map((item) => validate(userSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to find users by role", error));
    }
  }

  async getProfile(
    id: string,
  ): Promise<Result<UserProfile | null, RepositoryError>> {
    try {
      const [userResult, stats] = await Promise.all([
        this.db.select().from(users).where(eq(users.id, id)).limit(1),
        Promise.all([
          this.db
            .select({ count: count() })
            .from(customers)
            .where(eq(customers.assignedUserId, id)),
          this.db
            .select({ count: count() })
            .from(leads)
            .where(eq(leads.assignedUserId, id)),
          this.db
            .select({ count: count() })
            .from(deals)
            .where(eq(deals.assignedUserId, id)),
          this.db
            .select({
              totalValue: sql<string>`COALESCE(SUM(${deals.amount}), '0')`,
            })
            .from(deals)
            .where(
              and(eq(deals.assignedUserId, id), eq(deals.stage, "closed_won")),
            ),
          this.db
            .select({ count: count() })
            .from(activities)
            .where(eq(activities.assignedUserId, id)),
          this.db
            .select({
              id: activities.id,
              type: activities.type,
              subject: activities.subject,
              createdAt: activities.createdAt,
            })
            .from(activities)
            .where(eq(activities.assignedUserId, id))
            .orderBy(desc(activities.createdAt))
            .limit(5),
        ]),
      ]);

      if (userResult.length === 0) {
        return ok(null);
      }

      const rawUser = userResult[0];

      // Validate user data to ensure proper typing
      const userValidation = validate(userSchema, rawUser);
      if (userValidation.isErr()) {
        return err(
          new RepositoryError("Invalid user data", userValidation.error),
        );
      }

      const user = userValidation.value;
      const [
        customerCount,
        leadCount,
        dealCount,
        totalDealsValue,
        activityCount,
        recentActivities,
      ] = stats;

      const profile = {
        ...user,
        customerCount: customerCount[0]?.count || 0,
        leadCount: leadCount[0]?.count || 0,
        dealCount: dealCount[0]?.count || 0,
        totalDealsValue: totalDealsValue[0]?.totalValue || "0",
        activityCount: activityCount[0]?.count || 0,
        recentActivities,
      };

      return ok(profile);
    } catch (error) {
      return err(new RepositoryError("Failed to get user profile", error));
    }
  }

  async updateLastLogin(
    params: UpdateLastLoginParams,
  ): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set({ lastLoginAt: params.lastLoginAt, updatedAt: new Date() })
        .where(eq(users.id, params.userId))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new RepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new RepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update last login", error));
    }
  }

  async deactivate(id: string): Promise<Result<User, RepositoryError>> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<Result<User, RepositoryError>> {
    return this.update(id, { isActive: true });
  }

  async search(
    keyword: string,
    limit = 10,
  ): Promise<Result<User[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.isActive, true),
            sql`${users.name} ILIKE ${`%${keyword}%`} OR ${users.email} ILIKE ${`%${keyword}%`}`,
          ),
        )
        .orderBy(asc(users.name))
        .limit(limit);

      return ok(
        result
          .map((item) => validate(userSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to search users", error));
    }
  }
}
