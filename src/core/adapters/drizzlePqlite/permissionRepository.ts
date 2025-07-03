import { and, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { PermissionRepository } from "@/core/domain/permission/ports/permissionRepository";
import type {
  AssignPermissionToRoleParams,
  AssignRoleToUserParams,
  CheckPermissionParams,
  CreatePermissionParams,
  CreateRoleParams,
  ListPermissionsQuery,
  ListRolesQuery,
  ListUserRolesQuery,
  Permission,
  Role,
  RolePermission,
  RoleWithPermissions,
  UpdatePermissionParams,
  UpdateRoleParams,
  UserRole,
  UserWithRoles,
} from "@/core/domain/permission/types";
import {
  permissionSchema,
  rolePermissionSchema,
  roleSchema,
  roleWithPermissionsSchema,
  userRoleSchema,
  userWithRolesSchema,
} from "@/core/domain/permission/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "./schema";

export class DrizzlePqlitePermissionRepository implements PermissionRepository {
  constructor(private readonly db: Database) {}

  async createPermission(
    params: CreatePermissionParams,
  ): Promise<Result<Permission, RepositoryError>> {
    try {
      const result = await this.db
        .insert(permissions)
        .values(params)
        .returning();

      const permission = result[0];
      if (!permission) {
        return err(new RepositoryError("Failed to create permission"));
      }

      return validate(permissionSchema, permission).mapErr((error) => {
        return new RepositoryError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create permission", error));
    }
  }

  async updatePermission(
    params: UpdatePermissionParams,
  ): Promise<Result<Permission, RepositoryError>> {
    try {
      const { id, ...updateData } = params;
      const result = await this.db
        .update(permissions)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(permissions.id, id))
        .returning();

      const permission = result[0];
      if (!permission) {
        return err(new RepositoryError("Permission not found"));
      }

      return validate(permissionSchema, permission).mapErr((error) => {
        return new RepositoryError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update permission", error));
    }
  }

  async deletePermission(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // 関連するロール-権限の関係を削除
      await this.db
        .delete(rolePermissions)
        .where(eq(rolePermissions.permissionId, id));

      // 権限を削除
      await this.db.delete(permissions).where(eq(permissions.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete permission", error));
    }
  }

  async findPermissionById(
    id: string,
  ): Promise<Result<Permission | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(permissions)
        .where(eq(permissions.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(permissionSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find permission", error));
    }
  }

  async listPermissions(
    query: ListPermissionsQuery,
  ): Promise<Result<{ items: Permission[]; count: number }, RepositoryError>> {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.resource ? eq(permissions.resource, filter.resource) : undefined,
      filter?.action ? eq(permissions.action, filter.action) : undefined,
      filter?.scope ? eq(permissions.scope, filter.scope) : undefined,
      filter?.isActive !== undefined
        ? eq(permissions.isActive, filter.isActive)
        : undefined,
      filter?.keyword
        ? like(permissions.name, `%${filter.keyword}%`)
        : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(permissions)
          .where(and(...filters))
          .orderBy(desc(permissions.updatedAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(permissions)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(permissionSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list permissions", error));
    }
  }

  async createRole(
    params: CreateRoleParams,
  ): Promise<Result<Role, RepositoryError>> {
    try {
      const result = await this.db.insert(roles).values(params).returning();

      const role = result[0];
      if (!role) {
        return err(new RepositoryError("Failed to create role"));
      }

      return validate(roleSchema, role).mapErr((error) => {
        return new RepositoryError("Invalid role data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create role", error));
    }
  }

  async updateRole(
    params: UpdateRoleParams,
  ): Promise<Result<Role, RepositoryError>> {
    try {
      const { id, ...updateData } = params;
      const result = await this.db
        .update(roles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, id))
        .returning();

      const role = result[0];
      if (!role) {
        return err(new RepositoryError("Role not found"));
      }

      return validate(roleSchema, role).mapErr((error) => {
        return new RepositoryError("Invalid role data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update role", error));
    }
  }

  async deleteRole(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // システムロールは削除不可
      const role = await this.findRoleById(id);
      if (role.isErr()) {
        return err(role.error);
      }

      if (role.value?.isSystem) {
        return err(new RepositoryError("Cannot delete system role"));
      }

      // 関連するユーザー-ロール、ロール-権限の関係を削除
      await Promise.all([
        this.db.delete(userRoles).where(eq(userRoles.roleId, id)),
        this.db.delete(rolePermissions).where(eq(rolePermissions.roleId, id)),
      ]);

      // ロールを削除
      await this.db.delete(roles).where(eq(roles.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete role", error));
    }
  }

  async findRoleById(
    id: string,
  ): Promise<Result<Role | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(roleSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid role data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find role", error));
    }
  }

  async findRoleWithPermissions(
    id: string,
  ): Promise<Result<RoleWithPermissions | null, RepositoryError>> {
    try {
      const role = await this.findRoleById(id);
      if (role.isErr()) {
        return err(role.error);
      }

      if (!role.value) {
        return ok(null);
      }

      const permissionsResult = await this.getRolePermissions(id);
      if (permissionsResult.isErr()) {
        return err(permissionsResult.error);
      }

      const roleWithPermissions = {
        ...role.value,
        permissions: permissionsResult.value,
      };

      return validate(roleWithPermissionsSchema, roleWithPermissions).mapErr(
        (error) => {
          return new RepositoryError(
            "Invalid role with permissions data",
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to find role with permissions", error),
      );
    }
  }

  async listRoles(
    query: ListRolesQuery,
  ): Promise<Result<{ items: Role[]; count: number }, RepositoryError>> {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.isSystem !== undefined
        ? eq(roles.isSystem, filter.isSystem)
        : undefined,
      filter?.isActive !== undefined
        ? eq(roles.isActive, filter.isActive)
        : undefined,
      filter?.keyword ? like(roles.name, `%${filter.keyword}%`) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(roles)
          .where(and(...filters))
          .orderBy(desc(roles.updatedAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(roles)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(roleSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list roles", error));
    }
  }

  async listRolesWithPermissions(
    query: ListRolesQuery,
  ): Promise<
    Result<{ items: RoleWithPermissions[]; count: number }, RepositoryError>
  > {
    const rolesResult = await this.listRoles(query);
    if (rolesResult.isErr()) {
      return err(rolesResult.error);
    }

    try {
      const rolesWithPermissions = await Promise.all(
        rolesResult.value.items.map(async (role) => {
          const permissionsResult = await this.getRolePermissions(role.id);
          return {
            ...role,
            permissions: permissionsResult.unwrapOr([]),
          };
        }),
      );

      return ok({
        items: rolesWithPermissions,
        count: rolesResult.value.count,
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to list roles with permissions", error),
      );
    }
  }

  async assignPermissionToRole(
    params: AssignPermissionToRoleParams,
  ): Promise<Result<RolePermission, RepositoryError>> {
    try {
      const result = await this.db
        .insert(rolePermissions)
        .values(params)
        .returning();

      const rolePermission = result[0];
      if (!rolePermission) {
        return err(new RepositoryError("Failed to assign permission to role"));
      }

      return validate(rolePermissionSchema, rolePermission).mapErr((error) => {
        return new RepositoryError("Invalid role permission data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to assign permission to role", error),
      );
    }
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permissionId),
          ),
        );

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to remove permission from role", error),
      );
    }
  }

  async getRolePermissions(
    roleId: string,
  ): Promise<Result<Permission[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action,
          scope: permissions.scope,
          isActive: permissions.isActive,
          createdAt: permissions.createdAt,
          updatedAt: permissions.updatedAt,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(eq(rolePermissions.roleId, roleId));

      return ok(
        result
          .map((item) => validate(permissionSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to get role permissions", error));
    }
  }

  async assignRoleToUser(
    params: AssignRoleToUserParams,
  ): Promise<Result<UserRole, RepositoryError>> {
    try {
      const result = await this.db.insert(userRoles).values(params).returning();

      const userRole = result[0];
      if (!userRole) {
        return err(new RepositoryError("Failed to assign role to user"));
      }

      return validate(userRoleSchema, userRole).mapErr((error) => {
        return new RepositoryError("Invalid user role data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to assign role to user", error));
    }
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to remove role from user", error));
    }
  }

  async getUserRoles(userId: string): Promise<Result<Role[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          isSystem: roles.isSystem,
          isActive: roles.isActive,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      return ok(
        result
          .map((item) => validate(roleSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to get user roles", error));
    }
  }

  async getUserWithRoles(
    userId: string,
  ): Promise<Result<UserWithRoles | null, RepositoryError>> {
    try {
      const user = await this.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return ok(null);
      }

      const rolesResult = await this.getUserRoles(userId);
      if (rolesResult.isErr()) {
        return err(rolesResult.error);
      }

      const rolesWithPermissions = await Promise.all(
        rolesResult.value.map(async (role) => {
          const permissionsResult = await this.getRolePermissions(role.id);
          return {
            ...role,
            permissions: permissionsResult.unwrapOr([]),
          };
        }),
      );

      const allPermissions = rolesWithPermissions.flatMap(
        (role) => role.permissions,
      );

      // 重複する権限を除去
      const uniquePermissions = allPermissions.filter(
        (permission, index, self) =>
          index === self.findIndex((p) => p.id === permission.id),
      );

      const userWithRoles = {
        ...user[0],
        roles: rolesWithPermissions,
        allPermissions: uniquePermissions,
      };

      return validate(userWithRolesSchema, userWithRoles).mapErr((error) => {
        return new RepositoryError("Invalid user with roles data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to get user with roles", error));
    }
  }

  async listUserRoles(
    query: ListUserRolesQuery,
  ): Promise<Result<{ items: UserRole[]; count: number }, RepositoryError>> {
    const { userId, pagination } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, userId))
          .orderBy(desc(userRoles.assignedAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(userRoles)
          .where(eq(userRoles.userId, userId)),
      ]);

      return ok({
        items: items
          .map((item) => validate(userRoleSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list user roles", error));
    }
  }

  async checkPermission(
    params: CheckPermissionParams,
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const userPermissions = await this.getUserPermissions(params.userId);
      if (userPermissions.isErr()) {
        return err(userPermissions.error);
      }

      const hasPermission = userPermissions.value.some((permission) => {
        const resourceMatch = permission.resource === params.resource;
        const actionMatch = permission.action === params.action;

        if (!resourceMatch || !actionMatch) {
          return false;
        }

        // スコープチェック
        switch (permission.scope) {
          case "global":
            return true;
          case "organization":
            // 組織レベルの権限チェック（実装は組織管理次第）
            return true;
          case "own":
            // 自分のリソースのみアクセス可能
            return params.resourceOwnerId
              ? params.resourceOwnerId === params.userId
              : false;
          default:
            return false;
        }
      });

      return ok(hasPermission);
    } catch (error) {
      return err(new RepositoryError("Failed to check permission", error));
    }
  }

  async getUserPermissions(
    userId: string,
  ): Promise<Result<Permission[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action,
          scope: permissions.scope,
          isActive: permissions.isActive,
          createdAt: permissions.createdAt,
          updatedAt: permissions.updatedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(roles.isActive, true),
            eq(permissions.isActive, true),
          ),
        );

      // 重複する権限を除去
      const uniquePermissions = result.filter(
        (permission, index, self) =>
          index === self.findIndex((p) => p.id === permission.id),
      );

      return ok(
        uniquePermissions
          .map((item) => validate(permissionSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to get user permissions", error));
    }
  }

  async setUserRoles(
    userId: string,
    roleIds: string[],
    assignedBy: string,
  ): Promise<Result<UserRole[], RepositoryError>> {
    try {
      // 既存のロール割り当てを削除
      await this.db.delete(userRoles).where(eq(userRoles.userId, userId));

      // 新しいロール割り当てを作成
      if (roleIds.length === 0) {
        return ok([]);
      }

      const values = roleIds.map((roleId) => ({
        userId,
        roleId,
        assignedBy,
      }));

      const result = await this.db.insert(userRoles).values(values).returning();

      return ok(
        result
          .map((item) => validate(userRoleSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to set user roles", error));
    }
  }

  async setRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Result<RolePermission[], RepositoryError>> {
    try {
      // 既存の権限割り当てを削除
      await this.db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      // 新しい権限割り当てを作成
      if (permissionIds.length === 0) {
        return ok([]);
      }

      const values = permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      }));

      const result = await this.db
        .insert(rolePermissions)
        .values(values)
        .returning();

      return ok(
        result
          .map((item) => validate(rolePermissionSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to set role permissions", error));
    }
  }
}
