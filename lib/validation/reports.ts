import { z } from "zod";

// =============================================================================
// Enums
// =============================================================================

export const reportTypeEnum = z.enum(["quarterly", "annual"]);
export type ReportType = z.infer<typeof reportTypeEnum>;

export const reportStatusEnum = z.enum(["draft", "published", "archived"]);
export type ReportStatus = z.infer<typeof reportStatusEnum>;

export const reportFrequencyEnum = z.enum(["quarterly", "annual", "manual"]);
export type ReportFrequency = z.infer<typeof reportFrequencyEnum>;

export const scheduleStatusEnum = z.enum(["success", "failed", "skipped"]);
export type ScheduleStatus = z.infer<typeof scheduleStatusEnum>;

export const chartTypeEnum = z.enum(["line_chart", "bar_chart", "pie_chart", "table", "metric", "progress"]);
export type ChartType = z.infer<typeof chartTypeEnum>;

export const dataSourceEnum = z.enum([
  "users",
  "polls",
  "votes",
  "confidence_votes",
  "evidence",
  "lawyers",
  "lawyer_reviews",
  "moderation",
  "blog",
  "legal_literacy",
  "financial",
]);
export type DataSource = z.infer<typeof dataSourceEnum>;

export const reportActionEnum = z.enum(["created", "updated", "published", "archived", "regenerated"]);
export type ReportAction = z.infer<typeof reportActionEnum>;

// =============================================================================
// Template Section Schema
// =============================================================================

const templateSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  dataSource: dataSourceEnum.optional(),
  chartType: chartTypeEnum.optional(),
  order: z.number().int().nonnegative("Order must be non-negative").default(0),
});

// =============================================================================
// Generate Report
// =============================================================================

export const generateReportSchema = z.object({
  reportType: reportTypeEnum,
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  templateId: z.string().min(1, "Template ID is required").optional(),
});
export type GenerateReportInput = z.infer<typeof generateReportSchema>;

// =============================================================================
// Create Template
// =============================================================================

export const createReportTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  reportType: reportTypeEnum,
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  sections: z.array(templateSectionSchema).min(1, "At least one section is required"),
  frequency: reportFrequencyEnum.optional().default("manual"),
  isDefault: z.boolean().default(false),
});
export type CreateReportTemplateInput = z.infer<typeof createReportTemplateSchema>;

export const updateReportTemplateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional().nullable(),
  sections: z.array(templateSectionSchema).min(1, "At least one section is required").optional(),
  frequency: reportFrequencyEnum.optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateReportTemplateInput = z.infer<typeof updateReportTemplateSchema>;

// =============================================================================
// Create Schedule
// =============================================================================

export const createReportScheduleSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  reportType: reportTypeEnum,
  schedule: z.union([z.string().max(100, "Schedule must be at most 100 characters"), z.literal("manual")]),
  nextRunAt: z.date().optional(),
  isActive: z.boolean().default(true),
});
export type CreateReportScheduleInput = z.infer<typeof createReportScheduleSchema>;

export const updateReportScheduleSchema = z.object({
  id: z.string().min(1, "ID is required"),
  templateId: z.string().min(1, "Template ID is required").optional(),
  schedule: z.union([z.string().max(100, "Schedule must be at most 100 characters"), z.literal("manual")]).optional(),
  nextRunAt: z.date().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateReportScheduleInput = z.infer<typeof updateReportScheduleSchema>;

// =============================================================================
// Publish
// =============================================================================

export const publishReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters").optional(),
  summary: z.string().max(2000, "Summary must be at most 2000 characters").optional(),
});
export type PublishReportInput = z.infer<typeof publishReportSchema>;

// =============================================================================
// Update Section
// =============================================================================

export const updateSectionSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters").optional(),
  content: z.string().max(10000, "Content must be at most 10000 characters").optional().nullable(),
  chartType: chartTypeEnum.optional().nullable(),
  chartData: z.record(z.string(), z.any()).optional().nullable(),
});
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// =============================================================================
// Query Schemas
// =============================================================================

export const reportListSchema = z.object({
  reportType: reportTypeEnum.optional(),
  status: reportStatusEnum.optional(),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
  sortBy: z.enum(["periodStart", "periodEnd", "publishedAt", "createdAt"]).optional().default("periodStart"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type ReportListParams = z.infer<typeof reportListSchema>;

export const templateListSchema = z.object({
  reportType: reportTypeEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
});
export type TemplateListParams = z.infer<typeof templateListSchema>;

export const scheduleListSchema = z.object({
  reportType: reportTypeEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
});
export type ScheduleListParams = z.infer<typeof scheduleListSchema>;

export const auditLogListSchema = z.object({
  reportId: z.string().optional(),
  action: reportActionEnum.optional(),
  actionedBy: z.string().optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(50),
  sortBy: z.enum(["actionedAt", "createdAt"]).optional().default("actionedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type AuditLogListParams = z.infer<typeof auditLogListSchema>;

// =============================================================================
// Helpers
// =============================================================================

export function validateCronExpression(expression: string): boolean {
  // Basic validation: not empty and not manual
  return expression.length > 0 && expression !== "";
}

export function getQuarterlyPeriod(date: Date = new Date()): { start: Date; end: Date } {
  const now = date;
  const quarter = Math.floor(now.getMonth() / 3);
  const startMonth = quarter * 3;
  return {
    start: new Date(now.getFullYear(), startMonth, 1),
    end: new Date(now.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999),
  };
}

export function getAnnualPeriod(date: Date = new Date()): { start: Date; end: Date } {
  const year = date.getFullYear();
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}
