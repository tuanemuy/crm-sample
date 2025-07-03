import type { ActivityRepository } from "@/core/domain/activity/ports/activityRepository";
import type { ApprovalRepository } from "@/core/domain/approval/ports/approvalRepository";
import type { CampaignRepository } from "@/core/domain/campaign/ports/campaignRepository";
import type { ContactRepository } from "@/core/domain/contact/ports/contactRepository";
import type { ContactHistoryRepository } from "@/core/domain/contactHistory/ports/contactHistoryRepository";
import type { CustomerRepository } from "@/core/domain/customer/ports/customerRepository";
import type { DashboardRepository } from "@/core/domain/dashboard/ports/dashboardRepository";
import type { ImportExportRepository } from "@/core/domain/dataImportExport/ports/importExportRepository";
import type { ImportExportService } from "@/core/domain/dataImportExport/ports/importExportService";
import type { DealRepository } from "@/core/domain/deal/ports/dealRepository";
import type { DisplaySettingsRepository } from "@/core/domain/displaySettings/ports/displaySettingsRepository";
import type { DocumentRepository } from "@/core/domain/document/ports/documentRepository";
import type { StorageManager } from "@/core/domain/document/ports/storageManager";
import type { EmailMarketingRepository } from "@/core/domain/emailMarketing/ports/emailMarketingRepository";
import type { IntegrationRepository } from "@/core/domain/integration/ports/integrationRepository";
import type { IntegrationService } from "@/core/domain/integration/ports/integrationService";
import type { LeadRepository } from "@/core/domain/lead/ports/leadRepository";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type { OrganizationRepository } from "@/core/domain/organization/ports/organizationRepository";
import type { PermissionRepository } from "@/core/domain/permission/ports/permissionRepository";
import type { ProposalRepository } from "@/core/domain/proposal/ports/proposalRepository";
import type { ReportRepository } from "@/core/domain/report/ports/reportRepository";
import type {
  ScoringRuleRepository,
  ScoringService,
} from "@/core/domain/scoringRule/ports/scoringRuleRepository";
import type { SecurityRepository } from "@/core/domain/security/ports/securityRepository";
import type { UserRepository } from "@/core/domain/user/ports/userRepository";

export interface Context {
  customerRepository: CustomerRepository;
  contactRepository: ContactRepository;
  contactHistoryRepository: ContactHistoryRepository;
  leadRepository: LeadRepository;
  dealRepository: DealRepository;
  activityRepository: ActivityRepository;
  userRepository: UserRepository;
  notificationRepository: NotificationRepository;
  organizationRepository: OrganizationRepository;
  permissionRepository: PermissionRepository;
  proposalRepository: ProposalRepository;
  reportRepository: ReportRepository;
  scoringRuleRepository: ScoringRuleRepository;
  scoringService: ScoringService;
  documentRepository: DocumentRepository;
  storageManager: StorageManager;
  campaignRepository: CampaignRepository;
  emailMarketingRepository: EmailMarketingRepository;
  approvalRepository: ApprovalRepository;
  securityRepository: SecurityRepository;
  displaySettingsRepository: DisplaySettingsRepository;
  dashboardRepository: DashboardRepository;
  integrationRepository: IntegrationRepository;
  integrationService: IntegrationService;
  importExportRepository: ImportExportRepository;
  importExportService: ImportExportService;
}
