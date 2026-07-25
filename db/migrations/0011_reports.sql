CREATE TABLE "report_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"report_type" text NOT NULL,
	"description" text,
	"sections" text NOT NULL,
	"frequency" text DEFAULT 'manual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "generated_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text,
	"report_type" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" uuid,
	"data" text,
	"metrics" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"template_section_id" text,
	"title" text NOT NULL,
	"content" text,
	"order" integer DEFAULT 0 NOT NULL,
	"data_source" text,
	"chart_type" text,
	"chart_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text,
	"report_type" text NOT NULL,
	"schedule" text NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_run_status" text,
	"last_run_error" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text,
	"action" text NOT NULL,
	"actioned_by" uuid,
	"actioned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_report_id_generated_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."generated_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_audit_logs" ADD CONSTRAINT "report_audit_logs_report_id_generated_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."generated_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_audit_logs" ADD CONSTRAINT "report_audit_logs_actioned_by_users_id_fk" FOREIGN KEY ("actioned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_report_templates_type" ON "report_templates" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "idx_report_templates_active" ON "report_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_report_templates_default" ON "report_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_generated_reports_type" ON "generated_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "idx_generated_reports_template" ON "generated_reports" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_generated_reports_status" ON "generated_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_generated_reports_period" ON "generated_reports" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_generated_reports_published" ON "generated_reports" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_report_sections_report" ON "report_sections" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_report_sections_order" ON "report_sections" USING btree ("report_id","order");--> statement-breakpoint
CREATE INDEX "idx_report_schedules_template" ON "report_schedules" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_report_schedules_type" ON "report_schedules" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "idx_report_schedules_next" ON "report_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "idx_report_schedules_active" ON "report_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_report_audit_logs_report" ON "report_audit_logs" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_report_audit_logs_action" ON "report_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_report_audit_logs_by" ON "report_audit_logs" USING btree ("actioned_by");--> statement-breakpoint
CREATE INDEX "idx_report_audit_logs_at" ON "report_audit_logs" USING btree ("actioned_at");
