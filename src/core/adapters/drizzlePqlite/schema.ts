import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

// Users table
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: text("email").unique().notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"), // admin, manager, user
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

// Customers table (companies)
export const customers = pgTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    industry: text("industry"),
    size: text("size"), // small, medium, large, enterprise
    location: text("location"),
    foundedYear: integer("founded_year"),
    website: text("website"),
    description: text("description"),
    status: text("status").notNull().default("active"), // active, inactive, archived
    parentCustomerId: text("parent_customer_id"),
    assignedUserId: text("assigned_user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("customers_name_idx").on(table.name),
    industryIdx: index("customers_industry_idx").on(table.industry),
    assignedUserIdx: index("customers_assigned_user_idx").on(
      table.assignedUserId,
    ),
  }),
);

// Contacts table (customer contact persons)
export const contacts = pgTable(
  "contacts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    customerId: text("customer_id")
      .references(() => customers.id)
      .notNull(),
    name: text("name").notNull(),
    title: text("title"),
    department: text("department"),
    email: text("email"),
    phone: text("phone"),
    mobile: text("mobile"),
    isPrimary: boolean("is_primary").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    customerIdx: index("contacts_customer_idx").on(table.customerId),
    emailIdx: index("contacts_email_idx").on(table.email),
  }),
);

// Leads table
export const leads = pgTable(
  "leads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    title: text("title"),
    industry: text("industry"),
    source: text("source"), // website, event, referral, social_media, etc.
    status: text("status").notNull().default("new"), // new, contacted, qualified, converted, rejected
    score: integer("score").notNull().default(0),
    tags: jsonb("tags").default([]),
    notes: text("notes"),
    assignedUserId: text("assigned_user_id").references(() => users.id),
    convertedCustomerId: text("converted_customer_id").references(
      () => customers.id,
    ),
    convertedAt: timestamp("converted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index("leads_email_idx").on(table.email),
    companyIdx: index("leads_company_idx").on(table.company),
    statusIdx: index("leads_status_idx").on(table.status),
    assignedUserIdx: index("leads_assigned_user_idx").on(table.assignedUserId),
    scoreIdx: index("leads_score_idx").on(table.score),
  }),
);

// Deals table
export const deals = pgTable(
  "deals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    title: text("title").notNull(),
    customerId: text("customer_id")
      .references(() => customers.id)
      .notNull(),
    contactId: text("contact_id").references(() => contacts.id),
    stage: text("stage").notNull().default("prospecting"), // prospecting, qualification, proposal, negotiation, closed_won, closed_lost
    amount: decimal("amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    probability: integer("probability").notNull().default(0), // 0-100
    expectedCloseDate: timestamp("expected_close_date"),
    actualCloseDate: timestamp("actual_close_date"),
    description: text("description"),
    competitors: jsonb("competitors").default([]),
    assignedUserId: text("assigned_user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    customerIdx: index("deals_customer_idx").on(table.customerId),
    stageIdx: index("deals_stage_idx").on(table.stage),
    assignedUserIdx: index("deals_assigned_user_idx").on(table.assignedUserId),
    expectedCloseDateIdx: index("deals_expected_close_date_idx").on(
      table.expectedCloseDate,
    ),
  }),
);

// Activities table
export const activities = pgTable(
  "activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    type: text("type").notNull(), // call, email, meeting, task, note
    subject: text("subject").notNull(),
    description: text("description"),
    status: text("status").notNull().default("planned"), // planned, in_progress, completed, cancelled
    priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
    scheduledAt: timestamp("scheduled_at"),
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    duration: integer("duration"), // in minutes
    customerId: text("customer_id").references(() => customers.id),
    contactId: text("contact_id").references(() => contacts.id),
    dealId: text("deal_id").references(() => deals.id),
    leadId: text("lead_id").references(() => leads.id),
    assignedUserId: text("assigned_user_id")
      .references(() => users.id)
      .notNull(),
    createdByUserId: text("created_by_user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    typeIdx: index("activities_type_idx").on(table.type),
    statusIdx: index("activities_status_idx").on(table.status),
    scheduledAtIdx: index("activities_scheduled_at_idx").on(table.scheduledAt),
    dueDateIdx: index("activities_due_date_idx").on(table.dueDate),
    assignedUserIdx: index("activities_assigned_user_idx").on(
      table.assignedUserId,
    ),
    customerIdx: index("activities_customer_idx").on(table.customerId),
    dealIdx: index("activities_deal_idx").on(table.dealId),
  }),
);

