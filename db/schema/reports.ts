import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

// =============================================================================
// Types
// =============================================================================

export type ReportType = "quarterly" | "annual";
export type ReportStatus = "draft" | "published" | "archived";
export type ReportFrequency = "quarterly" | "annual" | "manual";
export type ScheduleStatus = "success" | "failed" | "skipped";
export type ReportAction = "created" | "updated" | "published" | "archived" | "regenerated";
export type ChartType = "line_chart" | "bar_chart" | "pie_chart" | "table" | "metric" | "progress";
export type DataSource =
  | "users"
  | "polls"
  | "votes"
  | "confidence_votes"
  | "evidence"
  | "lawyers"
  | "lawyer_reviews"
  | "moderation"
  | "blog"
  | "legal_literacy"
  | "financial";

// =============================================================================
// report_templates
// =============================================================================

export const reportTemplates = pgTable(
  "report_templates",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    reportType: text("report_type").notNull().$type<ReportType>(),
    description: text("description"),
    sections: text("sections").notNull(), // JSON array
    frequency: text("frequency").notNull().$type<ReportFrequency>().default("manual"),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("report_templates_name_unique").on(table.name),
    index("idx_report_templates_type").on(table.reportType),
    index("idx_report_templates_active").on(table.isActive),
    index("idx_report_templates_default").on(table.isDefault),
  ],
);

export type ReportTemplateRow = typeof reportTemplates.$inferSelect;
export type ReportTemplateInsert = typeof reportTemplates.$inferInsert;

// =============================================================================
// generated_reports
// =============================================================================

export const generatedReports = pgTable(
  "generated_reports",
  {
    id: text("id").primaryKey(),
    templateId: text("template_id").references(() => reportTemplates.id, { onDelete: "set null" }),
    reportType: text("report_type").notNull().$type<ReportType>(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: text("status").notNull().$type<ReportStatus>().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: uuid("published_by").references(() => users.id, { onDelete: "set null" }),
    data: text("data"), // JSON
    metrics: text("metrics"), // JSON
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_generated_reports_type").on(table.reportType),
    index("idx_generated_reports_template").on(table.templateId),
    index("idx_generated_reports_status").on(table.status),
    index("idx_generated_reports_period").on(table.periodStart, table.periodEnd),
    index("idx_generated_reports_published").on(table.publishedAt),
  ],
);

export type GeneratedReportRow = typeof generatedReports.$inferSelect;
export type GeneratedReportInsert = typeof generatedReports.$inferInsert;

// =============================================================================
// report_sections
// =============================================================================

export const reportSections = pgTable(
  "report_sections",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => generatedReports.id, { onDelete: "cascade" }),
    templateSectionId: text("template_section_id"),
    title: text("title").notNull(),
    content: text("content"), // MDX
    order: integer("order").notNull().default(0),
    dataSource: text("data_source").$type<DataSource>(),
    chartType: text("chart_type").$type<ChartType>(),
    chartData: text("chart_data"), // JSON
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_report_sections_report").on(table.reportId),
    index("idx_report_sections_order").on(table.reportId, table.order),
  ],
);

export type ReportSectionRow = typeof reportSections.$inferSelect;
export type ReportSectionInsert = typeof reportSections.$inferInsert;

// =============================================================================
// report_schedules
// =============================================================================

export const reportSchedules = pgTable(
  "report_schedules",
  {
    id: text("id").primaryKey(),
    templateId: text("template_id").references(() => reportTemplates.id, { onDelete: "set null" }),
    reportType: text("report_type").notNull().$type<ReportType>(),
    schedule: text("schedule").notNull(), // cron or manual
    nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastRunStatus: text("last_run_status").$type<ScheduleStatus>(),
    lastRunError: text("last_run_error"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_report_schedules_template").on(table.templateId),
    index("idx_report_schedules_type").on(table.reportType),
    index("idx_report_schedules_next").on(table.nextRunAt),
    index("idx_report_schedules_active").on(table.isActive),
  ],
);

export type ReportScheduleRow = typeof reportSchedules.$inferSelect;
export type ReportScheduleInsert = typeof reportSchedules.$inferInsert;

// =============================================================================
// report_audit_logs
// =============================================================================

export const reportAuditLogs = pgTable(
  "report_audit_logs",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id").references(() => generatedReports.id, { onDelete: "cascade" }),
    action: text("action").notNull().$type<ReportAction>(),
    actionedBy: uuid("actioned_by").references(() => users.id, { onDelete: "set null" }),
    actionedAt: timestamp("actioned_at", { withTimezone: true }).notNull().defaultNow(),
    details: text("details"), // JSON
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_report_audit_logs_report").on(table.reportId),
    index("idx_report_audit_logs_action").on(table.action),
    index("idx_report_audit_logs_by").on(table.actionedBy),
    index("idx_report_audit_logs_at").on(table.actionedAt),
  ],
);

export type ReportAuditLogRow = typeof reportAuditLogs.$inferSelect;
export type ReportAuditLogInsert = typeof reportAuditLogs.$inferInsert;
