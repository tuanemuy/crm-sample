import { z } from "zod/v4";
import { DrizzlePgliteActivityRepository } from "@/core/adapters/drizzlePglite/activityRepository";
import { DrizzlePgliteApprovalRepository } from "@/core/adapters/drizzlePglite/approvalRepository";
import { DrizzlePgliteCampaignRepository } from "@/core/adapters/drizzlePglite/campaignRepository";
import {
  type Database,
  getDatabase,
} from "@/core/adapters/drizzlePglite/client";
import { DrizzlePgliteContactHistoryRepository } from "@/core/adapters/drizzlePglite/contactHistoryRepository";
import { DrizzlePgliteContactRepository } from "@/core/adapters/drizzlePglite/contactRepository";
import { DrizzlePgliteCustomerRepository } from "@/core/adapters/drizzlePglite/customerRepository";
import { DrizzlePgliteDashboardRepository } from "@/core/adapters/drizzlePglite/dashboardRepository";
import { DrizzlePgliteDealRepository } from "@/core/adapters/drizzlePglite/dealRepository";
import { DrizzlePgliteDisplaySettingsRepository } from "@/core/adapters/drizzlePglite/displaySettingsRepository";
import { DrizzlePgliteDocumentRepository } from "@/core/adapters/drizzlePglite/documentRepository";
import { DrizzlePgliteEmailMarketingRepository } from "@/core/adapters/drizzlePglite/emailMarketingRepository";
import { DrizzlePgliteImportExportRepository } from "@/core/adapters/drizzlePglite/importExportRepository";
import { DrizzlePgliteImportExportService } from "@/core/adapters/drizzlePglite/importExportService";
import { DrizzlePgliteIntegrationRepository } from "@/core/adapters/drizzlePglite/integrationRepository";
import { DrizzlePgliteIntegrationService } from "@/core/adapters/drizzlePglite/integrationService";
import { DrizzlePgliteLeadRepository } from "@/core/adapters/drizzlePglite/leadRepository";
import { DrizzlePgliteNotificationRepository } from "@/core/adapters/drizzlePglite/notificationRepository";
import { DrizzlePgliteOrganizationRepository } from "@/core/adapters/drizzlePglite/organizationRepository";
import { DrizzlePglitePermissionRepository } from "@/core/adapters/drizzlePglite/permissionRepository";
import { DrizzlePgliteProposalRepository } from "@/core/adapters/drizzlePglite/proposalRepository";
import { DrizzlePgliteReportRepository } from "@/core/adapters/drizzlePglite/reportRepository";
import { DrizzlePgliteScoringRuleRepository } from "@/core/adapters/drizzlePglite/scoringRuleRepository";
import { DrizzlePgliteScoringService } from "@/core/adapters/drizzlePglite/scoringService";
import { DrizzlePgliteSecurityRepository } from "@/core/adapters/drizzlePglite/securityRepository";
import { LocalStorageManager } from "@/core/adapters/drizzlePglite/storageManager";
import { DrizzlePgliteUserRepository } from "@/core/adapters/drizzlePglite/userRepository";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  DATABASE_DIRECTORY: z.string().default("./data/crm.db"),
  UPLOAD_DIR: z.string().default("./uploads"),
  FILES_BASE_URL: z.string().default("/api/files"),
});

export type Env = z.infer<typeof envSchema>;
export type { Database };

export async function createContext(env?: Partial<Env>): Promise<Context> {
  const parsedEnv = envSchema.parse({
    DATABASE_DIRECTORY:
      env?.DATABASE_DIRECTORY ||
      process.env.DATABASE_DIRECTORY ||
      "./data/crm.db",
    UPLOAD_DIR: env?.UPLOAD_DIR || process.env.UPLOAD_DIR || "./uploads",
    FILES_BASE_URL:
      env?.FILES_BASE_URL || process.env.FILES_BASE_URL || "/api/files",
  });

  const db = await getDatabase(parsedEnv.DATABASE_DIRECTORY);

  // Create the context object first
  const context: Context = {
    customerRepository: new DrizzlePgliteCustomerRepository(db),
    contactRepository: new DrizzlePgliteContactRepository(db),
    contactHistoryRepository: new DrizzlePgliteContactHistoryRepository(db),
    leadRepository: new DrizzlePgliteLeadRepository(db),
    dealRepository: new DrizzlePgliteDealRepository(db),
    activityRepository: new DrizzlePgliteActivityRepository(db),
    userRepository: new DrizzlePgliteUserRepository(db),
    notificationRepository: new DrizzlePgliteNotificationRepository(db),
    organizationRepository: new DrizzlePgliteOrganizationRepository(db),
    permissionRepository: new DrizzlePglitePermissionRepository(db),
    proposalRepository: new DrizzlePgliteProposalRepository(db),
    reportRepository: new DrizzlePgliteReportRepository(db),
    scoringRuleRepository: new DrizzlePgliteScoringRuleRepository(db),
    scoringService: new DrizzlePgliteScoringService(db),
    documentRepository: new DrizzlePgliteDocumentRepository(db),
    campaignRepository: new DrizzlePgliteCampaignRepository(db),
    emailMarketingRepository: new DrizzlePgliteEmailMarketingRepository(db),
    approvalRepository: new DrizzlePgliteApprovalRepository(db),
    securityRepository: new DrizzlePgliteSecurityRepository(db),
    displaySettingsRepository: new DrizzlePgliteDisplaySettingsRepository(db),
    dashboardRepository: new DrizzlePgliteDashboardRepository(db),
    integrationRepository: new DrizzlePgliteIntegrationRepository(db),
    integrationService: new DrizzlePgliteIntegrationService(),
    importExportRepository: new DrizzlePgliteImportExportRepository(db),
    importExportService: null as unknown as DrizzlePgliteImportExportService, // Will be set below
    storageManager: new LocalStorageManager(
      parsedEnv.UPLOAD_DIR,
      parsedEnv.FILES_BASE_URL,
    ),
  };

  // Set the import export service with the context
  context.importExportService = new DrizzlePgliteImportExportService(context);

  return context;
}

// Context will be initialized asynchronously when needed
export let context: Context | null = null;

export async function getContext(): Promise<Context> {
  if (!context) {
    context = await createContext();
  }
  return context;
}
