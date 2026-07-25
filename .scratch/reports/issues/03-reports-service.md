# Issue 03: Reports Service

**Slice**: Governance & Transparency Reports  
**Priority**: Medium  
**Status**: Not Started  
**Depends on**: Issue 01 (schema), Issue 02 (validation), All other services (for data)  

---

## Description

Create the reports service with all business logic for generating, managing, and publishing transparency reports. This service will aggregate data from all other services and generate comprehensive reports.

## Acceptance Criteria

- [ ] `services/reports.service.ts` exists with complete implementation
- [ ] All service methods follow existing patterns from `services/blog.service.ts`
- [ ] Service uses dependency injection pattern
- [ ] Service properly validates all inputs
- [ ] Service handles errors appropriately (throws typed errors)
- [ ] Service integrates with all other services for data collection
- [ ] Service includes comprehensive JSDoc comments

## Service Interface

```typescript
interface ReportsService {
  // Report Generation
  generateReport(input: GenerateReportInput): Promise<GeneratedReportRow>;
  regenerateReport(reportId: string): Promise<GeneratedReportRow>;
  
  // Reports
  getReportById(id: string): Promise<GeneratedReportRow>;
  listReports(params: ReportListParams): Promise<{ reports: GeneratedReportRow[]; total: number }>;
  publishReport(input: PublishReportInput & { publishedBy: string }): Promise<GeneratedReportRow>;
  unpublishReport(id: string): Promise<GeneratedReportRow>;
  archiveReport(id: string): Promise<GeneratedReportRow>;
  deleteReport(id: string): Promise<void>;
  exportReportData(reportId: string, format: 'csv' | 'json'): Promise<Uint8Array>;
  
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
  runScheduledReports(): Promise<number>; // Run all due schedules
  
  // Audit
  getAuditLogs(params: AuditLogListParams): Promise<{ logs: ReportAuditLogRow[]; total: number }>;
  getReportAuditLogs(reportId: string): Promise<ReportAuditLogRow[]>;
  
  // Data Collection (internal methods)
  collectPlatformMetrics(period: { start: Date; end: Date }): Promise<PlatformMetrics>;
  collectCivicMetrics(period: { start: Date; end: Date }): Promise<CivicMetrics>;
  collectEvidenceMetrics(period: { start: Date; end: Date }): Promise<EvidenceMetrics>;
  collectMarketplaceMetrics(period: { start: Date; end: Date }): Promise<MarketplaceMetrics>;
  collectModerationMetrics(period: { start: Date; end: Date }): Promise<ModerationMetrics>;
  collectContentMetrics(period: { start: Date; end: Date }): Promise<ContentMetrics>;
  collectFinancialMetrics(period: { start: Date; end: Date }): Promise<FinancialMetrics>;
  
  // Public Methods
  getPublicReport(id: string): Promise<PublicReport>;
  listPublicReports(params: { reportType?: ReportType; year?: number }): Promise<PublicReportListItem[]>;
}
```

## Custom Errors

```typescript
// Report Errors
export class ReportNotFoundError extends Error { ... }
export class ReportAlreadyPublishedError extends Error { ... }
export class ReportAlreadyArchivedError extends Error { ... }
export class ReportNotPublishedError extends Error { ... }

// Template Errors
export class TemplateNotFoundError extends Error { ... }
export class DuplicateTemplateNameError extends Error { ... }
export class DefaultTemplateExistsError extends Error { ... }

// Schedule Errors
export class ScheduleNotFoundError extends Error { ... }
export class InvalidCronExpressionError extends Error { ... }
export class ScheduleAlreadyExistsError extends Error { ... }

// Section Errors
export class SectionNotFoundError extends Error { ... }
export class InvalidDataSourceError extends Error { ... }

// Generation Errors
export class GenerationFailedError extends Error { ... }
export class NoDataAvailableError extends Error { ... }
```

## Service Dependencies

```typescript
interface ReportsServiceDeps {
  db: DbClient;
  clock: Clock;
  /** Required: for accessing other services */
  services: {
    auth: AuthService;
    evidence: EvidenceService;
    poll: PollService;
    confidence: ConfidenceService;
    lawyer: LawyerService;
    lawyerReviews: LawyerReviewsService;
    moderation: ModerationService;
    blog: BlogService;
    legalLiteracy: LegalLiteracyService;
  };
  /** Optional: for sending notifications */
  notifier?: Notifier;
  /** Optional: for file storage */
  storage?: FileStorage;
}
```

## Data Types