// Scoring Rules table
export const scoringRules = pgTable(
  "scoring_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    condition: jsonb("condition").notNull(), // JSON rule condition
    score: integer("score").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    priority: integer("priority").notNull().default(100),
    createdByUserId: text("created_by_user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("scoring_rules_name_idx").on(table.name),
    isActiveIdx: index("scoring_rules_is_active_idx").on(table.isActive),
  }),
);

// Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    type: text("type").notNull(), // reminder, alert, info, success, warning, error
    title: text("title").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata").default({}),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

// Notification settings table
export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull()
      .unique(),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    pushNotifications: boolean("push_notifications").notNull().default(true),
    reminderNotifications: boolean("reminder_notifications")
      .notNull()
      .default(true),
    dealNotifications: boolean("deal_notifications").notNull().default(true),
    activityNotifications: boolean("activity_notifications")
      .notNull()
      .default(true),
    leadNotifications: boolean("lead_notifications").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("notification_settings_user_idx").on(table.userId),
  }),
);

// Documents table
export const documents = pgTable(
  "documents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    filename: text("filename").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    tags: jsonb("tags").default([]),
    entityType: text("entity_type").notNull(), // customer, contact, deal, lead, activity, general
    entityId: text("entity_id"), // references the related entity
    uploadedBy: text("uploaded_by")
      .references(() => users.id)
      .notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    version: integer("version").notNull().default(1),
    parentDocumentId: text("parent_document_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    filenameIdx: index("documents_filename_idx").on(table.filename),
    entityIdx: index("documents_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    uploadedByIdx: index("documents_uploaded_by_idx").on(table.uploadedBy),
    tagsIdx: index("documents_tags_idx").on(table.tags),
  }),
);

// Reports table for custom reports
export const reports = pgTable(
  "reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull(), // sales_performance, sales_activity, customer_analysis, roi_analysis, lead_conversion, deal_pipeline, user_activity, custom
    category: text("category").notNull(), // sales, marketing, customer, activity, analytics
    config: jsonb("config").default({}), // Report configuration
    isTemplate: boolean("is_template").notNull().default(false),
    isPublic: boolean("is_public").notNull().default(false),
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("reports_name_idx").on(table.name),
    typeIdx: index("reports_type_idx").on(table.type),
    categoryIdx: index("reports_category_idx").on(table.category),
    createdByIdx: index("reports_created_by_idx").on(table.createdBy),
  }),
);

// Favorite Reports table
export const favoriteReports = pgTable(
  "favorite_reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    reportId: text("report_id")
      .references(() => reports.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userReportIdx: index("favorite_reports_user_report_idx").on(
      table.userId,
      table.reportId,
    ),
    userIdx: index("favorite_reports_user_idx").on(table.userId),
  }),
);

// Contact History table (for tracking customer interactions)
export const contactHistory = pgTable(
  "contact_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    customerId: text("customer_id")
      .references(() => customers.id)
      .notNull(),
    contactId: text("contact_id").references(() => contacts.id),
    type: text("type").notNull(), // call, email, meeting, note
    subject: text("subject").notNull(),
    content: text("content"),
    direction: text("direction"), // inbound, outbound
    status: text("status"), // completed, attempted, failed
    duration: integer("duration"), // in minutes
    contactedByUserId: text("contacted_by_user_id")
      .references(() => users.id)
      .notNull(),
    contactedAt: timestamp("contacted_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    customerIdx: index("contact_history_customer_idx").on(table.customerId),
    typeIdx: index("contact_history_type_idx").on(table.type),
    contactedAtIdx: index("contact_history_contacted_at_idx").on(
      table.contactedAt,
    ),
  }),
);

