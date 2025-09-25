import * as path from "node:path";
import { migrate as pgliteMigrate } from "drizzle-orm/pglite/migrator";
import type { Context } from "@/core/application/context";
import { DrizzlePgliteActivityRepository } from "./activityRepository";
import { DrizzlePgliteApprovalRepository } from "./approvalRepository";
import { DrizzlePgliteCampaignRepository } from "./campaignRepository";
import type { Database } from "./client";
import { getDatabase } from "./client";
import { DrizzlePgliteContactHistoryRepository } from "./contactHistoryRepository";
import { DrizzlePgliteContactRepository } from "./contactRepository";
import { DrizzlePgliteCustomerRepository } from "./customerRepository";
import { DrizzlePgliteDashboardRepository } from "./dashboardRepository";
import { DrizzlePgliteDealRepository } from "./dealRepository";
import { DrizzlePgliteDisplaySettingsRepository } from "./displaySettingsRepository";
import { DrizzlePgliteDocumentRepository } from "./documentRepository";
import { DrizzlePgliteEmailMarketingRepository } from "./emailMarketingRepository";
import { DrizzlePgliteImportExportRepository } from "./importExportRepository";
import { DrizzlePgliteImportExportService } from "./importExportService";
import { DrizzlePgliteIntegrationRepository } from "./integrationRepository";
import { DrizzlePgliteLeadRepository } from "./leadRepository";
import { DrizzlePgliteNotificationRepository } from "./notificationRepository";
import { DrizzlePgliteOrganizationRepository } from "./organizationRepository";
import { DrizzlePglitePermissionRepository } from "./permissionRepository";
import { DrizzlePgliteProposalRepository } from "./proposalRepository";
import { DrizzlePgliteReportRepository } from "./reportRepository";
import { DrizzlePgliteScoringRuleRepository } from "./scoringRuleRepository";
import { DrizzlePgliteScoringService } from "./scoringService";
import { DrizzlePgliteSecurityRepository } from "./securityRepository";
import { LocalStorageManager } from "./storageManager";
import { TestIntegrationService } from "./testIntegrationService";
import { DrizzlePgliteUserRepository } from "./userRepository";

// Cache for migrated database to improve performance
let cachedMemoryDb: Database | null = null;

export async function setupTestDatabase(): Promise<Database> {
  // Always use in-memory database for speed
  const db = await getDatabase("memory://");
  await pgliteMigrate(db, {
    migrationsFolder: path.join(__dirname, "migrations"),
  });
  return db;
}

export async function setupFreshTestDatabase(): Promise<Database> {
  // Always create a fresh database
  return setupTestDatabase();
}

/**
 * Get a shared, pre-migrated database for read-only tests
 * This significantly improves performance for tests that don't modify data
 */
export async function setupSharedTestDatabase(): Promise<Database> {
  // Return cached in-memory database
  if (!cachedMemoryDb) {
    cachedMemoryDb = await getDatabase("memory://");
    await pgliteMigrate(cachedMemoryDb, {
      migrationsFolder: path.join(__dirname, "migrations"),
    });
  }
  return cachedMemoryDb;
}

export function createTestContext(db: Database): Context {
  const context: Context = {
    activityRepository: new DrizzlePgliteActivityRepository(db),
    approvalRepository: new DrizzlePgliteApprovalRepository(db),
    campaignRepository: new DrizzlePgliteCampaignRepository(db),
    contactHistoryRepository: new DrizzlePgliteContactHistoryRepository(db),
    contactRepository: new DrizzlePgliteContactRepository(db),
    customerRepository: new DrizzlePgliteCustomerRepository(db),
    dashboardRepository: new DrizzlePgliteDashboardRepository(db),
    dealRepository: new DrizzlePgliteDealRepository(db),
    displaySettingsRepository: new DrizzlePgliteDisplaySettingsRepository(db),
    documentRepository: new DrizzlePgliteDocumentRepository(db),
    emailMarketingRepository: new DrizzlePgliteEmailMarketingRepository(db),
    importExportRepository: new DrizzlePgliteImportExportRepository(db),
    integrationRepository: new DrizzlePgliteIntegrationRepository(db),
    leadRepository: new DrizzlePgliteLeadRepository(db),
    notificationRepository: new DrizzlePgliteNotificationRepository(db),
    organizationRepository: new DrizzlePgliteOrganizationRepository(db),
    permissionRepository: new DrizzlePglitePermissionRepository(db),
    proposalRepository: new DrizzlePgliteProposalRepository(db),
    reportRepository: new DrizzlePgliteReportRepository(db),
    scoringRuleRepository: new DrizzlePgliteScoringRuleRepository(db),
    scoringService: new DrizzlePgliteScoringService(db),
    securityRepository: new DrizzlePgliteSecurityRepository(db),
    storageManager: new LocalStorageManager("/tmp/test-storage"),
    userRepository: new DrizzlePgliteUserRepository(db),
    // Initialize services that depend on context as placeholders initially
    importExportService: {} as DrizzlePgliteImportExportService,
    integrationService: {} as TestIntegrationService,
  };

  // Now create services that depend on the full context
  context.importExportService = new DrizzlePgliteImportExportService(context);
  context.integrationService = new TestIntegrationService();

  return context;
}

// Re-export test factories for convenience
export {
  createActivityTestData,
  createBatchTestData,
  createCustomerTestData,
  createDealTestData,
  createLeadTestData,
  createTestScenario,
  createUserTestData,
  seedTestData,
} from "./testFactories";

/**
 * Clean up test data from database
 */
export async function cleanupTestData(_context: Context): Promise<void> {
  // In-memory databases are automatically cleaned up via garbage collection
  // This function is kept for API compatibility
}

/**
 * Clean up all test databases (for use in test afterAll hooks)
 */
export async function cleanupAllTestDatabases(): Promise<void> {
  // Clear cached database to free memory
  cachedMemoryDb = null;
}

/**
 * Create a test context with pre-seeded data
 */
export async function createTestContextWithData(
  seedType?: "basic" | "sales" | "customer_management" | "lead_conversion",
): Promise<{ context: Context; seedData: unknown }> {
  // Use setupTestDatabase instead of setupFreshTestDatabase for better performance
  const db = await setupTestDatabase();
  const context = createTestContext(db);

  let seedData = null;
  if (seedType) {
    const { seedTestData, createTestScenario } = await import(
      "./testFactories"
    );
    if (seedType === "basic") {
      seedData = await seedTestData(context);
    } else {
      seedData = await createTestScenario(context, seedType);
    }
  }

  return { context, seedData };
}

/**
 * Helper to create test data with consistent timing
 */
export async function withTestTiming<T>(
  operation: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await operation();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Performance helper to measure test execution time
 */
export function measureTestPerformance(testName: string) {
  return {
    start: Date.now(),
    end: function (this: { start: number }) {
      const duration = Date.now() - this.start;
      console.log(`Test "${testName}" completed in ${duration}ms`);
      return duration;
    },
  };
}
