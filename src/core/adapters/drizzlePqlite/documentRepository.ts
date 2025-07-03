import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { DocumentRepository } from "@/core/domain/document/ports/documentRepository";
import {
  type CreateDocumentParams,
  type Document,
  type DocumentStats,
  type DocumentWithRelations,
  documentSchema,
  documentWithRelationsSchema,
  type ListDocumentsQuery,
  type UpdateDocumentParams,
} from "@/core/domain/document/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { documents, users } from "./schema";

export class DrizzlePqliteDocumentRepository implements DocumentRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateDocumentParams,
  ): Promise<Result<Document, RepositoryError>> {
    try {
      const result = await this.db.insert(documents).values(params).returning();

      if (!Array.isArray(result) || result.length === 0) {
        return err(new RepositoryError("Failed to create document"));
      }

      const document = result[0];
      return validate(documentSchema, document).mapErr((error) => {
        return new RepositoryError("Invalid document data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create document", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Document | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);

      if (!Array.isArray(result) || result.length === 0) {
        return ok(null);
      }

      const document = result[0];
      return validate(documentSchema, document).mapErr((error) => {
        return new RepositoryError("Invalid document data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to find document", error));
    }
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<Result<DocumentWithRelations | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          document: documents,
          uploadedByUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(documents)
        .leftJoin(users, eq(documents.uploadedBy, users.id))
        .where(eq(documents.id, id))
        .limit(1);

      if (!Array.isArray(result) || result.length === 0) {
        return ok(null);
      }

      const row = result[0];
      const documentWithRelations = {
        ...row.document,
        uploadedByUser: row.uploadedByUser,
      };

      return validate(
        documentWithRelationsSchema,
        documentWithRelations,
      ).mapErr((error) => {
        return new RepositoryError("Invalid document data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to find document with relations", error),
      );
    }
  }

  async list(
    query: ListDocumentsQuery,
  ): Promise<Result<{ items: Document[]; count: number }, RepositoryError>> {
    const {
      pagination,
      filter,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const conditions = [];

    if (filter?.keyword) {
      conditions.push(ilike(documents.originalFilename, `%${filter.keyword}%`));
    }

    if (filter?.mimeType) {
      conditions.push(eq(documents.mimeType, filter.mimeType));
    }

    if (filter?.entityType) {
      conditions.push(eq(documents.entityType, filter.entityType));
    }

    if (filter?.entityId) {
      conditions.push(eq(documents.entityId, filter.entityId));
    }

    if (filter?.uploadedBy) {
      conditions.push(eq(documents.uploadedBy, filter.uploadedBy));
    }

    if (filter?.isPublic !== undefined) {
      conditions.push(eq(documents.isPublic, filter.isPublic));
    }

    if (filter?.sizeMin) {
      conditions.push(sql`${documents.size} >= ${filter.sizeMin}`);
    }

    if (filter?.sizeMax) {
      conditions.push(sql`${documents.size} <= ${filter.sizeMax}`);
    }

    if (filter?.dateFrom) {
      conditions.push(sql`${documents.createdAt} >= ${filter.dateFrom}`);
    }

    if (filter?.dateTo) {
      conditions.push(sql`${documents.createdAt} <= ${filter.dateTo}`);
    }

    if (filter?.tags && filter.tags.length > 0) {
      conditions.push(sql`${documents.tags} && ${JSON.stringify(filter.tags)}`);
    }

    const orderByColumn =
      {
        filename: documents.filename,
        size: documents.size,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      }[sortBy] || documents.createdAt;

    const orderDirection = sortOrder === "asc" ? asc : desc;

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(documents)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(orderDirection(orderByColumn))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(documents)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      const validItems = items
        .map((item) => validate(documentSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok({
        items: validItems,
        count: countResult[0]?.count || 0,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list documents", error));
    }
  }

  async update(
    id: string,
    params: UpdateDocumentParams,
  ): Promise<Result<Document, RepositoryError>> {
    try {
      const result = await this.db
        .update(documents)
        .set(params)
        .where(eq(documents.id, id))
        .returning();

      if (!Array.isArray(result) || result.length === 0) {
        return err(new RepositoryError("Document not found"));
      }

      const document = result[0];
      return validate(documentSchema, document).mapErr((error) => {
        return new RepositoryError("Invalid document data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update document", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(documents)
        .where(eq(documents.id, id))
        .returning({ id: documents.id });

      if (!Array.isArray(result) || result.length === 0) {
        return err(new RepositoryError("Document not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete document", error));
    }
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Result<Document[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.entityType, entityType),
            eq(documents.entityId, entityId),
          ),
        )
        .orderBy(desc(documents.createdAt));

      const validItems = result
        .map((item) => validate(documentSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok(validItems);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find documents by entity", error),
      );
    }
  }

  async findByUploadedUser(
    userId: string,
  ): Promise<Result<Document[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(documents)
        .where(eq(documents.uploadedBy, userId))
        .orderBy(desc(documents.createdAt));

      const validItems = result
        .map((item) => validate(documentSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok(validItems);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find documents by user", error),
      );
    }
  }

  async findByTags(
    tags: string[],
  ): Promise<Result<Document[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(documents)
        .where(sql`${documents.tags} && ${JSON.stringify(tags)}`)
        .orderBy(desc(documents.createdAt));

      const validItems = result
        .map((item) => validate(documentSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok(validItems);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find documents by tags", error),
      );
    }
  }

  async findVersions(
    parentDocumentId: string,
  ): Promise<Result<Document[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(documents)
        .where(eq(documents.parentDocumentId, parentDocumentId))
        .orderBy(desc(documents.version));

      const validItems = result
        .map((item) => validate(documentSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok(validItems);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find document versions", error),
      );
    }
  }

  async getStats(): Promise<Result<DocumentStats, RepositoryError>> {
    try {
      const [
        totalResult,
        sizeResult,
        typeResult,
        entityResult,
        recentResult,
        tagsResult,
      ] = await Promise.all([
        this.db.select({ count: count() }).from(documents),
        this.db
          .select({ totalSize: sql<number>`sum(${documents.size})` })
          .from(documents),
        this.db
          .select({
            mimeType: documents.mimeType,
            count: count(),
          })
          .from(documents)
          .groupBy(documents.mimeType),
        this.db
          .select({
            entityType: documents.entityType,
            count: count(),
          })
          .from(documents)
          .groupBy(documents.entityType),
        this.db
          .select()
          .from(documents)
          .orderBy(desc(documents.createdAt))
          .limit(5),
        this.db
          .select({
            tags: documents.tags,
          })
          .from(documents)
          .where(sql`jsonb_array_length(${documents.tags}) > 0`),
      ]);

      const totalDocuments = totalResult[0]?.count || 0;
      const totalSize = sizeResult[0]?.totalSize || 0;

      const documentsByType = typeResult.reduce(
        (acc, row) => {
          acc[row.mimeType] = row.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const documentsByEntity = entityResult.reduce(
        (acc, row) => {
          acc[row.entityType] = row.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const recentDocuments = recentResult
        .map((item) => validate(documentSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      // Process tags
      const tagCounts: Record<string, number> = {};
      tagsResult.forEach((row) => {
        if (Array.isArray(row.tags)) {
          row.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      const stats = {
        totalDocuments,
        totalSize,
        documentsByType,
        documentsByEntity,
        recentDocuments,
        popularTags,
      };

      return ok(stats);
    } catch (error) {
      return err(new RepositoryError("Failed to get document stats", error));
    }
  }

  async search(
    keyword: string,
    limit = 20,
  ): Promise<Result<Document[], RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(documents)
        .where(ilike(documents.originalFilename, `%${keyword}%`))
        .orderBy(desc(documents.createdAt))
        .limit(limit);

      const validItems = result
        .map((item) => validate(documentSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok(validItems);
    } catch (error) {
      return err(new RepositoryError("Failed to search documents", error));
    }
  }

  async updateVersion(
    id: string,
    version: number,
  ): Promise<Result<Document, RepositoryError>> {
    try {
      const result = await this.db
        .update(documents)
        .set({ version })
        .where(eq(documents.id, id))
        .returning();

      if (!Array.isArray(result) || result.length === 0) {
        return err(new RepositoryError("Document not found"));
      }

      const document = result[0];
      return validate(documentSchema, document).mapErr((error) => {
        return new RepositoryError("Invalid document data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to update document version", error),
      );
    }
  }

  async getPopularTags(
    limit = 10,
  ): Promise<Result<Array<{ tag: string; count: number }>, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          tags: documents.tags,
        })
        .from(documents)
        .where(sql`jsonb_array_length(${documents.tags}) > 0`);

      const tagCounts: Record<string, number> = {};
      result.forEach((row) => {
        if (Array.isArray(row.tags)) {
          row.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

      return ok(popularTags);
    } catch (error) {
      return err(new RepositoryError("Failed to get popular tags", error));
    }
  }
}