// Lead Behavior table (for tracking lead activities)
export const leadBehavior = pgTable(
  "lead_behavior",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    type: text("type").notNull(), // page_view, form_submit, email_open, email_click, download
    action: text("action").notNull(),
    metadata: jsonb("metadata").default({}),
    score: integer("score").default(0),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    leadIdx: index("lead_behavior_lead_idx").on(table.leadId),
    typeIdx: index("lead_behavior_type_idx").on(table.type),
    occurredAtIdx: index("lead_behavior_occurred_at_idx").on(table.occurredAt),
  }),
);

// Settings table for system configurations
export const settings = pgTable(
  "settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    key: text("key").unique().notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    category: text("category").notNull().default("general"),
    isPublic: boolean("is_public").notNull().default(false),
    updatedByUserId: text("updated_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    keyIdx: index("settings_key_idx").on(table.key),
    categoryIdx: index("settings_category_idx").on(table.category),
  }),
);

// Permissions table
export const permissions = pgTable(
  "permissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    resource: text("resource").notNull(), // users, leads, deals, etc.
    action: text("action").notNull(), // read, write, delete, manage
    scope: text("scope").notNull().default("own"), // global, organization, own
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("permissions_name_idx").on(table.name),
    resourceActionIdx: index("permissions_resource_action_idx").on(
      table.resource,
      table.action,
    ),
    isActiveIdx: index("permissions_is_active_idx").on(table.isActive),
  }),
);

// Roles table
export const roles = pgTable(
  "roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("roles_name_idx").on(table.name),
    isSystemIdx: index("roles_is_system_idx").on(table.isSystem),
    isActiveIdx: index("roles_is_active_idx").on(table.isActive),
  }),
);

// Role Permissions table (many-to-many)
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    roleId: text("role_id")
      .references(() => roles.id)
      .notNull(),
    permissionId: text("permission_id")
      .references(() => permissions.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    rolePermissionIdx: index("role_permissions_role_permission_idx").on(
      table.roleId,
      table.permissionId,
    ),
    roleIdx: index("role_permissions_role_idx").on(table.roleId),
    permissionIdx: index("role_permissions_permission_idx").on(
      table.permissionId,
    ),
  }),
);

// User Roles table (many-to-many)
export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    roleId: text("role_id")
      .references(() => roles.id)
      .notNull(),
    assignedBy: text("assigned_by")
      .references(() => users.id)
      .notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => ({
    userRoleIdx: index("user_roles_user_role_idx").on(
      table.userId,
      table.roleId,
    ),
    userIdx: index("user_roles_user_idx").on(table.userId),
    roleIdx: index("user_roles_role_idx").on(table.roleId),
  }),
);

// Organizations table
export const organizations = pgTable(
  "organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    displayName: text("display_name"),
    description: text("description"),
    industry: text("industry"),
    size: text("size"), // small, medium, large, enterprise
    foundedYear: integer("founded_year"),
    website: text("website"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    country: text("country"),
    timezone: text("timezone").notNull().default("UTC"),
    currency: text("currency").notNull().default("USD"),
    language: text("language").notNull().default("en"),
    logoUrl: text("logo_url"),
    settings: jsonb("settings").default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("organizations_name_idx").on(table.name),
    isActiveIdx: index("organizations_is_active_idx").on(table.isActive),
  }),
);

// Departments table
export const departments = pgTable(
  "departments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentDepartmentId: text("parent_department_id"),
    managerId: text("manager_id").references(() => users.id),
    budget: decimal("budget", { precision: 12, scale: 2 }),
    costCenter: text("cost_center"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    organizationIdx: index("departments_organization_idx").on(
      table.organizationId,
    ),
    nameIdx: index("departments_name_idx").on(table.name),
    parentIdx: index("departments_parent_idx").on(table.parentDepartmentId),
    managerIdx: index("departments_manager_idx").on(table.managerId),
    isActiveIdx: index("departments_is_active_idx").on(table.isActive),
  }),
);

