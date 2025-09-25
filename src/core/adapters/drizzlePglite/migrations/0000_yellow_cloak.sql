CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"scheduled_at" timestamp,
	"due_date" timestamp,
	"completed_at" timestamp,
	"duration" integer,
	"customer_id" text,
	"contact_id" text,
	"deal_id" text,
	"lead_id" text,
	"assigned_user_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"requested_by" text NOT NULL,
	"assigned_to" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"request_data" jsonb DEFAULT '{}'::jsonb,
	"approver_comments" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"cancelled_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"last_contacted_at" timestamp,
	"response_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"budget" numeric(12, 2),
	"target_audience" text,
	"goal" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_history" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"contact_id" text,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"content" text,
	"direction" text,
	"status" text,
	"duration" integer,
	"contacted_by_user_id" text NOT NULL,
	"contacted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"department" text,
	"email" text,
	"phone" text,
	"mobile" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"size" text,
	"location" text,
	"founded_year" integer,
	"website" text,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"parent_customer_id" text,
	"assigned_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"widgets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"layout" text DEFAULT 'grid' NOT NULL,
	"grid_size" integer DEFAULT 12 NOT NULL,
	"background_color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"customer_id" text NOT NULL,
	"contact_id" text,
	"stage" text DEFAULT 'prospecting' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"description" text,
	"competitors" jsonb DEFAULT '[]'::jsonb,
	"assigned_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_department_id" text,
	"manager_id" text,
	"budget" numeric(12, 2),
	"cost_center" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "display_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"theme" text DEFAULT 'auto' NOT NULL,
	"language" text DEFAULT 'ja' NOT NULL,
	"date_format" text DEFAULT 'YYYY-MM-DD' NOT NULL,
	"time_format" text DEFAULT '24h' NOT NULL,
	"timezone" text DEFAULT 'Asia/Tokyo' NOT NULL,
	"currency" text DEFAULT 'JPY' NOT NULL,
	"items_per_page" integer DEFAULT 20 NOT NULL,
	"enable_notifications" boolean DEFAULT true NOT NULL,
	"enable_email_notifications" boolean DEFAULT true NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"uploaded_by" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_document_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"template_id" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"opened_count" integer DEFAULT 0 NOT NULL,
	"clicked_count" integer DEFAULT 0 NOT NULL,
	"bounced_count" integer DEFAULT 0 NOT NULL,
	"unsubscribed_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_history" (
	"id" text PRIMARY KEY NOT NULL,
	"email_campaign_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"customer_id" text,
	"contact_id" text,
	"email_address" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"unsubscribed_at" timestamp,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'marketing' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"report_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_export_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"operation_type" text NOT NULL,
	"data_type" text NOT NULL,
	"format" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_records" integer,
	"processed_records" integer,
	"error_records" integer,
	"error_message" text,
	"config" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'inactive' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_sync_at" timestamp,
	"last_error_message" text,
	"is_systemwide" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_behavior" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"type" text NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"score" integer DEFAULT 0,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"title" text,
	"industry" text,
	"source" text,
	"status" text DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"assigned_user_id" text,
	"converted_customer_id" text,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"push_notifications" boolean DEFAULT true NOT NULL,
	"reminder_notifications" boolean DEFAULT true NOT NULL,
	"deal_notifications" boolean DEFAULT true NOT NULL,
	"activity_notifications" boolean DEFAULT true NOT NULL,
	"lead_notifications" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"description" text,
	"industry" text,
	"size" text,
	"founded_year" integer,
	"website" text,
	"email" text,
	"phone" text,
	"address" text,
	"country" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"logo_url" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"scope" text DEFAULT 'own' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_items" (
	"id" text PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"product_id" text,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"quantity" numeric(10, 3) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"header_template" text,
	"footer_template" text,
	"terms_template" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"contact_id" text,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"type" text DEFAULT 'proposal' NOT NULL,
	"template_id" text,
	"valid_until" timestamp,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"responded_at" timestamp,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"terms" text,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_proposal_id" text,
	"created_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_template" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"condition" jsonb NOT NULL,
	"score" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"user_id" text,
	"target_user_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event_type" text NOT NULL,
	"severity" text NOT NULL,
	"user_id" text,
	"target_user_id" text,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text,
	"user_agent" text,
	"success" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"password_min_length" integer DEFAULT 8 NOT NULL,
	"password_require_uppercase" boolean DEFAULT true NOT NULL,
	"password_require_lowercase" boolean DEFAULT true NOT NULL,
	"password_require_numbers" boolean DEFAULT true NOT NULL,
	"password_require_special_chars" boolean DEFAULT false NOT NULL,
	"password_expiration_days" integer,
	"password_history_count" integer DEFAULT 5 NOT NULL,
	"max_login_attempts" integer DEFAULT 5 NOT NULL,
	"lockout_duration_minutes" integer DEFAULT 30 NOT NULL,
	"session_timeout_minutes" integer DEFAULT 60 NOT NULL,
	"two_factor_required" boolean DEFAULT false NOT NULL,
	"allowed_email_domains" jsonb DEFAULT '[]'::jsonb,
	"blocked_email_domains" jsonb DEFAULT '[]'::jsonb,
	"ip_whitelist" jsonb DEFAULT '[]'::jsonb,
	"ip_blacklist" jsonb DEFAULT '[]'::jsonb,
	"data_retention_days" integer DEFAULT 365 NOT NULL,
	"audit_log_enabled" boolean DEFAULT true NOT NULL,
	"encryption_at_rest" boolean DEFAULT true NOT NULL,
	"security_notifications" boolean DEFAULT true NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"maintenance_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "user_departments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"department_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_leads" ADD CONSTRAINT "campaign_leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_leads" ADD CONSTRAINT "campaign_leads_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_leads" ADD CONSTRAINT "campaign_leads_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_history" ADD CONSTRAINT "contact_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_history" ADD CONSTRAINT "contact_history_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_history" ADD CONSTRAINT "contact_history_contacted_by_user_id_users_id_fk" FOREIGN KEY ("contacted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_settings" ADD CONSTRAINT "display_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_history" ADD CONSTRAINT "email_history_email_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("email_campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_history" ADD CONSTRAINT "email_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_history" ADD CONSTRAINT "email_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_history" ADD CONSTRAINT "email_history_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_reports" ADD CONSTRAINT "favorite_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_reports" ADD CONSTRAINT "favorite_reports_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_export_jobs" ADD CONSTRAINT "import_export_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_behavior" ADD CONSTRAINT "lead_behavior_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_customer_id_customers_id_fk" FOREIGN KEY ("converted_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_templates" ADD CONSTRAINT "proposal_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_rules" ADD CONSTRAINT "scoring_rules_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_settings" ADD CONSTRAINT "security_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activities_status_idx" ON "activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "activities_scheduled_at_idx" ON "activities" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "activities_due_date_idx" ON "activities" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "activities_assigned_user_idx" ON "activities" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "activities_customer_idx" ON "activities" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "activities_deal_idx" ON "activities" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "approvals_entity_idx" ON "approvals" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "approvals_status_idx" ON "approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approvals_priority_idx" ON "approvals" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "approvals_requested_by_idx" ON "approvals" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "approvals_assigned_to_idx" ON "approvals" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "approvals_due_date_idx" ON "approvals" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "approvals_created_at_idx" ON "approvals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaign_leads_campaign_lead_idx" ON "campaign_leads" USING btree ("campaign_id","lead_id");--> statement-breakpoint
CREATE INDEX "campaign_leads_campaign_idx" ON "campaign_leads" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_leads_lead_idx" ON "campaign_leads" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "campaign_leads_status_idx" ON "campaign_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_leads_assigned_by_idx" ON "campaign_leads" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "campaigns_name_idx" ON "campaigns" USING btree ("name");--> statement-breakpoint
CREATE INDEX "campaigns_type_idx" ON "campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_start_date_idx" ON "campaigns" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "campaigns_created_by_idx" ON "campaigns" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "contact_history_customer_idx" ON "contact_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "contact_history_type_idx" ON "contact_history" USING btree ("type");--> statement-breakpoint
CREATE INDEX "contact_history_contacted_at_idx" ON "contact_history" USING btree ("contacted_at");--> statement-breakpoint
CREATE INDEX "contacts_customer_idx" ON "contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customers_industry_idx" ON "customers" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "customers_assigned_user_idx" ON "customers" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "dashboards_user_idx" ON "dashboards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dashboards_is_default_idx" ON "dashboards" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "deals_customer_idx" ON "deals" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "deals_stage_idx" ON "deals" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "deals_assigned_user_idx" ON "deals" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "deals_expected_close_date_idx" ON "deals" USING btree ("expected_close_date");--> statement-breakpoint
CREATE INDEX "departments_organization_idx" ON "departments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "departments_parent_idx" ON "departments" USING btree ("parent_department_id");--> statement-breakpoint
CREATE INDEX "departments_manager_idx" ON "departments" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "departments_is_active_idx" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "display_settings_user_idx" ON "display_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "documents_entity_idx" ON "documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "documents_tags_idx" ON "documents" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "email_campaigns_campaign_idx" ON "email_campaigns" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "email_campaigns_template_idx" ON "email_campaigns" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaigns_scheduled_at_idx" ON "email_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "email_campaigns_sent_at_idx" ON "email_campaigns" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_campaigns_created_by_idx" ON "email_campaigns" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "email_history_email_campaign_idx" ON "email_history" USING btree ("email_campaign_id");--> statement-breakpoint
CREATE INDEX "email_history_lead_idx" ON "email_history" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "email_history_customer_idx" ON "email_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "email_history_contact_idx" ON "email_history" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "email_history_email_address_idx" ON "email_history" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX "email_history_status_idx" ON "email_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_history_sent_at_idx" ON "email_history" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_history_opened_at_idx" ON "email_history" USING btree ("opened_at");--> statement-breakpoint
CREATE INDEX "email_history_clicked_at_idx" ON "email_history" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "email_templates_name_idx" ON "email_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "email_templates_type_idx" ON "email_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_templates_is_active_idx" ON "email_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_templates_created_by_idx" ON "email_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "favorite_reports_user_report_idx" ON "favorite_reports" USING btree ("user_id","report_id");--> statement-breakpoint
CREATE INDEX "favorite_reports_user_idx" ON "favorite_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "import_export_jobs_user_idx" ON "import_export_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "import_export_jobs_operation_type_idx" ON "import_export_jobs" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "import_export_jobs_data_type_idx" ON "import_export_jobs" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "import_export_jobs_status_idx" ON "import_export_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "integrations_type_idx" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "integrations_status_idx" ON "integrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "integrations_is_systemwide_idx" ON "integrations" USING btree ("is_systemwide");--> statement-breakpoint
CREATE INDEX "integrations_created_by_idx" ON "integrations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "lead_behavior_lead_idx" ON "lead_behavior" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_behavior_type_idx" ON "lead_behavior" USING btree ("type");--> statement-breakpoint
CREATE INDEX "lead_behavior_occurred_at_idx" ON "lead_behavior" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_company_idx" ON "leads" USING btree ("company");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_assigned_user_idx" ON "leads" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "leads_score_idx" ON "leads" USING btree ("score");--> statement-breakpoint
CREATE INDEX "notification_settings_user_idx" ON "notification_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organizations_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organizations_is_active_idx" ON "organizations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "password_history_user_idx" ON "password_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_history_created_at_idx" ON "password_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "permissions_name_idx" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "permissions_resource_action_idx" ON "permissions" USING btree ("resource","action");--> statement-breakpoint
CREATE INDEX "permissions_is_active_idx" ON "permissions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "proposal_items_proposal_idx" ON "proposal_items" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "proposal_items_sort_order_idx" ON "proposal_items" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "proposal_templates_name_idx" ON "proposal_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "proposal_templates_category_idx" ON "proposal_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "proposal_templates_is_default_idx" ON "proposal_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "proposal_templates_is_active_idx" ON "proposal_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "proposal_templates_created_by_idx" ON "proposal_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "proposals_deal_idx" ON "proposals" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "proposals_customer_idx" ON "proposals" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "proposals_status_idx" ON "proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposals_type_idx" ON "proposals" USING btree ("type");--> statement-breakpoint
CREATE INDEX "proposals_created_by_idx" ON "proposals" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "proposals_valid_until_idx" ON "proposals" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "reports_name_idx" ON "reports" USING btree ("name");--> statement-breakpoint
CREATE INDEX "reports_type_idx" ON "reports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reports_category_idx" ON "reports" USING btree ("category");--> statement-breakpoint
CREATE INDEX "reports_created_by_idx" ON "reports" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "role_permissions_role_permission_idx" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "role_permissions_role_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_is_system_idx" ON "roles" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "roles_is_active_idx" ON "roles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "scoring_rules_name_idx" ON "scoring_rules" USING btree ("name");--> statement-breakpoint
CREATE INDEX "scoring_rules_is_active_idx" ON "scoring_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "security_alerts_organization_idx" ON "security_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "security_alerts_alert_type_idx" ON "security_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "security_alerts_is_resolved_idx" ON "security_alerts" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "security_alerts_created_at_idx" ON "security_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "security_events_organization_idx" ON "security_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "security_events_event_type_idx" ON "security_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "security_events_severity_idx" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "security_events_user_idx" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "security_events_success_idx" ON "security_events" USING btree ("success");--> statement-breakpoint
CREATE INDEX "security_events_created_at_idx" ON "security_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "security_events_ip_address_idx" ON "security_events" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "security_settings_organization_idx" ON "security_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "settings_key_idx" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "settings_category_idx" ON "settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "user_departments_user_department_idx" ON "user_departments" USING btree ("user_id","department_id");--> statement-breakpoint
CREATE INDEX "user_departments_user_idx" ON "user_departments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_departments_department_idx" ON "user_departments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "user_roles_user_role_idx" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");