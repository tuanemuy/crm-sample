import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
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
} from "../types";

export interface PermissionRepository {
  // Permission CRUD
  createPermission(
    params: CreatePermissionParams,
  ): Promise<Result<Permission, RepositoryError>>;
  updatePermission(
    params: UpdatePermissionParams,
  ): Promise<Result<Permission, RepositoryError>>;
  deletePermission(id: string): Promise<Result<void, RepositoryError>>;
  findPermissionById(
    id: string,
  ): Promise<Result<Permission | null, RepositoryError>>;
  listPermissions(
    query: ListPermissionsQuery,
  ): Promise<Result<{ items: Permission[]; count: number }, RepositoryError>>;

  // Role CRUD
  createRole(params: CreateRoleParams): Promise<Result<Role, RepositoryError>>;
  updateRole(params: UpdateRoleParams): Promise<Result<Role, RepositoryError>>;
  deleteRole(id: string): Promise<Result<void, RepositoryError>>;
  findRoleById(id: string): Promise<Result<Role | null, RepositoryError>>;
  findRoleWithPermissions(
    id: string,
  ): Promise<Result<RoleWithPermissions | null, RepositoryError>>;
  listRoles(
    query: ListRolesQuery,
  ): Promise<Result<{ items: Role[]; count: number }, RepositoryError>>;
  listRolesWithPermissions(
    query: ListRolesQuery,
  ): Promise<
    Result<{ items: RoleWithPermissions[]; count: number }, RepositoryError>
  >;

  // Role-Permission management
  assignPermissionToRole(
    params: AssignPermissionToRoleParams,
  ): Promise<Result<RolePermission, RepositoryError>>;
  removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Result<void, RepositoryError>>;
  getRolePermissions(
    roleId: string,
  ): Promise<Result<Permission[], RepositoryError>>;

  // User-Role management
  assignRoleToUser(
    params: AssignRoleToUserParams,
  ): Promise<Result<UserRole, RepositoryError>>;
  removeRoleFromUser(
    userId: string,
    roleId: string,
  ): Promise<Result<void, RepositoryError>>;
  getUserRoles(userId: string): Promise<Result<Role[], RepositoryError>>;
  getUserWithRoles(
    userId: string,
  ): Promise<Result<UserWithRoles | null, RepositoryError>>;
  listUserRoles(
    query: ListUserRolesQuery,
  ): Promise<Result<{ items: UserRole[]; count: number }, RepositoryError>>;

  // Permission checking
  checkPermission(
    params: CheckPermissionParams,
  ): Promise<Result<boolean, RepositoryError>>;
  getUserPermissions(
    userId: string,
  ): Promise<Result<Permission[], RepositoryError>>;

  // Bulk operations
  setUserRoles(
    userId: string,
    roleIds: string[],
    assignedBy: string,
  ): Promise<Result<UserRole[], RepositoryError>>;
  setRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Result<RolePermission[], RepositoryError>>;
}