// User Departments table (many-to-many)
export const userDepartments = pgTable(
  "user_departments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    departmentId: text("department_id")
      .references(() => departments.id)
      .notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => ({
    userDepartmentIdx: index("user_departments_user_department_idx").on(
      table.userId,
      table.departmentId,
    ),
    userIdx: index("user_departments_user_idx").on(table.userId),
    departmentIdx: index("user_departments_department_idx").on(
      table.departmentId,
    ),
  }),
);

// Proposals table
export const proposals = pgTable(
  "proposals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    dealId: text("deal_id")
      .references(() => deals.id)
      .notNull(),
    customerId: text("customer_id")
      .references(() => customers.id)
      .notNull(),
    contactId: text("contact_id").references(() => contacts.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("draft"), // draft, pending_approval, approved, sent, viewed, accepted, rejected, expired
    type: text("type").notNull().default("proposal"), // proposal, quote, estimate
    templateId: text("template_id"),
    validUntil: timestamp("valid_until"),
    sentAt: timestamp("sent_at"),
    viewedAt: timestamp("viewed_at"),
    respondedAt: timestamp("responded_at"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    taxPercent: decimal("tax_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    currency: text("currency").notNull().default("USD"),
    terms: text("terms"),
    notes: text("notes"),
    version: integer("version").notNull().default(1),
    parentProposalId: text("parent_proposal_id"),
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    dealIdx: index("proposals_deal_idx").on(table.dealId),
    customerIdx: index("proposals_customer_idx").on(table.customerId),
    statusIdx: index("proposals_status_idx").on(table.status),
    typeIdx: index("proposals_type_idx").on(table.type),
    createdByIdx: index("proposals_created_by_idx").on(table.createdBy),
    validUntilIdx: index("proposals_valid_until_idx").on(table.validUntil),
  }),
);

// Proposal Items table
export const proposalItems = pgTable(
  "proposal_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    proposalId: text("proposal_id")
      .references(() => proposals.id)
      .notNull(),
    productId: text("product_id"), // Reference to product catalog (not implemented yet)
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    quantity: decimal("quantity", { precision: 10, scale: 3 })
      .notNull()
      .default("1"),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    proposalIdx: index("proposal_items_proposal_idx").on(table.proposalId),
    sortOrderIdx: index("proposal_items_sort_order_idx").on(table.sortOrder),
  }),
);

// Proposal Templates table
export const proposalTemplates = pgTable(
  "proposal_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    headerTemplate: text("header_template"),
    footerTemplate: text("footer_template"),
    termsTemplate: text("terms_template"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("proposal_templates_name_idx").on(table.name),
    categoryIdx: index("proposal_templates_category_idx").on(table.category),
    isDefaultIdx: index("proposal_templates_is_default_idx").on(
      table.isDefault,
    ),
    isActiveIdx: index("proposal_templates_is_active_idx").on(table.isActive),
    createdByIdx: index("proposal_templates_created_by_idx").on(
      table.createdBy,
    ),
  }),
);

// Campaigns table
export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull(), // email, sms, social, event, webinar
    status: text("status").notNull().default("draft"), // draft, active, paused, completed, cancelled
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    budget: decimal("budget", { precision: 12, scale: 2 }),
    targetAudience: text("target_audience"),
    goal: text("goal"),
    metadata: jsonb("metadata").default({}),
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("campaigns_name_idx").on(table.name),
    typeIdx: index("campaigns_type_idx").on(table.type),
    statusIdx: index("campaigns_status_idx").on(table.status),
    startDateIdx: index("campaigns_start_date_idx").on(table.startDate),
    createdByIdx: index("campaigns_created_by_idx").on(table.createdBy),
  }),
);

