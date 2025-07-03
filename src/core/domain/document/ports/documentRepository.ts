import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateDocumentParams,
  Document,
  DocumentStats,
  DocumentWithRelations,
  ListDocumentsQuery,
  UpdateDocumentParams,
} from "../types";

export interface DocumentRepository {
  create(
    params: CreateDocumentParams,
  ): Promise<Result<Document, RepositoryError>>;

  findById(id: string): Promise<Result<Document | null, RepositoryError>>;

  findByIdWithRelations(
    id: string,
  ): Promise<Result<DocumentWithRelations | null, RepositoryError>>;

  list(
    query: ListDocumentsQuery,
  ): Promise<Result<{ items: Document[]; count: number }, RepositoryError>>;

  update(
    id: string,
    params: UpdateDocumentParams,
  ): Promise<Result<Document, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Result<Document[], RepositoryError>>;

  findByUploadedUser(
    userId: string,
  ): Promise<Result<Document[], RepositoryError>>;

  findByTags(tags: string[]): Promise<Result<Document[], RepositoryError>>;

  findVersions(
    parentDocumentId: string,
  ): Promise<Result<Document[], RepositoryError>>;

  getStats(): Promise<Result<DocumentStats, RepositoryError>>;

  search(
    keyword: string,
    limit?: number,
  ): Promise<Result<Document[], RepositoryError>>;

  updateVersion(
    id: string,
    version: number,
  ): Promise<Result<Document, RepositoryError>>;

  getPopularTags(
    limit?: number,
  ): Promise<Result<Array<{ tag: string; count: number }>, RepositoryError>>;
}