```typescript
// Metrics types
interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  newRegistrations: number;
  verificationRate: number;
  // ... more metrics
}

interface CivicMetrics {
  pollsConducted: number;
  pollParticipants: number;
  confidenceVotesConducted: number;
  confidenceVoteParticipants: number;
  // ... more metrics
}

interface EvidenceMetrics {
  totalUploads: number;
  uploadsByType: Record<string, number>;
  verificationRate: number;
  aiFlags: number;
  // ... more metrics
}

interface MarketplaceMetrics {
  lawyersOnboarded: number;
  activeLawyers: number;
  casesMatched: number;
  consultationsCompleted: number;
  engagementsSigned: number;
  proBonoCases: number;
  averageRating: number;
  // ... more metrics
}

interface ModerationMetrics {
  itemsReviewed: number;
  itemsRemoved: number;
  warningsIssued: number;
  suspensionsIssued: number;
  appealsReceived: number;
  appealsUpheld: number;
  averageResolutionTime: number;
  // ... more metrics
}

interface ContentMetrics {
  blogArticlesPublished: number;
  blogViews: number;
  blogComments: number;
  legalLiteracyModules: number;
  legalLiteracyEnrollments: number;
  moduleCompletionRate: number;
  // ... more metrics
}

interface FinancialMetrics {
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  netResult: number;
  fundingReceived: number;
  fundingGap: number;
  // ... more metrics
}

// Public report types
interface PublicReport {
  id: string;
  reportType: ReportType;
  period: { start: Date; end: Date };
  title: string;
  summary: string;
  publishedAt: Date;
  sections: PublicReportSection[];
}

interface PublicReportSection {
  title: string;
  content: string;
  chartType?: ChartType;
  chartData?: any;
}

interface PublicReportListItem {
  id: string;
  reportType: ReportType;
  period: { start: Date; end: Date };
  title: string;
  publishedAt: Date;
}
```

## Helper Functions

The service should include helper functions for:

1. **Period calculation**: Calculate report periods (quarterly, annual)
2. **Data aggregation**: Aggregate data from multiple sources
3. **Metric calculation**: Calculate derived metrics
4. **Trend calculation**: Calculate period-over-period trends
5. **Chart data generation**: Generate data for visualizations
6. **MDX generation**: Generate MDX content for report sections
7. **Data export**: Export data to CSV/JSON formats

## Key Business Logic

### Report Generation

```typescript
async function generateReport(input: GenerateReportInput): Promise<GeneratedReportRow> {
  // 1. Validate input
  // 2. Determine period if not provided
  // 3. Select template if not provided
  // 4. Collect all metrics data
  // 5. Generate report sections
  // 6. Calculate summary metrics
  // 7. Store report as draft
  // 8. Create audit log entry
  // 9. Return generated report
}
```

### Data Collection

```typescript
async function collectAllMetrics(period: { start: Date; end: Date }): Promise<AllMetrics> {
  // Collect data from all services in parallel
  const [
    platformMetrics,
    civicMetrics,
    evidenceMetrics,
    marketplaceMetrics,
    moderationMetrics,
    contentMetrics,
    financialMetrics,
  ] = await Promise.all([
    this.collectPlatformMetrics(period),
    this.collectCivicMetrics(period),
    this.collectEvidenceMetrics(period),
    this.collectMarketplaceMetrics(period),
    this.collectModerationMetrics(period),
    this.collectContentMetrics(period),
    this.collectFinancialMetrics(period),
  ]);
  
  return {
    platform: platformMetrics,
    civic: civicMetrics,
    evidence: evidenceMetrics,
    marketplace: marketplaceMetrics,
    moderation: moderationMetrics,
    content: contentMetrics,
    financial: financialMetrics,
  };
}
```

### Section Generation

```typescript
async function generateSection(
  templateSection: TemplateSection,
  metrics: AllMetrics
): Promise<ReportSectionRow> {
  // 1. Get data from specified data source
  // 2. Apply template transformations
  // 3. Generate chart data if chart type specified
  // 4. Generate MDX content
  // 5. Return section
}
```

### Scheduled Report Running

```typescript
async function runScheduledReports(): Promise<number> {
  // 1. Get all active schedules with nextRunAt <= now
  // 2. For each schedule:
  //    a. Update lastRunAt to now
  //    b. Calculate nextRunAt based on schedule
  //    c. Try to generate report
  //    d. Update lastRunStatus and lastRunError
  //    e. Count successful runs
  // 3. Return count of successfully generated reports
}
```

## Integration Points

### All Other Services
- Auth service: User data, verification statistics
- Evidence service: Evidence uploads, verification rates
- Poll service: Poll data, vote counts
- Confidence service: Confidence vote data
- Lawyer service: Lawyer data, matching statistics
- Lawyer Reviews service: Review data, ratings
- Moderation service: Moderation actions, warnings, suspensions
- Blog service: Blog post data, views, comments
- Legal Literacy service: Module data, enrollments, completions

### Notification Service
- Notify admins when:
  - Report generation completes
  - Report generation fails
  - Scheduled report time arrives

### Storage Service
- Store generated report files (PDF, etc.)
- Store report assets (charts, images)

### Email Service
- Send report publication notifications to subscribers

## Notes

- Follow the dependency injection pattern from `services/blog.service.ts`
- Use `createReportsService(deps: ReportsServiceDeps): ReportsService` pattern
- All async methods should properly handle database errors
- Include comprehensive JSDoc comments for all public methods
- Use the validation schemas from Issue 02
- Return proper types from schema
- Throw typed errors for domain-specific failures
- Use the clock dependency for all date/time operations (testability)
- Consider caching report data to improve performance
- Consider implementing incremental report generation for large datasets
- Consider adding a progress tracking system for long-running report generation
