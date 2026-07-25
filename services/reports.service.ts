import { and, asc, desc, eq, count, sql, ne, gte, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import type { FileStorage } from "../lib/storage/file-storage.ts";

import {
  generateReportSchema,
  createReportTemplateSchema,
  updateReportTemplateSchema,
  createReportScheduleSchema,
  updateReportScheduleSchema,
  publishReportSchema,
  updateSectionSchema,
  reportListSchema,
  templateListSchema,
  scheduleListSchema,
  auditLogListSchema,
  type GenerateReportInput,
  type CreateReportTemplateInput,
  type UpdateReportTemplateInput,
  type CreateReportScheduleInput,
  type UpdateReportScheduleInput,
  type PublishReportInput,
  type UpdateSectionInput,
  type ReportListParams,
  type TemplateListParams,
  type ScheduleListParams,
  type AuditLogListParams,
  type ReportType,
  getQuarterlyPeriod,
  getAnnualPeriod,
  validateCronExpression,
} from "../lib/validation/reports.ts";

import {
  reportTemplates,
  generatedReports,
  reportSections,
  reportSchedules,
  reportAuditLogs,
  type ReportTemplateRow,
  type GeneratedReportRow,
  type ReportSectionRow,
  type ReportScheduleRow,
  type ReportAuditLogRow,
  type ReportStatus,
} from "../db/schema/reports.ts";

// =============================================================================
// Errors
// =============================================================================

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Report not found: ${id}`);
    this.name = "ReportNotFoundError";
  }
}
export class ReportAlreadyPublishedError extends Error {
  constructor(id: string) {
    super(`Report ${id} already published`);
    this.name = "ReportAlreadyPublishedError";
  }
}
export class ReportAlreadyArchivedError extends Error {
  constructor(id: string) {
    super(`Report ${id} already archived`);
    this.name = "ReportAlreadyArchivedError";
  }
}
export class ReportNotPublishedError extends Error {
  constructor(id: string) {
    super(`Report ${id} not published`);
    this.name = "ReportNotPublishedError";
  }
}
export class TemplateNotFoundError extends Error {
  constructor(id: string) {
    super(`Template not found: ${id}`);
    this.name = "TemplateNotFoundError";
  }
}
export class DuplicateTemplateNameError extends Error {
  constructor(name: string) {
    super(`Template with name "${name}" already exists`);
    this.name = "DuplicateTemplateNameError";
  }
}
export class ScheduleNotFoundError extends Error {
  constructor(id: string) {
    super(`Schedule not found: ${id}`);
    this.name = "ScheduleNotFoundError";
  }
}
export class InvalidCronExpressionError extends Error {
  constructor(expr: string) {
    super(`Invalid cron expression: ${expr}`);
    this.name = "InvalidCronExpressionError";
  }
}
export class SectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Section not found: ${id}`);
    this.name = "SectionNotFoundError";
  }
}
export class GenerationFailedError extends Error {
  constructor(msg: string) {
    super(`Generation failed: ${msg}`);
    this.name = "GenerationFailedError";
  }
}

// =============================================================================
// Deps
// =============================================================================

export interface ReportsServiceDeps {
  db: DbClient;
  clock: Clock;
  storage?: FileStorage;
  notifier?: any;
}

function generateId(prefix: string): string {
  return `${prefix}${randomUUID().replace(/-/g, "")}`;
}

export interface ReportsService {
  // Generation
  generateReport(input: GenerateReportInput): Promise<GeneratedReportRow>;
  regenerateReport(reportId: string): Promise<GeneratedReportRow>;

  // Reports
  getReportById(id: string): Promise<GeneratedReportRow>;
  listReports(params: ReportListParams): Promise<{ reports: GeneratedReportRow[]; total: number }>;
  publishReport(input: PublishReportInput & { publishedBy: string }): Promise<GeneratedReportRow>;
  unpublishReport(id: string): Promise<GeneratedReportRow>;
  archiveReport(id: string): Promise<GeneratedReportRow>;
  deleteReport(id: string): Promise<void>;
  exportReportData(reportId: string, format: "csv" | "json"): Promise<Uint8Array>;

