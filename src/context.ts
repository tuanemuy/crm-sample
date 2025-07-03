import { z } from "zod/v4";
import { DrizzlePqliteActivityRepository } from "@/core/adapters/drizzlePqlite/activityRepository";
import { DrizzlePgliteApprovalRepository } from "@/core/adapters/drizzlePqlite/approvalRepository";
import { DrizzlePgliteCampaignRepository } from "@/core/adapters/drizzlePqlite/campaignRepository";
import {
  type Database,
  getDatabase,
} from "@/core/adapters/drizzlePqlite/client";
import { DrizzlePqliteContactHistoryRepository } from "@/core/adapters/drizzlePqlite/contactHistoryRepository";
import { DrizzlePqliteContactRepository } from "@/core/adapters/drizzlePqlite/contactRepository";
import { DrizzlePqliteCustomerRepository } from "@/core/adapters/drizzlePqlite/customerRepository";
import { DrizzlePqliteDashboardRepository } from "@/core/adapters/drizzlePqlite/dashboardRepository";
import { DrizzlePqliteDealRepository } from "@/core/adapters/drizzlePqlite/dealRepository";
import { DrizzlePqliteDisplaySettingsRepository } from "@/core/adapters/drizzlePqlite/displaySettingsRepository";
import { DrizzlePqliteDocumentRepository } from "@/core/adapters/drizzlePqlite/documentRepository";
import { DrizzlePgliteEmailMarketingRepository } from "@/core/adapters/drizzlePqlite/emailMarketingRepository";
import { DrizzlePqliteImportExportRepository } from "@/core/adapters/drizzlePqlite/importExportRepository";
import { DrizzlePqliteImportExportService } from "@/core/adapters/drizzlePqlite/importExportService";
import { DrizzlePqliteIntegrationRepository } from "@/core/adapters/drizzlePqlite/integrationRepository";
import { DrizzlePqliteIntegrationService } from "@/core/adapters/drizzlePqlite/integrationService";
import { DrizzlePqliteLeadRepository } from "@/core/adapters/drizzlePqlite/leadRepository";
import { DrizzlePqliteNotificationRepository } from "@/core/adapters/drizzlePqlite/notificationRepository";
import { DrizzlePqliteOrganizationRepository } from "@/core/adapters/drizzlePqlite/organizationRepository";
import { DrizzlePqlitePermissionRepository } from "@/core/adapters/drizzlePqlite/permissionRepository";
import { DrizzlePqliteProposalRepository } from "@/core/adapters/drizzlePqlite/proposalRepository";
import { DrizzlePqliteReportRepository } from "@/core/adapters/drizzlePqlite/reportRepository";
import { DrizzlePqliteScoringRuleRepository } from "@/core/adapters/drizzlePqlite/scoringRuleRepository";
import { DrizzlePqliteScoringService } from "@/core/adapters/drizzlePqlite/scoringService";
import { DrizzlePgliteSecurityRepository } from "@/core/adapters/drizzlePqlite/securityRepository";
import { LocalStorageManager } from "@/core/adapters/drizzlePqlite/storageManager";
import { DrizzlePqliteUserRepository } from "@/core/adapters/drizzlePqlite/userRepository";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  DATABASE_DIRECTORY: z.string().default("./data/crm.db"),
  UPLOAD_DIR: z.string().default("./uploads"),
  FILES_BASE_URL: z.string().default("/api/files"),
});

export type Env = z.infer<typeof envSchema>;
export type { Database };

export function createContext(env?: Partial<Env>): Context {
  const parsedEnv = envSchema.parse({
    DATABASE_DIRECTORY:
      env?.DATABASE_DIRECTORY ||
      process.env.DATABASE_DIRECTORY ||
      "./data/crm.db",
    UPLOAD_DIR: env?.UPLOAD_DIR || process.env.UPLOAD_DIR || "./uploads",
    FILES_BASE_URL:
      env?.FILES_BASE_URL || process.env.FILES_BASE_URL || "/api/files",
  });

  const db = getDatabase(parsedEnv.DATABASE_DIRECTORY);

  return {
    customerRepository: new DrizzlePqliteCustomerRepository(db),
    contactRepository: new DrizzlePqliteContactRepository(db),
    contactHistoryRepository: new DrizzlePqliteContactHistoryRepository(db),
    leadRepository: new DrizzlePqliteLeadRepository(db),
    dealRepository: new DrizzlePqliteDealRepository(db),
    activityRepository: new DrizzlePqliteActivityRepository(db),
    userRepository: new DrizzlePqliteUserRepository(db),
    notificationRepository: new DrizzlePqliteNotificationRepository(db),
    organizationRepository: new DrizzlePqliteOrganizationRepository(db),
    permissionRepository: new DrizzlePqlitePermissionRepository(db),
    proposalRepository: new DrizzlePqliteProposalRepository(db),
    reportRepository: new DrizzlePqliteReportRepository(db),
    scoringRuleRepository: new DrizzlePqliteScoringRuleRepository(db),
    scoringService: new DrizzlePqliteScoringService(db),
    documentRepository: new DrizzlePqliteDocumentRepository(db),
    campaignRepository: new DrizzlePgliteCampaignRepository(db),
    emailMarketingRepository: new DrizzlePgliteEmailMarketingRepository(db),
    approvalRepository: new DrizzlePgliteApprovalRepository(db),
    securityRepository: new DrizzlePgliteSecurityRepository(db),
    displaySettingsRepository: new DrizzlePqliteDisplaySettingsRepository(db),
    dashboardRepository: new DrizzlePqliteDashboardRepository(db),
    integrationRepository: new DrizzlePqliteIntegrationRepository(db),
    integrationService: new DrizzlePqliteIntegrationService(),
    importExportRepository: new DrizzlePqliteImportExportRepository(db),
    importExportService: new DrizzlePqliteImportExportService(),
    storageManager: new LocalStorageManager(
      parsedEnv.UPLOAD_DIR,
      parsedEnv.FILES_BASE_URL,
    ),
  };
}

export const context = createContext();
