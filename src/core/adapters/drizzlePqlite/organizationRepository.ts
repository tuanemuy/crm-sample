import { and, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { OrganizationRepository } from "@/core/domain/organization/ports/organizationRepository";
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
} from "@/core/domain/organization/types";
import {
  departmentSchema,
  organizationAnalyticsSchema,
  organizationSchema,
} from "@/core/domain/organization/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import {
  customers,
  deals,
  departments,
  leads,
  organizations,
  userDepartments,
  users,
} from "./schema";

export class DrizzlePqliteOrganizationRepository
  implements OrganizationRepository
{
  constructor(private readonly db: Database) {}

  async createOrganization(
    params: CreateOrganizationParams,
  ): Promise<Result<Organization, RepositoryError>> {
    try {
      const result = await this.db
        .insert(organizations)
        .values(params)
        .returning();

      const organization = result[0];
      if (!organization) {
        return err(new RepositoryError("Failed to create organization"));
      }

      return validate(organizationSchema, organization).mapErr((error) => {
        return new RepositoryError("Invalid organization data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create organization", error));
    }
  }

  async updateOrganization(
    params: UpdateOrganizationParams,
  ): Promise<Result<Organization, RepositoryError>> {
    try {
      const { id, ...updateData } = params;
      const result = await this.db
        .update(organizations)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, id))
        .returning();

      const organization = result[0];
      if (!organization) {
        return err(new RepositoryError("Organization not found"));
      }

      return validate(organizationSchema, organization).mapErr((error) => {
        return new RepositoryError("Invalid organization data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update organization", error));
    }
  }

  async findOrganizationById(
    id: string,
  ): Promise<Result<Organization | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(organizationSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid organization data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find organization", error));
    }
  }

  async deleteOrganization(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // Get department IDs first
      const departmentIds = await this.db
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.organizationId, id));

      // Delete user-department relationships
      if (departmentIds.length > 0) {
        for (const dept of departmentIds) {
          await this.db
            .delete(userDepartments)
            .where(eq(userDepartments.departmentId, dept.id));
        }
      }

      // Delete departments
      await this.db
        .delete(departments)
        .where(eq(departments.organizationId, id));

      // Delete organization
      await this.db.delete(organizations).where(eq(organizations.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete organization", error));
    }
  }

  async listOrganizations(
    query: ListOrganizationsQuery,
  ): Promise<Result<{ items: Organization[]; count: number }, RepositoryError>> {
    const { pagination, filter, sortOrder } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword ? like(organizations.name, `%${filter.keyword}%`) : undefined,
      filter?.industry ? eq(organizations.industry, filter.industry) : undefined,
      filter?.size ? eq(organizations.size, filter.size) : undefined,
      filter?.isActive !== undefined ? eq(organizations.isActive, filter.isActive) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(organizations)
          .where(and(...filters))
          .orderBy(sortOrder === "asc" ? organizations.createdAt : desc(organizations.createdAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(organizations)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(organizationSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0].count),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list organizations", error));
    }
  }

  async updateOrganizationSettings(
    params: UpdateOrganizationSettingsParams,
  ): Promise<Result<Organization, RepositoryError>> {
    try {
      const { organizationId, settings } = params;

      // Get current organization to merge settings
      const currentOrg = await this.findOrganizationById(organizationId);
      if (currentOrg.isErr()) {
        return err(currentOrg.error);
      }

      if (!currentOrg.value) {
        return err(new RepositoryError("Organization not found"));
      }

      const mergedSettings = {
        ...currentOrg.value.settings,
        ...settings,
      };

      const result = await this.db
        .update(organizations)
        .set({
          settings: mergedSettings,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();

      const organization = result[0];
      if (!organization) {
        return err(new RepositoryError("Organization not found"));
      }

      return validate(organizationSchema, organization).mapErr((error) => {
        return new RepositoryError("Invalid organization data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update organization settings", error),
      );
    }
  }

  async createDepartment(
    params: CreateDepartmentParams,
  ): Promise<Result<Department, RepositoryError>> {
    try {
      const values = {
        ...params,
        budget: params.budget ? params.budget.toString() : undefined,
      };

      const result = await this.db
        .insert(departments)
        .values(values)
        .returning();

      const department = result[0];
      if (!department) {
        return err(new RepositoryError("Failed to create department"));
      }

      return validate(departmentSchema, department).mapErr((error) => {
        return new RepositoryError("Invalid department data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create department", error));
    }
  }

  async updateDepartment(
    params: UpdateDepartmentParams,
  ): Promise<Result<Department, RepositoryError>> {
    try {
      const { id, ...updateData } = params;
      const updateValues = {
        ...updateData,
        budget:
          updateData.budget !== undefined
            ? updateData.budget?.toString()
            : undefined,
        updatedAt: new Date(),
      };

      const result = await this.db
        .update(departments)
        .set(updateValues)
        .where(eq(departments.id, id))
        .returning();

      const department = result[0];
      if (!department) {
        return err(new RepositoryError("Department not found"));
      }

      return validate(departmentSchema, department).mapErr((error) => {
        return new RepositoryError("Invalid department data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update department", error));
    }
  }

  async findDepartmentById(
    id: string,
  ): Promise<Result<Department | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(departmentSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid department data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find department", error));
    }
  }

  async deleteDepartment(id: string): Promise<Result<void, RepositoryError>> {
    try {
      // Delete user-department relationships first
      await this.db
        .delete(userDepartments)
        .where(eq(userDepartments.departmentId, id));

      // Update child departments to remove parent reference
      await this.db
        .update(departments)
        .set({ parentDepartmentId: null })
        .where(eq(departments.parentDepartmentId, id));

      // Delete department
      await this.db.delete(departments).where(eq(departments.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete department", error));
    }
  }

  async listDepartments(
    query: ListDepartmentsQuery,
  ): Promise<Result<{ items: Department[]; count: number }, RepositoryError>> {
    const { organizationId, pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      eq(departments.organizationId, organizationId),
      filter?.parentDepartmentId
        ? eq(departments.parentDepartmentId, filter.parentDepartmentId)
        : undefined,
      filter?.managerId
        ? eq(departments.managerId, filter.managerId)
        : undefined,
      filter?.isActive !== undefined
        ? eq(departments.isActive, filter.isActive)
        : undefined,
      filter?.keyword
        ? like(departments.name, `%${filter.keyword}%`)
        : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(departments)
          .where(and(...filters))
          .orderBy(desc(departments.updatedAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(departments)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(departmentSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count ?? 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list departments", error));
    }
  }

  async getDepartmentHierarchy(
    organizationId: string,
  ): Promise<Result<DepartmentWithHierarchy[], RepositoryError>> {
    try {
      // Get all departments for the organization
      const allDepartments = await this.db
        .select({
          id: departments.id,
          organizationId: departments.organizationId,
          name: departments.name,
          description: departments.description,
          parentDepartmentId: departments.parentDepartmentId,
          managerId: departments.managerId,
          budget: departments.budget,
          costCenter: departments.costCenter,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
          managerName: users.name,
          managerEmail: users.email,
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id))
        .where(eq(departments.organizationId, organizationId))
        .orderBy(departments.name);

      // Build hierarchy
      const departmentMap = new Map<string, DepartmentWithHierarchy>();
      const rootDepartments: DepartmentWithHierarchy[] = [];

      // First pass: create all department objects
      for (const dept of allDepartments) {
        const department: DepartmentWithHierarchy = {
          id: dept.id,
          organizationId: dept.organizationId,
          name: dept.name,
          description: dept.description || undefined,
          parentDepartmentId: dept.parentDepartmentId || undefined,
          managerId: dept.managerId || undefined,
          budget: dept.budget ? Number(dept.budget) : undefined,
          costCenter: dept.costCenter || undefined,
          isActive: dept.isActive,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
          children: [],
          manager: dept.managerId
            ? {
                id: dept.managerId,
                name: dept.managerName || "",
                email: dept.managerEmail || "",
              }
            : undefined,
        };

        departmentMap.set(dept.id, department);

        if (!dept.parentDepartmentId) {
          rootDepartments.push(department);
        }
      }

      // Second pass: build parent-child relationships
      for (const dept of allDepartments) {
        if (dept.parentDepartmentId) {
          const parent = departmentMap.get(dept.parentDepartmentId);
          const child = departmentMap.get(dept.id);
          if (parent && child) {
            parent.children?.push(child);
            child.parent = parent;
          }
        }
      }

      return ok(rootDepartments);
    } catch (error) {
      return err(
        new RepositoryError("Failed to get department hierarchy", error),
      );
    }
  }

  async getDepartmentTree(
    organizationId: string,
    parentId?: string,
  ): Promise<Result<DepartmentWithHierarchy[], RepositoryError>> {
    try {
      const condition = parentId
        ? and(
            eq(departments.organizationId, organizationId),
            eq(departments.parentDepartmentId, parentId),
          )
        : and(
            eq(departments.organizationId, organizationId),
            sql`${departments.parentDepartmentId} IS NULL`,
          );

      const result = await this.db
        .select({
          id: departments.id,
          organizationId: departments.organizationId,
          name: departments.name,
          description: departments.description,
          parentDepartmentId: departments.parentDepartmentId,
          managerId: departments.managerId,
          budget: departments.budget,
          costCenter: departments.costCenter,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
          managerName: users.name,
          managerEmail: users.email,
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id))
        .where(condition)
        .orderBy(departments.name);

      const departmentsWithHierarchy = await Promise.all(
        result.map(async (dept) => {
          const children = await this.getDepartmentTree(
            organizationId,
            dept.id,
          );

          const department: DepartmentWithHierarchy = {
            id: dept.id,
            organizationId: dept.organizationId,
            name: dept.name,
            description: dept.description || undefined,
            parentDepartmentId: dept.parentDepartmentId || undefined,
            managerId: dept.managerId || undefined,
            budget: dept.budget ? Number(dept.budget) : undefined,
            costCenter: dept.costCenter || undefined,
            isActive: dept.isActive,
            createdAt: dept.createdAt,
            updatedAt: dept.updatedAt,
            children: children.unwrapOr([]),
            manager: dept.managerId
              ? {
                  id: dept.managerId,
                  name: dept.managerName || "",
                  email: dept.managerEmail || "",
                }
              : undefined,
          };

          return department;
        }),
      );

      return ok(departmentsWithHierarchy);
    } catch (error) {
      return err(new RepositoryError("Failed to get department tree", error));
    }
  }

  async getOrganizationAnalytics(
    organizationId: string,
  ): Promise<Result<OrganizationAnalytics, RepositoryError>> {
    try {
      const [
        userStats,
        departmentStats,
        customerStats,
        leadStats,
        dealStats,
        activeUserStats,
      ] = await Promise.all([
        this.db
          .select({ count: sql`count(*)` })
          .from(users)
          .where(eq(users.isActive, true)),
        this.db
          .select({ count: sql`count(*)` })
          .from(departments)
          .where(eq(departments.organizationId, organizationId)),
        this.db
          .select({ count: sql`count(*)` })
          .from(customers)
          .where(eq(customers.status, "active")),
        this.db.select({ count: sql`count(*)` }).from(leads),
        this.db.select({ count: sql`count(*)` }).from(deals),
        this.db
          .select({ count: sql`count(*)` })
          .from(users)
          .where(
            and(
              eq(users.isActive, true),
              sql`${users.lastLoginAt} > (NOW() - INTERVAL '30 days')`,
            ),
          ),
      ]);

      const analytics: OrganizationAnalytics = {
        userCount: Number(userStats[0]?.count ?? 0),
        departmentCount: Number(departmentStats[0]?.count ?? 0),
        customerCount: Number(customerStats[0]?.count ?? 0),
        leadCount: Number(leadStats[0]?.count ?? 0),
        dealCount: Number(dealStats[0]?.count ?? 0),
        activeUserCount: Number(activeUserStats[0]?.count ?? 0),
        storageUsed: 0, // Would need actual file storage calculation
        storageLimit: undefined,
        lastActivity: new Date(),
      };

      return validate(organizationAnalyticsSchema, analytics).mapErr(
        (error) => {
          return new RepositoryError("Invalid analytics data", error);
        },
      );
    } catch (error) {
      return err(
        new RepositoryError("Failed to get organization analytics", error),
      );
    }
  }

  async assignUserToDepartment(
    userId: string,
    departmentId: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .insert(userDepartments)
        .values({ userId, departmentId })
        .onConflictDoNothing();

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to assign user to department", error),
      );
    }
  }

  async removeUserFromDepartment(
    userId: string,
    departmentId: string,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(userDepartments)
        .where(
          and(
            eq(userDepartments.userId, userId),
            eq(userDepartments.departmentId, departmentId),
          ),
        );

      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to remove user from department", error),
      );
    }
  }

  async getUserDepartments(
    userId: string,
  ): Promise<Result<Department[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: departments.id,
          organizationId: departments.organizationId,
          name: departments.name,
          description: departments.description,
          parentDepartmentId: departments.parentDepartmentId,
          managerId: departments.managerId,
          budget: departments.budget,
          costCenter: departments.costCenter,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
        })
        .from(userDepartments)
        .innerJoin(
          departments,
          eq(userDepartments.departmentId, departments.id),
        )
        .where(eq(userDepartments.userId, userId));

      return ok(
        result
          .map((item) => {
            const dept = {
              ...item,
              budget: item.budget ? Number(item.budget) : undefined,
            };
            return validate(departmentSchema, dept).unwrapOr(null);
          })
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to get user departments", error));
    }
  }

  async getDepartmentUsers(
    departmentId: string,
  ): Promise<
    Result<{ id: string; name: string; email: string }[], RepositoryError>
  > {
    try {
      const result = await this.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(userDepartments)
        .innerJoin(users, eq(userDepartments.userId, users.id))
        .where(eq(userDepartments.departmentId, departmentId))
        .orderBy(users.name);

      return ok(result);
    } catch (error) {
      return err(new RepositoryError("Failed to get department users", error));
    }
  }
}
