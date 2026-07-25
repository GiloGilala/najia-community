# Issue 01: Reports Schema and Database Tables

**Slice**: Governance & Transparency Reports  
**Priority**: Medium  
**Status**: Not Started  
**Depends on**: All other slices (for data sources)  

---

## Description

Create the database schema for the Governance & Transparency Reports system, including tables for report templates, generated reports, report sections, report schedules, and report audit logs.

## Acceptance Criteria

- [ ] `db/schema/reports.ts` exists with properly typed tables
- [ ] All tables follow naming conventions (prefixes: rpttpl_, rpt_, rptsec_, rptsch_, rptaudit_)
- [ ] All foreign key relationships are properly defined
- [ ] Indexes are created for query performance
- [ ] Enums are defined for report types and statuses
- [ ] Schema exports types for use in services
- [ ] Drizzle configuration includes new schema file
- [ ] Migrations are generated and applied

## Tables to Create

### report_templates

Definition of a report template with placeholders.

```typescript
- id: text primary key (rpttpl_ prefix)
- name: text not null (max 100 chars)
- reportType: text not null (enum: quarterly, annual)
- description: text (nullable, max 500 chars)
- sections: text (JSON array) - section definitions
- frequency: text not null (enum: quarterly, annual, manual)
- isActive: boolean not null default true
- isDefault: boolean not null default false
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

### generated_reports

An actual generated report instance.

```typescript
- id: text primary key (rpt_ prefix)
- templateId: text references report_templates(id)
- reportType: text not null (enum: quarterly, annual)
- periodStart: timestamptz not null
- periodEnd: timestamptz not null
- title: text not null (max 200 chars)
- summary: text (nullable, max 2000 chars)
- status: text not null (enum: draft, published, archived)
- publishedAt: timestamptz (nullable)
- publishedBy: text references users (nullable)
- data: text (JSON) - all report data
- metrics: text (JSON) - calculated metrics
- version: integer not null default 1
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

### report_sections

Individual section within a report.

```typescript
- id: text primary key (rptsec_ prefix)
- reportId: text not null references generated_reports(id)
- templateSectionId: text (nullable) - reference to template section
- title: text not null (max 200 chars)
- content: text (MDX, nullable)
- order: integer not null default 0
- dataSource: text (nullable, max 100 chars) - where data comes from
- chartType: text (nullable, max 50 chars) - type of visualization
- chartData: text (JSON, nullable) - data for chart
- createdAt: timestamptz not null default now()
```

### report_schedules

Scheduling configuration for automatic report generation.

```typescript
- id: text primary key (rptsch_ prefix)
- templateId: text references report_templates(id)
- reportType: text not null (enum: quarterly, annual)
- schedule: text not null (max 100 chars) - cron expression or 'manual'
- nextRunAt: timestamptz not null
- lastRunAt: timestamptz (nullable)
- lastRunStatus: text (enum: success, failed, skipped) (nullable)
- lastRunError: text (nullable, max 1000 chars)
- isActive: boolean not null default true
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

### report_audit_logs

Audit trail for report generation and modifications.

```typescript
- id: text primary key (rptaudit_ prefix)
- reportId: text references generated_reports(id)
- action: text not null (enum: created, updated, published, archived, regenerated)
- actionedBy: text references users (nullable for system)
- actionedAt: timestamptz not null
- details: text (JSON, nullable) - action-specific details
- ipAddress: text (nullable, max 45 chars)
- userAgent: text (nullable, max 500 chars)
- createdAt: timestamptz not null default now()
```

## Indexes to Create

```sql
-- report_templates
CREATE INDEX idx_report_templates_type ON report_templates(reportType);
CREATE INDEX idx_report_templates_active ON report_templates(isActive) WHERE isActive = true;
CREATE INDEX idx_report_templates_default ON report_templates(isDefault) WHERE isDefault = true;

-- generated_reports
CREATE INDEX idx_generated_reports_type ON generated_reports(reportType);
CREATE INDEX idx_generated_reports_template ON generated_reports(templateId);
CREATE INDEX idx_generated_reports_status ON generated_reports(status);
CREATE INDEX idx_generated_reports_period ON generated_reports(periodStart, periodEnd);
CREATE INDEX idx_generated_reports_published ON generated_reports(publishedAt);

-- report_sections
CREATE INDEX idx_report_sections_report ON report_sections(reportId);
CREATE INDEX idx_report_sections_order ON report_sections(reportId, order);

-- report_schedules
CREATE INDEX idx_report_schedules_template ON report_schedules(templateId);
CREATE INDEX idx_report_schedules_type ON report_schedules(reportType);
CREATE INDEX idx_report_schedules_next ON report_schedules(nextRunAt);
CREATE INDEX idx_report_schedules_active ON report_schedules(isActive) WHERE isActive = true;

-- report_audit_logs
CREATE INDEX idx_report_audit_logs_report ON report_audit_logs(reportId);
CREATE INDEX idx_report_audit_logs_action ON report_audit_logs(action);
CREATE INDEX idx_report_audit_logs_by ON report_audit_logs(actionedBy);
CREATE INDEX idx_report_audit_logs_at ON report_audit_logs(actionedAt);
```

## Enums to Define

```typescript
export type ReportType = 'quarterly' | 'annual';
export type ReportStatus = 'draft' | 'published' | 'archived';
export type ReportFrequency = 'quarterly' | 'annual' | 'manual';
export type ScheduleStatus = 'success' | 'failed' | 'skipped';
export type ReportAction = 'created' | 'updated' | 'published' | 'archived' | 'regenerated';
export type ChartType = 'line_chart' | 'bar_chart' | 'pie_chart' | 'table' | 'metric' | 'progress';
export type DataSource = 
  | 'users'
  | 'polls'
  | 'votes'
  | 'confidence_votes'
  | 'evidence'
  | 'lawyers'
  | 'lawyer_reviews'
  | 'moderation'
  | 'blog'
  | 'legal_literacy'
  | 'financial';
```

## Notes

- Follow existing schema patterns from `db/schema/blog.ts`, `db/schema/legal-literacy.ts`
- Use `pgTable` for PostgreSQL tables
- The `sections` field in templates stores JSON array of section definitions
- The `data` and `metrics` fields in generated reports store JSON with all report data
- The `chartData` field stores JSON data for visualizations
- Consider adding a `report_subscribers` table for users who want to be notified of new reports
- Consider adding a `report_downloads` table to track report downloads