// Campaign Leads table (many-to-many relationship)
export const campaignLeads = pgTable(
  "campaign_leads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    campaignId: text("campaign_id")
      .references(() => campaigns.id)
      .notNull(),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    status: text("status").notNull().default("assigned"), // assigned, contacted, responded, converted, excluded
    assignedBy: text("assigned_by")
      .references(() => users.id)
      .notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
    lastContactedAt: timestamp("last_contacted_at"),
    responseAt: timestamp("response_at"),
    notes: text("notes"),
  },
  (table) => ({
    campaignLeadIdx: index("campaign_leads_campaign_lead_idx").on(
      table.campaignId,
      table.leadId,
    ),
    campaignIdx: index("campaign_leads_campaign_idx").on(table.campaignId),
    leadIdx: index("campaign_leads_lead_idx").on(table.leadId),
    statusIdx: index("campaign_leads_status_idx").on(table.status),
    assignedByIdx: index("campaign_leads_assigned_by_idx").on(table.assignedBy),
  }),
);

// Email Marketing Templates table
export const emailTemplates = pgTable(
  "email_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    subject: text("subject").notNull(),
    content: text("content").notNull(),
    type: text("type").notNull().default("marketing"), // marketing, transactional, newsletter
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("email_templates_name_idx").on(table.name),
    typeIdx: index("email_templates_type_idx").on(table.type),
    isActiveIdx: index("email_templates_is_active_idx").on(table.isActive),
    createdByIdx: index("email_templates_created_by_idx").on(table.createdBy),
  }),
);

// Email Marketing Campaigns table
export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    campaignId: text("campaign_id")
      .references(() => campaigns.id)
      .notNull(),
    templateId: text("template_id")
      .references(() => emailTemplates.id)
      .notNull(),
    subject: text("subject").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("draft"), // draft, scheduled, sending, sent, failed
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    totalRecipients: integer("total_recipients").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    openedCount: integer("opened_count").notNull().default(0),
    clickedCount: integer("clicked_count").notNull().default(0),
    bouncedCount: integer("bounced_count").notNull().default(0),
    unsubscribedCount: integer("unsubscribed_count").notNull().default(0),
    metadata: jsonb("metadata").default({}),
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    campaignIdx: index("email_campaigns_campaign_idx").on(table.campaignId),
    templateIdx: index("email_campaigns_template_idx").on(table.templateId),
    statusIdx: index("email_campaigns_status_idx").on(table.status),
    scheduledAtIdx: index("email_campaigns_scheduled_at_idx").on(
      table.scheduledAt,
    ),
    sentAtIdx: index("email_campaigns_sent_at_idx").on(table.sentAt),
    createdByIdx: index("email_campaigns_created_by_idx").on(table.createdBy),
  }),
);

// Email Marketing History table (tracking individual email sends)
export const emailHistory = pgTable(
  "email_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    emailCampaignId: text("email_campaign_id")
      .references(() => emailCampaigns.id)
      .notNull(),
    leadId: text("lead_id")
      .references(() => leads.id)
      .notNull(),
    customerId: text("customer_id").references(() => customers.id),
    contactId: text("contact_id").references(() => contacts.id),
    emailAddress: text("email_address").notNull(),
    subject: text("subject").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("pending"), // pending, sent, delivered, opened, clicked, bounced, failed, unsubscribed
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    bouncedAt: timestamp("bounced_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailCampaignIdx: index("email_history_email_campaign_idx").on(
      table.emailCampaignId,
    ),
    leadIdx: index("email_history_lead_idx").on(table.leadId),
    customerIdx: index("email_history_customer_idx").on(table.customerId),
    contactIdx: index("email_history_contact_idx").on(table.contactId),
    emailAddressIdx: index("email_history_email_address_idx").on(
      table.emailAddress,
    ),
    statusIdx: index("email_history_status_idx").on(table.status),
    sentAtIdx: index("email_history_sent_at_idx").on(table.sentAt),
    openedAtIdx: index("email_history_opened_at_idx").on(table.openedAt),
    clickedAtIdx: index("email_history_clicked_at_idx").on(table.clickedAt),
  }),
);