  // Templates
  createTemplate(input: CreateReportTemplateInput): Promise<ReportTemplateRow>;
  getTemplateById(id: string): Promise<ReportTemplateRow>;
  updateTemplate(input: UpdateReportTemplateInput): Promise<ReportTemplateRow>;
  deleteTemplate(id: string): Promise<void>;
  listTemplates(params: TemplateListParams): Promise<{ templates: ReportTemplateRow[]; total: number }>;
  setDefaultTemplate(id: string): Promise<ReportTemplateRow>;

  // Sections
  getReportSections(reportId: string): Promise<ReportSectionRow[]>;
  getSectionById(id: string): Promise<ReportSectionRow>;
  updateSection(input: UpdateSectionInput): Promise<ReportSectionRow>;

  // Schedules
  createSchedule(input: CreateReportScheduleInput): Promise<ReportScheduleRow>;
  getScheduleById(id: string): Promise<ReportScheduleRow>;
  updateSchedule(input: UpdateReportScheduleInput): Promise<ReportScheduleRow>;
  deleteSchedule(id: string): Promise<void>;
  listSchedules(params: ScheduleListParams): Promise<{ schedules: ReportScheduleRow[]; total: number }>;
  runScheduledReports(): Promise<number>;

  // Audit
  getAuditLogs(params: AuditLogListParams): Promise<{ logs: ReportAuditLogRow[]; total: number }>;
  getReportAuditLogs(reportId: string): Promise<ReportAuditLogRow[]>;

  // Public
  getPublicReport(id: string): Promise<GeneratedReportRow>;
  listPublicReports(params: { reportType?: ReportType; year?: number }): Promise<GeneratedReportRow[]>;
}

// =============================================================================
// Impl
// =============================================================================

