import { v7 as uuidv7 } from "uuid";
import type { Context } from "@/core/application/context";
import type { CreateActivityInput } from "@/core/domain/activity/types";
import type { CreateContactInput } from "@/core/domain/contact/types";
import type {
  CreateCustomerInput,
  CreateCustomerParams,
} from "@/core/domain/customer/types";
import type {
  CreateDealInput,
  CreateDealParams,
} from "@/core/domain/deal/types";
import type { CreateLeadInput } from "@/core/domain/lead/types";
import type { CreateUserInput } from "@/core/domain/user/types";

export interface TestFactoryOptions {
  overrides?: Record<string, any>;
  context?: Context;
}

/**
 * User test data factory
 */
export function createUserTestData(
  options: TestFactoryOptions = {},
): CreateUserInput {
  const defaults: CreateUserInput = {
    name: "Test User",
    email: `test-${uuidv7()}@example.com`,
    password: "password123",
    role: "user",
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Customer test data factory
 */
export function createCustomerTestData(
  options: TestFactoryOptions = {},
): CreateCustomerInput {
  const randomId = Math.random().toString(36).substring(2, 10);
  const defaults: CreateCustomerInput = {
    name: `Test Customer ${randomId}`,
    industry: "Technology",
    size: "medium",
    location: "Tokyo, Japan",
    description: "Test customer for automated testing",
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Lead test data factory
 */
export function createLeadTestData(
  options: TestFactoryOptions = {},
): CreateLeadInput {
  const defaults: CreateLeadInput = {
    firstName: "John",
    lastName: "Prospect",
    email: `lead-${uuidv7()}@example.com`,
    phone: "123-456-7890",
    company: "Prospect Corp",
    title: "Manager",
    source: "website",
    tags: ["test-lead"],
    notes: "Test lead for automated testing",
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Contact test data factory
 */
export function createContactTestData(
  options: TestFactoryOptions = {},
): CreateContactInput {
  const defaults: CreateContactInput = {
    customerId: "", // Must be overridden
    name: "Test Contact",
    title: "Manager",
    department: "Sales",
    email: `contact-${uuidv7()}@example.com`,
    phone: "123-456-7890",
    mobile: "098-765-4321",
    isPrimary: false,
    isActive: true,
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Deal test data factory - for application service input
 */
export function createDealTestData(
  options: TestFactoryOptions = {},
): CreateDealInput {
  const defaults: CreateDealInput = {
    title: "Test Deal",
    amount: "10000.00",
    stage: "qualification",
    probability: 50,
    description: "Test deal for automated testing",
    competitors: [],
    customerId: "", // Must be overridden
    assignedUserId: "", // Must be overridden
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Deal repository test data factory - for direct repository calls
 */
export function createDealRepositoryTestData(
  options: TestFactoryOptions = {},
): CreateDealParams {
  const defaults: CreateDealParams = {
    title: "Test Deal",
    amount: "10000.00",
    stage: "qualification",
    probability: 50,
    description: "Test deal for automated testing",
    competitors: [],
    customerId: "", // Must be overridden
    assignedUserId: "", // Must be overridden
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Customer repository test data factory - for direct repository calls
 */
export function createCustomerRepositoryTestData(
  options: TestFactoryOptions = {},
): CreateCustomerParams {
  const randomId = Math.random().toString(36).substring(2, 10);
  const defaults: CreateCustomerParams = {
    name: `Test Customer ${randomId}`,
    industry: "Technology",
    size: "medium",
    location: "Tokyo, Japan",
    description: "Test customer for automated testing",
    status: "active",
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Activity test data factory
 */
export function createActivityTestData(
  options: TestFactoryOptions = {},
): CreateActivityInput {
  const defaults: CreateActivityInput = {
    type: "email",
    subject: "Test Activity",
    description: "Test activity for automated testing",
    priority: "medium",
    assignedUserId: "", // Must be overridden
    scheduledAt: new Date(),
  };

  return {
    ...defaults,
    ...options.overrides,
  };
}

/**
 * Convenience function to create a won deal for testing
 */
export function createWonDealTestData(
  options: TestFactoryOptions = {},
): CreateDealParams {
  return createDealRepositoryTestData({
    ...options,
    overrides: {
      stage: "closed_won",
      probability: 100,
      ...options.overrides,
    },
  });
}

/**
 * Convenience function to create a lost deal for testing
 */
export function createLostDealTestData(
  options: TestFactoryOptions = {},
): CreateDealParams {
  return createDealRepositoryTestData({
    ...options,
    overrides: {
      stage: "closed_lost",
      probability: 0,
      ...options.overrides,
    },
  });
}

/**
 * Seed database with test data
 */
export async function seedTestData(context: Context) {
  // Create test users with unique emails to avoid conflicts
  const salesUser = await context.userRepository.create({
    name: "Sales User",
    email: `sales-${uuidv7()}@test.com`,
    role: "user",
    isActive: true,
    passwordHash: "hash",
  });

  const manager = await context.userRepository.create({
    name: "Manager User",
    email: `manager-${uuidv7()}@test.com`,
    role: "manager",
    isActive: true,
    passwordHash: "hash",
  });

  if (salesUser.isErr() || manager.isErr()) {
    throw new Error("Failed to create test users");
  }

  // Create test customers with unique names to avoid conflicts
  const randomId1 = Math.random().toString(36).substring(2, 10);
  const randomId2 = Math.random().toString(36).substring(2, 10);
  const customers = await Promise.all([
    context.customerRepository.create({
      name: `Enterprise Corp ${randomId1}`,
      industry: "Technology",
      size: "large",
      status: "active",
      assignedUserId: salesUser._unsafeUnwrap().id,
    }),
    context.customerRepository.create({
      name: `Small Business ${randomId2}`,
      industry: "Healthcare",
      size: "small",
      status: "active",
      assignedUserId: salesUser._unsafeUnwrap().id,
    }),
  ]);

  if (customers.some((c) => c.isErr())) {
    throw new Error("Failed to create test customers");
  }

  return {
    users: {
      salesUser: salesUser._unsafeUnwrap(),
      manager: manager._unsafeUnwrap(),
    },
    customers: customers.map((c) => c._unsafeUnwrap()),
  };
}

/**
 * Helper function to create test entities in a consistent way
 */
export async function createTestEntities(context: Context) {
  // Create a test user
  const userData = createUserTestData();
  const userResult = await context.userRepository.create({
    ...userData,
    passwordHash: "hash",
    isActive: true,
  });
  if (userResult.isErr()) {
    throw new Error("Failed to create test user");
  }

  // Create a test customer
  const customerData = createCustomerRepositoryTestData();
  const customerResult = await context.customerRepository.create(customerData);
  if (customerResult.isErr()) {
    throw new Error("Failed to create test customer");
  }

  return {
    user: userResult._unsafeUnwrap(),
    customer: customerResult._unsafeUnwrap(),
  };
}

/**
 * Create a complete test scenario with related entities
 */
export async function createTestScenario(
  context: Context,
  scenarioType: "sales" | "customer_management" | "lead_conversion",
) {
  const seedData = await seedTestData(context);

  switch (scenarioType) {
    case "sales":
      return await createSalesScenario(context, seedData);
    case "customer_management":
      return await createCustomerManagementScenario(context, seedData);
    case "lead_conversion":
      return await createLeadConversionScenario(context, seedData);
    default:
      throw new Error(`Unknown scenario type: ${scenarioType}`);
  }
}

async function createSalesScenario(context: Context, seedData: any) {
  const { users, customers } = seedData;

  // Create deals with unique titles to avoid conflicts
  const randomId1 = Math.random().toString(36).substring(2, 10);
  const randomId2 = Math.random().toString(36).substring(2, 10);
  const deals = await Promise.all([
    context.dealRepository.create({
      title: `Enterprise Software License ${randomId1}`,
      amount: "50000.00",
      stage: "qualification",
      probability: 70,
      customerId: customers[0].id,
      assignedUserId: users.salesUser.id,
      competitors: ["CompetitorA", "CompetitorB"],
    }),
    context.dealRepository.create({
      title: `Small Business Package ${randomId2}`,
      amount: "5000.00",
      stage: "proposal",
      probability: 85,
      customerId: customers[1].id,
      assignedUserId: users.salesUser.id,
      competitors: [],
    }),
  ]);

  if (deals.some((d) => d.isErr())) {
    throw new Error("Failed to create test deals");
  }

  return {
    ...seedData,
    deals: deals.map((d) => d._unsafeUnwrap()),
  };
}

async function createCustomerManagementScenario(
  _context: Context,
  seedData: any,
) {
  // Add customer-specific test data
  return {
    ...seedData,
    // Add more customer-related test data as needed
  };
}

async function createLeadConversionScenario(context: Context, seedData: any) {
  const { users } = seedData;

  // Create leads with unique emails to avoid conflicts
  const leads = await Promise.all([
    context.leadRepository.create({
      firstName: "Jane",
      lastName: "Prospect",
      email: `jane-${uuidv7()}@prospect.com`,
      phone: "123-456-7890",
      company: "Prospect Industries",
      title: "CEO",
      source: "website",
      status: "qualified",
      score: 85,
      assignedUserId: users.salesUser.id,
      tags: ["enterprise", "high-value"],
    }),
    context.leadRepository.create({
      firstName: "Bob",
      lastName: "SmallBiz",
      email: `bob-${uuidv7()}@smallbiz.com`,
      phone: "098-765-4321",
      company: "Small Business Inc",
      title: "Owner",
      source: "referral",
      status: "new",
      score: 60,
      assignedUserId: users.salesUser.id,
      tags: ["small-business"],
    }),
  ]);

  if (leads.some((l) => l.isErr())) {
    throw new Error("Failed to create test leads");
  }

  return {
    ...seedData,
    leads: leads.map((l) => l._unsafeUnwrap()),
  };
}

/**
 * Batch create entities for performance testing
 */
export async function createBatchTestData(
  context: Context,
  counts: {
    users?: number;
    customers?: number;
    leads?: number;
    deals?: number;
    activities?: number;
  },
) {
  const results = {
    users: [] as any[],
    customers: [] as any[],
    leads: [] as any[],
    deals: [] as any[],
    activities: [] as any[],
  };

  // Create users first (needed for other entities)
  if (counts.users) {
    for (let i = 0; i < counts.users; i++) {
      const userData = createUserTestData({
        overrides: {
          name: `User ${i + 1}`,
          email: `user${i + 1}@test.com`,
        },
      });
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      if (userResult.isOk()) {
        results.users.push(userResult.value);
      }
    }
  }

  // Create customers
  if (counts.customers && results.users.length > 0) {
    for (let i = 0; i < counts.customers; i++) {
      const customerData = createCustomerTestData({
        overrides: {
          name: `Customer ${i + 1}`,
          assignedUserId: results.users[i % results.users.length].id,
        },
      });
      const customerResult = await context.customerRepository.create({
        ...customerData,
        status: "active",
      });
      if (customerResult.isOk()) {
        results.customers.push(customerResult.value);
      }
    }
  }

  // Create leads
  if (counts.leads && results.users.length > 0) {
    for (let i = 0; i < counts.leads; i++) {
      const leadData = createLeadTestData({
        overrides: {
          firstName: `Lead${i + 1}`,
          lastName: "Prospect",
          email: `lead${i + 1}@test.com`,
          assignedUserId: results.users[i % results.users.length].id,
        },
      });
      const leadResult = await context.leadRepository.create({
        ...leadData,
        status: "new",
        score: 50 + (i % 50),
      });
      if (leadResult.isOk()) {
        results.leads.push(leadResult.value);
      }
    }
  }

  // Create deals
  if (
    counts.deals &&
    results.customers.length > 0 &&
    results.users.length > 0
  ) {
    for (let i = 0; i < counts.deals; i++) {
      const dealData = createDealTestData({
        overrides: {
          title: `Deal ${i + 1}`,
          amount: `${(i + 1) * 1000}.00`,
          customerId: results.customers[i % results.customers.length].id,
          assignedUserId: results.users[i % results.users.length].id,
        },
      });
      const dealResult = await context.dealRepository.create(dealData);
      if (dealResult.isOk()) {
        results.deals.push(dealResult.value);
      }
    }
  }

  return results;
}