// Approvals table
export const approvals = pgTable(
  "approvals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    entityType: text("entity_type").notNull(), // deal, proposal, contract, discount
    entityId: text("entity_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    requestedBy: text("requested_by")
      .references(() => users.id)
      .notNull(),
    assignedTo: text("assigned_to")
      .references(() => users.id)
      .notNull(),
    status: text("status").notNull().default("pending"), // pending, approved, rejected, cancelled
    priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
    requestData: jsonb("request_data").default({}),
    approverComments: text("approver_comments"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    cancelledAt: timestamp("cancelled_at"),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    entityIdx: index("approvals_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    statusIdx: index("approvals_status_idx").on(table.status),
    priorityIdx: index("approvals_priority_idx").on(table.priority),
    requestedByIdx: index("approvals_requested_by_idx").on(table.requestedBy),
    assignedToIdx: index("approvals_assigned_to_idx").on(table.assignedTo),
    dueDateIdx: index("approvals_due_date_idx").on(table.dueDate),
    createdAtIdx: index("approvals_created_at_idx").on(table.createdAt),
  }),
);

// Security Settings table
export const securitySettings = pgTable(
  "security_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    passwordMinLength: integer("password_min_length").notNull().default(8),
    passwordRequireUppercase: boolean("password_require_uppercase")
      .notNull()
      .default(true),
    passwordRequireLowercase: boolean("password_require_lowercase")
      .notNull()
      .default(true),
    passwordRequireNumbers: boolean("password_require_numbers")
      .notNull()
      .default(true),
    passwordRequireSpecialChars: boolean("password_require_special_chars")
      .notNull()
      .default(false),
    passwordExpirationDays: integer("password_expiration_days"), // null means no expiration
    passwordHistoryCount: integer("password_history_count")
      .notNull()
      .default(5),
    maxLoginAttempts: integer("max_login_attempts").notNull().default(5),
    lockoutDurationMinutes: integer("lockout_duration_minutes")
      .notNull()
      .default(30),
    sessionTimeoutMinutes: integer("session_timeout_minutes")
      .notNull()
      .default(60),
    twoFactorRequired: boolean("two_factor_required").notNull().default(false),
    allowedEmailDomains: jsonb("allowed_email_domains").default([]),
    blockedEmailDomains: jsonb("blocked_email_domains").default([]),
    ipWhitelist: jsonb("ip_whitelist").default([]),
    ipBlacklist: jsonb("ip_blacklist").default([]),
    dataRetentionDays: integer("data_retention_days").notNull().default(365),
    auditLogEnabled: boolean("audit_log_enabled").notNull().default(true),
    encryptionAtRest: boolean("encryption_at_rest").notNull().default(true),
    securityNotifications: boolean("security_notifications")
      .notNull()
      .default(true),
    maintenanceMode: boolean("maintenance_mode").notNull().default(false),
    maintenanceMessage: text("maintenance_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    organizationIdx: index("security_settings_organization_idx").on(
      table.organizationId,
    ),
  }),
);

// Security Events table
export const securityEvents = pgTable(
  "security_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    eventType: text("event_type").notNull(), // login_success, login_failed, etc.
    severity: text("severity").notNull(), // low, medium, high, critical
    userId: text("user_id").references(() => users.id),
    targetUserId: text("target_user_id").references(() => users.id),
    description: text("description").notNull(),
    metadata: jsonb("metadata").default({}),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    success: boolean("success").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    organizationIdx: index("security_events_organization_idx").on(
      table.organizationId,
    ),
    eventTypeIdx: index("security_events_event_type_idx").on(table.eventType),
    severityIdx: index("security_events_severity_idx").on(table.severity),
    userIdx: index("security_events_user_idx").on(table.userId),
    successIdx: index("security_events_success_idx").on(table.success),
    createdAtIdx: index("security_events_created_at_idx").on(table.createdAt),
    ipAddressIdx: index("security_events_ip_address_idx").on(table.ipAddress),
  }),
);

