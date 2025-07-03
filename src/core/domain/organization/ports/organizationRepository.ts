import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateDepartmentParams,
  CreateOrganizationParams,
  Department,
  DepartmentWithHierarchy,
  ListDepartmentsQuery,
  ListOrganizationsQuery,
  Organization,
  OrganizationAnalytics,
  UpdateDepartmentParams,
  UpdateOrganizationParams,
  UpdateOrganizationSettingsParams,
} from "../types";

export interface OrganizationRepository {
  // Organization CRUD
  createOrganization(
    params: CreateOrganizationParams,
  ): Promise<Result<Organization, RepositoryError>>;
  updateOrganization(
    params: UpdateOrganizationParams,
  ): Promise<Result<Organization, RepositoryError>>;
  findOrganizationById(
    id: string,
  ): Promise<Result<Organization | null, RepositoryError>>;
  deleteOrganization(id: string): Promise<Result<void, RepositoryError>>;
  listOrganizations(
    query: ListOrganizationsQuery,
  ): Promise<Result<{ items: Organization[]; count: number }, RepositoryError>>;

  // Organization settings
  updateOrganizationSettings(
    params: UpdateOrganizationSettingsParams,
  ): Promise<Result<Organization, RepositoryError>>;

  // Department CRUD
  createDepartment(
    params: CreateDepartmentParams,
  ): Promise<Result<Department, RepositoryError>>;
  updateDepartment(
    params: UpdateDepartmentParams,
  ): Promise<Result<Department, RepositoryError>>;
  findDepartmentById(
    id: string,
  ): Promise<Result<Department | null, RepositoryError>>;
  deleteDepartment(id: string): Promise<Result<void, RepositoryError>>;
  listDepartments(
    query: ListDepartmentsQuery,
  ): Promise<Result<{ items: Department[]; count: number }, RepositoryError>>;

  // Department hierarchy
  getDepartmentHierarchy(
    organizationId: string,
  ): Promise<Result<DepartmentWithHierarchy[], RepositoryError>>;
  getDepartmentTree(
    organizationId: string,
    parentId?: string,
  ): Promise<Result<DepartmentWithHierarchy[], RepositoryError>>;

  // Analytics
  getOrganizationAnalytics(
    organizationId: string,
  ): Promise<Result<OrganizationAnalytics, RepositoryError>>;

  // User department assignment
  assignUserToDepartment(
    userId: string,
    departmentId: string,
  ): Promise<Result<void, RepositoryError>>;
  removeUserFromDepartment(
    userId: string,
    departmentId: string,
  ): Promise<Result<void, RepositoryError>>;
  getUserDepartments(
    userId: string,
  ): Promise<Result<Department[], RepositoryError>>;
  getDepartmentUsers(
    departmentId: string,
  ): Promise<
    Result<{ id: string; name: string; email: string }[], RepositoryError>
  >;
}
