import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateReportParams,
  FavoriteReport,
  GenerateReportQuery,
  ListFavoriteReportsQuery,
  ListReportsQuery,
  Report,
  ReportData,
  UpdateReportParams,
} from "../types";

export interface ReportRepository {
  create(params: CreateReportParams): Promise<Result<Report, RepositoryError>>;
  update(params: UpdateReportParams): Promise<Result<Report, RepositoryError>>;
  findById(id: string): Promise<Result<Report | null, RepositoryError>>;
  list(
    query: ListReportsQuery,
  ): Promise<Result<{ items: Report[]; count: number }, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;

  // レポートデータ生成
  generate(
    query: GenerateReportQuery,
  ): Promise<Result<ReportData, RepositoryError>>;

  // お気に入り機能
  addToFavorites(
    userId: string,
    reportId: string,
  ): Promise<Result<FavoriteReport, RepositoryError>>;
  removeFromFavorites(
    userId: string,
    reportId: string,
  ): Promise<Result<void, RepositoryError>>;
  listFavorites(
    query: ListFavoriteReportsQuery,
  ): Promise<Result<{ items: Report[]; count: number }, RepositoryError>>;
  isFavorite(
    userId: string,
    reportId: string,
  ): Promise<Result<boolean, RepositoryError>>;
}
