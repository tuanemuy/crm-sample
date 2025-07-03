import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateDisplaySettingsParams,
  DisplaySettings,
  GetDisplaySettingsQuery,
  UpdateDisplaySettingsParams,
} from "../types";

export interface DisplaySettingsRepository {
  create(
    params: CreateDisplaySettingsParams,
  ): Promise<Result<DisplaySettings, RepositoryError>>;
  findByUserId(
    query: GetDisplaySettingsQuery,
  ): Promise<Result<DisplaySettings | null, RepositoryError>>;
  update(
    id: string,
    params: UpdateDisplaySettingsParams,
  ): Promise<Result<DisplaySettings, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