export function createReportsService(deps: ReportsServiceDeps): ReportsService {
  const { db, clock } = deps;

  async function requireReport(id: string): Promise<GeneratedReportRow> {
    const [row] = await db.select().from(generatedReports).where(eq(generatedReports.id, id)).limit(1);
    if (!row) throw new ReportNotFoundError(id);
    return row;
  }

  async function requireTemplate(id: string): Promise<ReportTemplateRow> {
    const [row] = await db.select().from(reportTemplates).where(eq(reportTemplates.id, id)).limit(1);
    if (!row) throw new TemplateNotFoundError(id);
    return row;
  }

  async function requireSchedule(id: string): Promise<ReportScheduleRow> {
    const [row] = await db.select().from(reportSchedules).where(eq(reportSchedules.id, id)).limit(1);
    if (!row) throw new ScheduleNotFoundError(id);
    return row;
  }

  async function requireSection(id: string): Promise<ReportSectionRow> {
    const [row] = await db.select().from(reportSections).where(eq(reportSections.id, id)).limit(1);
    if (!row) throw new SectionNotFoundError(id);
    return row;
  }

  async function createAuditLog(input: {
    reportId?: string | null;
    action: string;
    actionedBy?: string | null;
    details?: any;
  }) {
    const now = clock.now();
    await db.insert(reportAuditLogs).values({
      id: generateId("rptaudit_"),
      reportId: input.reportId ?? null,
      action: input.action as any,
      actionedBy: input.actionedBy ?? null,
      actionedAt: now,
      details: input.details ? JSON.stringify(input.details) : null,
      createdAt: now,
    });
  }

  async function collectMetrics(period: { start: Date; end: Date }): Promise<Record<string, any>> {
    // Simplified metrics collection: counts from tables if they exist, otherwise 0
    // We attempt to query each table, ignoring errors if table doesn't exist in test env
    const metrics: Record<string, any> = {};

    try {
      // Users
      const { users } = await import("../db/schema/users.ts");
      const [userCount] = await db.select({ count: count() }).from(users);
      metrics.totalUsers = Number(userCount?.count ?? 0);
    } catch {
      metrics.totalUsers = 0;
    }

    try {
      const { policyPolls, policyVotes } = await import("../db/schema/policy-polls.ts");
      const [pollCount] = await db.select({ count: count() }).from(policyPolls);
      const [voteCount] = await db.select({ count: count() }).from(policyVotes);
      metrics.pollsConducted = Number(pollCount?.count ?? 0);
      metrics.pollParticipants = Number(voteCount?.count ?? 0);
    } catch {
      metrics.pollsConducted = 0;
      metrics.pollParticipants = 0;
    }

    try {
      const { evidence } = await import("../db/schema/evidence.ts");
      const [evCount] = await db.select({ count: count() }).from(evidence);
      metrics.evidenceUploads = Number(evCount?.count ?? 0);
    } catch {
      metrics.evidenceUploads = 0;
    }

    try {
      const { lawyers } = await import("../db/schema/lawyers.ts");
      const [lawyerCount] = await db.select({ count: count() }).from(lawyers);
      metrics.lawyersOnboarded = Number(lawyerCount?.count ?? 0);
    } catch {
      metrics.lawyersOnboarded = 0;
    }

    try {
      const { blogPosts } = await import("../db/schema/blog.ts");
      const [postCount] = await db.select({ count: count() }).from(blogPosts);
      metrics.blogArticlesPublished = Number(postCount?.count ?? 0);
    } catch {
      metrics.blogArticlesPublished = 0;
    }

    try {
      const { moderationQueue } = await import("../db/schema/moderation.ts");
      const [modCount] = await db.select({ count: count() }).from(moderationQueue);
      metrics.moderationItems = Number(modCount?.count ?? 0);
    } catch {
      metrics.moderationItems = 0;
    }

    metrics.period = { start: period.start.toISOString(), end: period.end.toISOString() };
    metrics.generatedAt = clock.now().toISOString();

    return metrics;
  }

  return {
    // ----------------------------------------------------------------------
    // Generation
    // ----------------------------------------------------------------------
    async generateReport(input) {
      const validated = generateReportSchema.parse(input);
      const now = clock.now();

      // Determine period
      let periodStart: Date;
      let periodEnd: Date;
      if (validated.periodStart && validated.periodEnd) {
        periodStart = validated.periodStart;
        periodEnd = validated.periodEnd;
      } else {
        const period = validated.reportType === "annual" ? getAnnualPeriod(now) : getQuarterlyPeriod(now);
        periodStart = period.start;
        periodEnd = period.end;
      }

      // Select template
      let template: ReportTemplateRow | null = null;
      if (validated.templateId) {
        template = await requireTemplate(validated.templateId);
      } else {
        // Find default template for this type
        const [def] = await db
          .select()
          .from(reportTemplates)
          .where(and(eq(reportTemplates.reportType, validated.reportType), eq(reportTemplates.isDefault, true)))
          .limit(1);
        if (def) template = def;
        else {
          const [anyT] = await db
            .select()
            .from(reportTemplates)
            .where(eq(reportTemplates.reportType, validated.reportType))
            .limit(1);
          if (anyT) template = anyT;
        }
      }

      // Collect metrics
      const metrics = await collectMetrics({ start: periodStart, end: periodEnd });

      const title =
        validated.reportType === "annual"
          ? `Annual Transparency Report ${periodStart.getFullYear()}`
          : `Quarterly Report Q${Math.floor(periodStart.getMonth() / 3) + 1} ${periodStart.getFullYear()}`;

      const summary = `Transparency report covering ${periodStart.toISOString()} to ${periodEnd.toISOString()}. Generated with ${Object.keys(metrics).length} metric groups.`;

      const [report] = await db
        .insert(generatedReports)
        .values({
          id: generateId("rpt_"),
          templateId: template?.id ?? null,
          reportType: validated.reportType,
          periodStart,
          periodEnd,
          title,
          summary,
          status: "draft",
          data: JSON.stringify({ metrics }),
          metrics: JSON.stringify(metrics),
          version: 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!report) throw new GenerationFailedError("Failed to insert report");

      // Create sections from template if exists
      if (template) {
        try {
          const sectionsDef: any[] = JSON.parse(template.sections);
          for (let i = 0; i < sectionsDef.length; i++) {
            const sec = sectionsDef[i];
            await db.insert(reportSections).values({
              id: generateId("rptsec_"),
              reportId: report.id,
              templateSectionId: sec.id ?? null,
              title: sec.title ?? `Section ${i + 1}`,
              content: `# ${sec.title ?? `Section ${i + 1}`}\n\nAuto-generated content for ${sec.dataSource ?? "general"}.\n`,
              order: sec.order ?? i,
              dataSource: sec.dataSource ?? null,
              chartType: sec.chartType ?? null,
              chartData: null,
              createdAt: now,
            });
          }
        } catch {
          // ignore malformed template sections
        }
      } else {
        // Create default sections
        const defaultSections = [
          { title: "Platform Activity", dataSource: "users" },
          { title: "Civic Engagement", dataSource: "polls" },
          { title: "Evidence Integrity", dataSource: "evidence" },
          { title: "Marketplace", dataSource: "lawyers" },
          { title: "Moderation", dataSource: "moderation" },
          { title: "Content", dataSource: "blog" },
        ];
        for (let i = 0; i < defaultSections.length; i++) {
          const sec = defaultSections[i];
          await db.insert(reportSections).values({
            id: generateId("rptsec_"),
            reportId: report.id,
            title: sec.title,
            content: `# ${sec.title}\n\nMetrics: ${JSON.stringify(metrics[sec.dataSource] ?? metrics, null, 2)}`,
            order: i,
            dataSource: sec.dataSource as any,
            createdAt: now,
          });
        }
      }

      await createAuditLog({ reportId: report.id, action: "created", details: { reportType: validated.reportType } });

      return report;
    },

    async regenerateReport(reportId) {
      const existing = await requireReport(reportId);
      const now = clock.now();

      const period = { start: existing.periodStart, end: existing.periodEnd };
      const metrics = await collectMetrics(period);

      const [updated] = await db
        .update(generatedReports)
        .set({
          data: JSON.stringify({ metrics }),
          metrics: JSON.stringify(metrics),
          version: existing.version + 1,
          updatedAt: now,
        })
        .where(eq(generatedReports.id, reportId))
        .returning();

      if (!updated) throw new GenerationFailedError("Failed to regenerate");

      // Regenerate sections content
      const sections = await db.select().from(reportSections).where(eq(reportSections.reportId, reportId));
      for (const sec of sections) {
        await db
          .update(reportSections)
          .set({
            content: `# ${sec.title}\n\nRegenerated at ${now.toISOString()}.\n\nMetrics: ${JSON.stringify(metrics, null, 2).slice(0, 2000)}`,
          })
          .where(eq(reportSections.id, sec.id));
      }

      await createAuditLog({ reportId, action: "regenerated", details: { version: updated.version } });

      return updated;
    },

    // ----------------------------------------------------------------------
    // Reports CRUD
    // ----------------------------------------------------------------------
    async getReportById(id) {
      return requireReport(id);
    },

    async listReports(params) {
      const validated = reportListSchema.parse(params);
      const { page, limit, sortBy, sortOrder } = validated;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (validated.reportType) conditions.push(eq(generatedReports.reportType, validated.reportType));
      if (validated.status) conditions.push(eq(generatedReports.status, validated.status));
      if (validated.periodStart) conditions.push(sql`${generatedReports.periodStart} >= ${validated.periodStart.toISOString()}`);
      if (validated.periodEnd) conditions.push(sql`${generatedReports.periodEnd} <= ${validated.periodEnd.toISOString()}`);

      const where = conditions.length ? and(...conditions) : undefined;

      const [cnt] = await (where
        ? db.select({ count: count() }).from(generatedReports).where(where)
        : db.select({ count: count() }).from(generatedReports));
      const total = Number(cnt?.count ?? 0);

      let orderBy: any;
      if (sortBy === "publishedAt") orderBy = sortOrder === "asc" ? asc(generatedReports.publishedAt) : desc(generatedReports.publishedAt);
      else if (sortBy === "periodEnd") orderBy = sortOrder === "asc" ? asc(generatedReports.periodEnd) : desc(generatedReports.periodEnd);
      else if (sortBy === "createdAt") orderBy = sortOrder === "asc" ? asc(generatedReports.createdAt) : desc(generatedReports.createdAt);
      else orderBy = sortOrder === "asc" ? asc(generatedReports.periodStart) : desc(generatedReports.periodStart);

      const reports = await db.select().from(generatedReports).where(where).orderBy(orderBy).offset(offset).limit(limit);

      return { reports, total };
    },

    async publishReport(input) {
      const validated = publishReportSchema.parse(input);
      const existing = await requireReport(validated.reportId);
      if (existing.status === "published") throw new ReportAlreadyPublishedError(existing.id);
      if (existing.status === "archived") throw new ReportAlreadyArchivedError(existing.id);

      const now = clock.now();
      const [row] = await db
        .update(generatedReports)
        .set({
          status: "published",
          publishedAt: now,
          publishedBy: input.publishedBy,
          title: validated.title ?? existing.title,
          summary: validated.summary ?? existing.summary,
          updatedAt: now,
        })
        .where(eq(generatedReports.id, validated.reportId))
        .returning();

      if (!row) throw new Error("Failed to publish");

      await createAuditLog({ reportId: row.id, action: "published", actionedBy: input.publishedBy });

      return row;
    },

    async unpublishReport(id) {
      const existing = await requireReport(id);
      if (existing.status !== "published") throw new ReportNotPublishedError(id);

      const now = clock.now();
      const [row] = await db
        .update(generatedReports)
        .set({ status: "draft", publishedAt: null, updatedAt: now })
        .where(eq(generatedReports.id, id))
        .returning();

      if (!row) throw new Error("Failed to unpublish");
      await createAuditLog({ reportId: id, action: "updated", details: { action: "unpublish" } });
      return row;
    },

    async archiveReport(id) {
      const existing = await requireReport(id);
      if (existing.status === "archived") throw new ReportAlreadyArchivedError(id);

      const now = clock.now();
      const [row] = await db
        .update(generatedReports)
        .set({ status: "archived", updatedAt: now })
        .where(eq(generatedReports.id, id))
        .returning();

      if (!row) throw new Error("Failed to archive");
      await createAuditLog({ reportId: id, action: "archived" });
      return row;
    },

    async deleteReport(id) {
      await requireReport(id);
      await db.delete(generatedReports).where(eq(generatedReports.id, id));
    },

    async exportReportData(reportId, format) {
      const report = await requireReport(reportId);
      const dataStr = report.data ?? "{}";
      if (format === "json") {
        return new TextEncoder().encode(dataStr);
      } else {
        // Very simple CSV: flatten metrics
        try {
          const parsed = JSON.parse(dataStr);
          const metrics = parsed.metrics ?? parsed;
          let csv = "key,value\n";
          for (const [k, v] of Object.entries(metrics)) {
            const val = typeof v === "object" ? JSON.stringify(v) : String(v);
            csv += `${k},\"${val.replace(/\"/g, '\"\"')}\"\n`;
          }
          return new TextEncoder().encode(csv);
        } catch {
          return new TextEncoder().encode("key,value\nerror,failed to parse\n");
        }
      }
    },

    // ----------------------------------------------------------------------
    // Templates
    // ----------------------------------------------------------------------
    async createTemplate(input) {
      const validated = createReportTemplateSchema.parse(input);

      const [existing] = await db
        .select({ id: reportTemplates.id })
        .from(reportTemplates)
        .where(eq(reportTemplates.name, validated.name))
        .limit(1);
      if (existing) throw new DuplicateTemplateNameError(validated.name);

      const now = clock.now();
      const [row] = await db
        .insert(reportTemplates)
        .values({
          id: generateId("rpttpl_"),
          name: validated.name,
          reportType: validated.reportType,
          description: validated.description ?? null,
          sections: JSON.stringify(validated.sections),
          frequency: validated.frequency ?? "manual",
          isDefault: validated.isDefault ?? false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to create template");

      if (validated.isDefault) {
        // Unset other defaults for same type
        await db
          .update(reportTemplates)
          .set({ isDefault: false })
          .where(and(eq(reportTemplates.reportType, validated.reportType), sql`${reportTemplates.id} != ${row.id}`));
      }

      return row;
    },

    async getTemplateById(id) {
      return requireTemplate(id);
    },

    async updateTemplate(input) {
      const validated = updateReportTemplateSchema.parse(input);
      const existing = await requireTemplate(validated.id);

      if (validated.name && validated.name !== existing.name) {
        const [dup] = await db
          .select({ id: reportTemplates.id })
          .from(reportTemplates)
          .where(and(eq(reportTemplates.name, validated.name), sql`${reportTemplates.id} != ${validated.id}`))
          .limit(1);
        if (dup) throw new DuplicateTemplateNameError(validated.name);
      }

      const now = clock.now();
      const [row] = await db
        .update(reportTemplates)
        .set({
          name: validated.name ?? existing.name,
          description: validated.description !== undefined ? (validated.description as any) : existing.description,
          sections: validated.sections ? JSON.stringify(validated.sections) : existing.sections,
          frequency: (validated.frequency as any) ?? existing.frequency,
          isDefault: validated.isDefault ?? existing.isDefault,
          isActive: validated.isActive ?? existing.isActive,
          updatedAt: now,
        })
        .where(eq(reportTemplates.id, validated.id))
        .returning();

      if (!row) throw new Error("Failed to update template");

      if (validated.isDefault) {
        await db
          .update(reportTemplates)
          .set({ isDefault: false })
          .where(and(eq(reportTemplates.reportType, row.reportType), sql`${reportTemplates.id} != ${row.id}`));
      }

      return row;
    },

    async deleteTemplate(id) {
      await requireTemplate(id);
      await db.delete(reportTemplates).where(eq(reportTemplates.id, id));
    },

    async listTemplates(params) {
      const validated = templateListSchema.parse(params);
      const { page, limit } = validated;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (validated.reportType) conditions.push(eq(reportTemplates.reportType, validated.reportType));
      if (validated.isActive !== undefined) conditions.push(eq(reportTemplates.isActive, validated.isActive));

      const where = conditions.length ? and(...conditions) : undefined;

      const [cnt] = await (where
        ? db.select({ count: count() }).from(reportTemplates).where(where)
        : db.select({ count: count() }).from(reportTemplates));
      const total = Number(cnt?.count ?? 0);

      const templates = await db
        .select()
        .from(reportTemplates)
        .where(where)
        .orderBy(desc(reportTemplates.createdAt))
        .offset(offset)
        .limit(limit);

      return { templates, total };
    },

    async setDefaultTemplate(id) {
      const tmpl = await requireTemplate(id);
      const now = clock.now();

      await db
        .update(reportTemplates)
        .set({ isDefault: false })
        .where(and(eq(reportTemplates.reportType, tmpl.reportType), sql`${reportTemplates.id} != ${id}`));

      const [row] = await db
        .update(reportTemplates)
        .set({ isDefault: true, updatedAt: now })
        .where(eq(reportTemplates.id, id))
        .returning();

      if (!row) throw new Error("Failed to set default");
      return row;
    },

    // ----------------------------------------------------------------------
    // Sections
    // ----------------------------------------------------------------------
    async getReportSections(reportId) {
      await requireReport(reportId);
      return db.select().from(reportSections).where(eq(reportSections.reportId, reportId)).orderBy(asc(reportSections.order));
    },

    async getSectionById(id) {
      return requireSection(id);
    },

    async updateSection(input) {
      const validated = updateSectionSchema.parse(input);
      const existing = await requireSection(validated.id);

      const [row] = await db
        .update(reportSections)
        .set({
          title: validated.title ?? existing.title,
          content: validated.content !== undefined ? (validated.content as any) : existing.content,
          chartType: validated.chartType !== undefined ? (validated.chartType as any) : existing.chartType,
          chartData: validated.chartData !== undefined ? (validated.chartData ? JSON.stringify(validated.chartData) : null) : existing.chartData,
        })
        .where(eq(reportSections.id, validated.id))
        .returning();

      if (!row) throw new Error("Failed to update section");
      return row;
    },

    // ----------------------------------------------------------------------
    // Schedules
    // ----------------------------------------------------------------------
    async createSchedule(input) {
      const validated = createReportScheduleSchema.parse(input);
      if (validated.schedule !== "manual" && !validateCronExpression(validated.schedule)) {
        throw new InvalidCronExpressionError(validated.schedule);
      }

      await requireTemplate(validated.templateId);

      const now = clock.now();
      const nextRun = validated.nextRunAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow

      const [row] = await db
        .insert(reportSchedules)
        .values({
          id: generateId("rptsch_"),
          templateId: validated.templateId,
          reportType: validated.reportType,
          schedule: validated.schedule,
          nextRunAt: nextRun,
          isActive: validated.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to create schedule");
      return row;
    },

    async getScheduleById(id) {
      return requireSchedule(id);
    },

    async updateSchedule(input) {
      const validated = updateReportScheduleSchema.parse(input);
      const existing = await requireSchedule(validated.id);

      if (validated.schedule && validated.schedule !== "manual" && !validateCronExpression(validated.schedule)) {
        throw new InvalidCronExpressionError(validated.schedule);
      }

      if (validated.templateId) {
        await requireTemplate(validated.templateId);
      }

      const now = clock.now();
      const [row] = await db
        .update(reportSchedules)
        .set({
          templateId: validated.templateId ?? existing.templateId,
          schedule: validated.schedule ?? existing.schedule,
          nextRunAt: validated.nextRunAt ?? existing.nextRunAt,
          isActive: validated.isActive ?? existing.isActive,
          updatedAt: now,
        })
        .where(eq(reportSchedules.id, validated.id))
        .returning();

      if (!row) throw new Error("Failed to update schedule");
      return row;
    },

    async deleteSchedule(id) {
      await requireSchedule(id);
      await db.delete(reportSchedules).where(eq(reportSchedules.id, id));
    },

    async listSchedules(params) {
      const validated = scheduleListSchema.parse(params);
      const { page, limit } = validated;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (validated.reportType) conditions.push(eq(reportSchedules.reportType, validated.reportType));
      if (validated.isActive !== undefined) conditions.push(eq(reportSchedules.isActive, validated.isActive));

      const where = conditions.length ? and(...conditions) : undefined;

      const [cnt] = await (where
        ? db.select({ count: count() }).from(reportSchedules).where(where)
        : db.select({ count: count() }).from(reportSchedules));
      const total = Number(cnt?.count ?? 0);

      const schedules = await db
        .select()
        .from(reportSchedules)
        .where(where)
        .orderBy(asc(reportSchedules.nextRunAt))
        .offset(offset)
        .limit(limit);

      return { schedules, total };
    },

    async runScheduledReports() {
      const now = clock.now();
      const due = await db
        .select()
        .from(reportSchedules)
        .where(and(eq(reportSchedules.isActive, true), lte(reportSchedules.nextRunAt, now)));

      let ran = 0;
      for (const sched of due) {
        try {
          await deps.db
            .update(reportSchedules)
            .set({ lastRunAt: now, lastRunStatus: "success" as any, updatedAt: now })
            .where(eq(reportSchedules.id, sched.id));

          // Generate report using its template
          await (async () => {
            const template = sched.templateId ? await db.select().from(reportTemplates).where(eq(reportTemplates.id, sched.templateId)).limit(1).then(r => r[0]) : null;
            const input: GenerateReportInput = {
              reportType: sched.reportType,
              templateId: sched.templateId ?? undefined,
            };
            // Use self generateReport via closure? We call directly
            const period = sched.reportType === "annual" ? getAnnualPeriod(now) : getQuarterlyPeriod(now);
            const metrics = await (async () => {
              // simplified collect
              return { period, generatedAt: now.toISOString() };
            })();

            const title = sched.reportType === "annual" ? `Annual Report ${period.start.getFullYear()}` : `Quarterly Report Q${Math.floor(period.start.getMonth()/3)+1} ${period.start.getFullYear()}`;

            const [report] = await db.insert(generatedReports).values({
              id: generateId("rpt_"),
              templateId: template?.id ?? null,
              reportType: sched.reportType,
              periodStart: period.start,
              periodEnd: period.end,
              title,
              summary: `Auto-generated ${sched.reportType} report`,
              status: "draft",
              data: JSON.stringify(metrics),
              metrics: JSON.stringify(metrics),
              version: 1,
              createdAt: now,
              updatedAt: now,
            }).returning();

            if (report) {
              ran++;
              await createAuditLog({ reportId: report.id, action: "created", details: { scheduled: true, scheduleId: sched.id } });
            }
          })();

          // Calculate next run: simple + 3 months for quarterly, +12 for annual, +1 day for manual (should not auto-run)
          let nextRun = new Date(now);
          if (sched.schedule !== "manual") {
            if (sched.reportType === "quarterly") nextRun = new Date(now.getFullYear(), now.getMonth() + 3, 1);
            else nextRun = new Date(now.getFullYear() + 1, 0, 1);
          } else {
            nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000 * 7); // week later for manual
          }

          await db.update(reportSchedules).set({ nextRunAt: nextRun, lastRunStatus: "success", updatedAt: now }).where(eq(reportSchedules.id, sched.id));
        } catch (e: any) {
          await db.update(reportSchedules).set({ lastRunStatus: "failed", lastRunError: e?.message?.slice(0, 1000) ?? "error", updatedAt: now }).where(eq(reportSchedules.id, sched.id));
        }
      }

      return ran;
    },

    // ----------------------------------------------------------------------
    // Audit
    // ----------------------------------------------------------------------
    async getAuditLogs(params) {
      const validated = auditLogListSchema.parse(params);
      const { page, limit, sortBy, sortOrder } = validated;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (validated.reportId) conditions.push(eq(reportAuditLogs.reportId, validated.reportId));
      if (validated.action) conditions.push(eq(reportAuditLogs.action, validated.action));
      if (validated.actionedBy) conditions.push(eq(reportAuditLogs.actionedBy, validated.actionedBy));

      const where = conditions.length ? and(...conditions) : undefined;

      const [cnt] = await (where
        ? db.select({ count: count() }).from(reportAuditLogs).where(where)
        : db.select({ count: count() }).from(reportAuditLogs));
      const total = Number(cnt?.count ?? 0);

      let orderBy: any;
      if (sortBy === "createdAt") orderBy = sortOrder === "asc" ? asc(reportAuditLogs.createdAt) : desc(reportAuditLogs.createdAt);
      else orderBy = sortOrder === "asc" ? asc(reportAuditLogs.actionedAt) : desc(reportAuditLogs.actionedAt);

      const logs = await db.select().from(reportAuditLogs).where(where).orderBy(orderBy).offset(offset).limit(limit);

      return { logs, total };
    },

    async getReportAuditLogs(reportId) {
      await requireReport(reportId);
      return db.select().from(reportAuditLogs).where(eq(reportAuditLogs.reportId, reportId)).orderBy(desc(reportAuditLogs.actionedAt));
    },

    // ----------------------------------------------------------------------
    // Public
    // ----------------------------------------------------------------------
    async getPublicReport(id) {
      const report = await requireReport(id);
      if (report.status !== "published") throw new ReportNotPublishedError(id);
      return report;
    },

    async listPublicReports(params) {
      const conditions: any[] = [eq(generatedReports.status, "published")];
      if (params.reportType) conditions.push(eq(generatedReports.reportType, params.reportType));
      if (params.year) {
        const start = new Date(params.year, 0, 1);
        const end = new Date(params.year, 11, 31, 23, 59, 59, 999);
        conditions.push(and(gte(generatedReports.periodStart, start), lte(generatedReports.periodEnd, end)) as any);
      }
      const where = and(...conditions);
      return db.select().from(generatedReports).where(where).orderBy(desc(generatedReports.publishedAt));
    },
  };
}