// Security Alerts table
export const securityAlerts = pgTable(
  "security_alerts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .references(() => organizations.id)
      .notNull(),
    alertType: text("alert_type").notNull(),
    severity: text("severity").notNull(), // low, medium, high, critical
    title: text("title").notNull(),
    description: text("description").notNull(),
    userId: text("user_id").references(() => users.id),
    targetUserId: text("target_user_id").references(() => users.id),
    metadata: jsonb("metadata").default({}),
    isResolved: boolean("is_resolved").notNull().default(false),
    resolvedBy: text("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at"),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    organizationIdx: index("security_alerts_organization_idx").on(
      table.organizationId,
    ),
    alertTypeIdx: index("security_alerts_alert_type_idx").on(table.alertType),
    severityIdx: index("security_alerts_severity_idx").on(table.severity),
    isResolvedIdx: index("security_alerts_is_resolved_idx").on(
      table.isResolved,
    ),
    createdAtIdx: index("security_alerts_created_at_idx").on(table.createdAt),
  }),
);

// Password History table
export const passwordHistory = pgTable(
  "password_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("password_history_user_idx").on(table.userId),
    createdAtIdx: index("password_history_created_at_idx").on(table.createdAt),
  }),
);

// Display Settings table
export const displaySettings = pgTable(
  "display_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    theme: text("theme").notNull().default("auto"),
    language: text("language").notNull().default("ja"),
    dateFormat: text("date_format").notNull().default("YYYY-MM-DD"),
    timeFormat: text("time_format").notNull().default("24h"),
    timezone: text("timezone").notNull().default("Asia/Tokyo"),
    currency: text("currency").notNull().default("JPY"),
    itemsPerPage: integer("items_per_page").notNull().default(20),
    enableNotifications: boolean("enable_notifications")
      .notNull()
      .default(true),
    enableEmailNotifications: boolean("enable_email_notifications")
      .notNull()
      .default(true),
    compactMode: boolean("compact_mode").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("display_settings_user_idx").on(table.userId),
  }),
);

// Dashboards table
export const dashboards = pgTable(
  "dashboards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    widgets: jsonb("widgets").notNull().default([]),
    layout: text("layout").notNull().default("grid"),
    gridSize: integer("grid_size").notNull().default(12),
    backgroundColor: text("background_color"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("dashboards_user_idx").on(table.userId),
    isDefaultIdx: index("dashboards_is_default_idx").on(table.isDefault),
  }),
);

// Integrations table
export const integrations = pgTable(
  "integrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    status: text("status").notNull().default("inactive"),
    config: jsonb("config").notNull().default({}),
    lastSyncAt: timestamp("last_sync_at"),
    lastErrorMessage: text("last_error_message"),
    isSystemwide: boolean("is_systemwide").notNull().default(false),
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    typeIdx: index("integrations_type_idx").on(table.type),
    statusIdx: index("integrations_status_idx").on(table.status),
    isSystemwideIdx: index("integrations_is_systemwide_idx").on(
      table.isSystemwide,
    ),
    createdByIdx: index("integrations_created_by_idx").on(table.createdBy),
  }),
);

// Import/Export Jobs table
export const importExportJobs = pgTable(
  "import_export_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    operationType: text("operation_type").notNull(),
    dataType: text("data_type").notNull(),
    format: text("format").notNull(),
    fileName: text("file_name").notNull(),
    filePath: text("file_path"),
    status: text("status").notNull().default("pending"),
    totalRecords: integer("total_records"),
    processedRecords: integer("processed_records"),
    errorRecords: integer("error_records"),
    errorMessage: text("error_message"),
    config: jsonb("config"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("import_export_jobs_user_idx").on(table.userId),
    operationTypeIdx: index("import_export_jobs_operation_type_idx").on(
      table.operationType,
    ),
    dataTypeIdx: index("import_export_jobs_data_type_idx").on(table.dataType),
    statusIdx: index("import_export_jobs_status_idx").on(table.status),
  }),
);
