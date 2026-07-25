# Governance & Transparency Reports - Specification

**Slice**: Governance & Transparency Reports  
**Reference**: Platform Documentation §14.2  
**Status**: NOT YET IMPLEMENTED  
**Priority**: Medium (important for trust and accountability)  
**Dependencies**: 
- All other slices (polls, confidence votes, evidence, lawyer marketplace, blog)
- Moderation service (for moderation metrics)

---

## Overview

The Governance & Transparency Reports system provides regular, structured reporting on platform activities, ensuring transparency, accountability, and trust. These reports are published on a quarterly and annual basis, covering all aspects of platform operations.

**Purpose:**
- Build trust through transparency
- Provide accountability to stakeholders
- Enable data-driven decision making
- Comply with governance requirements
- Support impact assessment and improvement

---

## Report Types

### Quarterly Reports

Published every 3 months (January, April, July, October).

**Sections:**
1. **Platform Activity**
2. **Evidence Statistics**
3. **Marketplace Metrics**
4. **Moderation Actions**
5. **Financial Summary**
6. **User Feedback**
7. **Content Metrics**

### Annual Reports

Published once per year (typically January for previous year).

**Sections:**
1. **Impact Assessment**
2. **Audit**
3. **Governance**
4. **Future Plans**
5. **Content Review**

---

## Domain Model

### Report Template

Definition of a report template with placeholders.

**Properties:**
- `id`: Unique identifier (prefix: `rpttpl_`)
- `name`: Template name
- `reportType`: `quarterly` | `annual`
- `description`: Template description
- `sections`: JSON array of section definitions
- `frequency`: Reporting frequency
- `isActive`: Boolean
- `createdAt`: When created
- `updatedAt`: When last updated

### Generated Report

An actual generated report instance.

**Properties:**
- `id`: Unique identifier (prefix: `rpt_`)
- `templateId`: Reference to report template
- `reportType`: `quarterly` | `annual`
- `periodStart`: Start of reporting period
- `periodEnd`: End of reporting period
- `title`: Report title
- `summary`: Executive summary
- `status`: `draft` | `published` | `archived`
- `publishedAt`: When published (nullable)
- `publishedBy`: Who published (nullable)
- `data`: JSON with all report data
- `metrics`: JSON with calculated metrics
- `createdAt`: When report was created
- `updatedAt`: When last updated

### Report Section

Individual section within a report.

**Properties:**
- `id`: Unique identifier (prefix: `rptsec_`)
- `reportId`: Reference to parent report
- `templateSectionId`: Reference to template section (nullable)
- `title`: Section title
- `content`: Section content (MDX)
- `order`: Display order
- `dataSource`: Where data comes from
- `chartType`: Type of visualization (nullable)
- `chartData`: JSON data for chart (nullable)
- `createdAt`: When created

### Report Schedule

Scheduling configuration for automatic report generation.

**Properties:**
- `id`: Unique identifier (prefix: `rptsch_`)
- `templateId`: Reference to report template
- `reportType`: `quarterly` | `annual`
- `schedule`: Cron expression or manual
- `nextRunAt`: Next scheduled run time
- `lastRunAt`: Last run time (nullable)
- `lastRunStatus`: `success` | `failed` | `skipped` (nullable)
- `lastRunError`: Error message (nullable)
- `isActive`: Boolean
- `createdAt`: When created
- `updatedAt`: When last updated

### Report Audit Log

Audit trail for report generation and modifications.

**Properties:**
- `id`: Unique identifier (prefix: `rptaudit_`)
- `reportId`: Reference to report
- `action`: `created` | `updated` | `published` | `archived` | `regenerated`
- `actionedBy`: Who performed action (nullable for system)
- `actionedAt`: When action was performed
- `details`: JSON with action-specific details
- `ipAddress`: IP address (nullable)
- `userAgent`: User agent (nullable)

---

## Quarterly Report Structure

Based on platform documentation §14.2.1:

### 1. Platform Activity
- **Polls Conducted**: Number of policy polls conducted
- **Poll Participants**: Number of participants per poll
- **Confidence Votes Conducted**: Number of confidence votes
- **Confidence Vote Participants**: Number of participants per vote
- **Active Users**: Monthly active users, new registrations
- **Verification Statistics**: NIMC/Onfido verification rates

### 2. Evidence Statistics
- **Evidence Uploads**: Total uploads, by type
- **Verifications**: Number of integrity verifications
- **Verification Rate**: Percentage of verified evidence
- **AI Detection Flags**: Number of AI manipulation flags
- **AI Detection Accuracy**: False positive rate, false negative rate (if known)
- **Appeal Statistics**: Number of appeals, success rate

### 3. Marketplace Metrics
- **Lawyers Onboarded**: New lawyers added
- **Active Lawyers**: Currently active and verified
- **Cases Matched**: Number of cases matched to lawyers
- **Consultations Completed**: Free consultations completed
- **Engagements Signed**: Formal engagements signed
- **Pro Bono Cases**: Number of pro bono cases
- **Citizen Satisfaction**: Average rating, review counts

### 4. Moderation Actions
- **Content Reviewed**: Total items reviewed
- **Content Removed**: Items removed, by reason
- **Warnings Issued**: User warnings issued
- **Suspensions**: User suspensions issued
- **Appeals Received**: Number of appeals
- **Appeals Upheld**: Number of appeals upheld
- **Average Resolution Time**: Time to resolve moderation items

### 5. Financial Summary
- **Revenue**: By source (lawyer listings, government polls, etc.)
- **Expenses**: By category (infrastructure, verification, etc.)
- **Net Result**: Revenue - Expenses
- **Funding Received**: Grant funding, donations
- **Funding Gap**: Any shortfall vs. budget

### 6. User Feedback
- **NPS Score**: Net Promoter Score
- **Satisfaction Surveys**: Results from user surveys
- **Complaints**: Number and types of complaints received
- **Compliments**: Positive feedback received
- **Feature Requests**: Most requested features

### 7. Content Metrics
- **Blog Articles Published**: Number of new articles
- **Blog Engagement**: Views, comments, shares
- **Legal Literacy Modules**: Modules published, enrollments
- **Module Completion**: Completion rates, quiz scores
- **Newsletter Growth**: Subscriber count, growth rate

---

## Annual Report Structure

Based on platform documentation §14.2.2:

### 1. Impact Assessment
- **Policy Influence**: How platform data influenced policy discussions
- **Access to Justice**: Cases matched, legal access improved
- **Civic Engagement**: Participation rates, engagement metrics
- **Evidence Integrity**: Impact on dispute resolution
- **Success Stories**: User testimonials, case studies

### 2. Audit
- **Financial Audit**: Independent audit of finances
- **Technical Audit**: Security audit, performance review
- **Compliance Audit**: NDPR compliance, bar association rules
- **Findings**: Audit findings and remediation

### 3. Governance
- **Board Activities**: Board meetings, decisions
- **Advisory Board**: Activities, contributions
- **Policy Changes**: Changes to platform policies
- **Risk Management**: Risks identified and mitigated

### 4. Future Plans
- **Roadmap**: 12-month product roadmap
- **Expansion Plans**: Geographic, feature expansion
- **Funding Strategy**: Sustainability plans
- **Partnerships**: Planned partnerships

### 5. Content Review
- **Editorial Performance**: Blog performance metrics
- **Legal Literacy Impact**: Educational impact assessment
- **Content Quality**: Quality metrics and improvements
- **Audience Growth**: Reach and engagement growth

---

## Use Cases

### UC-01: Generate Quarterly Report (System/Admin)
1. System detects it's the end of a quarter
2. System gathers data from all relevant services
3. System calculates metrics and aggregates data
4. System generates report draft
5. System notifies admin that report is ready for review
6. Admin reviews and publishes report

**Triggers**: End of quarter (Jan 1, Apr 1, Jul 1, Oct 1), manual trigger

### UC-02: Generate Annual Report (System/Admin)
1. System detects it's the end of the year
2. System gathers comprehensive data from all services
3. System calculates annual metrics and trends
4. System generates report draft
5. System notifies admin that report is ready for review
6. Admin reviews, finalizes, and publishes report

**Triggers**: End of year (Jan 1), manual trigger

### UC-03: View Report (Public)
1. User navigates to reports section
2. System lists available reports by type and date
3. User selects a report
4. System displays report with all sections
5. User can download PDF version

**Permissions**: Public (all reports are public)

### UC-04: Export Report Data (Admin)
1. Admin navigates to report management
2. Admin selects a report
3. Admin clicks "Export Data"
4. System exports raw data in CSV/JSON format
5. Admin downloads the data

**Permissions**: `reports:export` (admin only)

### UC-05: Regenerate Report (Admin)
1. Admin navigates to report management
2. Admin selects a report
3. Admin clicks "Regenerate"
4. System re-fetches all data
5. System regenerates report with updated data
6. System creates new version

**Permissions**: `reports:regenerate` (admin only)

### UC-06: Configure Report Template (Admin)
1. Admin navigates to report templates
2. Admin can create, edit, delete templates
3. Admin defines sections and data sources
4. System saves template configuration

**Permissions**: `reports:configure` (admin only)

### UC-07: Schedule Report Generation (Admin)
1. Admin navigates to report scheduling
2. Admin configures schedule for each report type
3. Admin sets cron expressions or manual triggers
4. System saves schedule configuration

**Permissions**: `reports:schedule` (admin only)

### UC-08: View Report Audit Log (Admin)
1. Admin navigates to report audit log
2. System displays all report-related actions
3. Admin can filter by report, action type, date

**Permissions**: `reports:audit` (admin only)

---

## Data Sources

Reports aggregate data from multiple sources:

### Platform Metrics
- **Users**: `users` table
- **Sessions**: `sessions` table
- **Verifications**: `users.verificationStatus`

### Civic Engagement
- **Polls**: `polls`, `votes` tables
- **Confidence Votes**: `confidence_votes` table
- **Official Data**: `officials` table

### Evidence Integrity
- **Evidence**: `evidence` table
- **Audit Trail**: `evidence_audit_events` table
- **AI Detection**: `ai_detection_results` table (when implemented)

### Lawyer Marketplace
- **Lawyers**: `lawyer_profiles` table
- **Reviews**: `lawyer_reviews` table
- **Matching**: Matching service logs

### Moderation
- **Queue**: `moderation_queue` table
- **Actions**: `moderation_actions` table
- **Warnings/Suspensions**: `user_warnings`, `user_suspensions` tables

### Blog & Content
- **Posts**: `blog_posts` table
- **Comments**: `blog_comments` table
- **Views**: `blog_post_views` table
- **Legal Literacy**: `legal_literacy_modules`, `legal_literacy_enrollments` tables

### Financial
- **Payments**: Payment processor data (Paystack)
- **Costs**: Internal cost tracking

---

## API Endpoints

### Reports
- `GET /api/reports` - List available reports (public)
- `GET /api/reports/:id` - Get report details (public)
- `GET /api/reports/:id/pdf` - Download report as PDF (public)
- `GET /api/reports/:id/data` - Get raw report data (admin)

### Templates
- `GET /api/reports/templates` - List templates (admin)
- `POST /api/reports/templates` - Create template (admin)
- `GET /api/reports/templates/:id` - Get template (admin)
- `PUT /api/reports/templates/:id` - Update template (admin)
- `DELETE /api/reports/templates/:id` - Delete template (admin)

### Scheduling
- `GET /api/reports/schedules` - List schedules (admin)
- `POST /api/reports/schedules` - Create schedule (admin)
- `PUT /api/reports/schedules/:id` - Update schedule (admin)
- `DELETE /api/reports/schedules/:id` - Delete schedule (admin)
- `POST /api/reports/schedules/:id/run` - Manual run (admin)

### Generation
- `POST /api/reports/generate` - Generate report manually (admin)
- `GET /api/reports/generation/status` - Check generation status (admin)

### Audit
- `GET /api/reports/:id/audit` - Get report audit log (admin)

---

## Validation Rules

### Generate Report
- `reportType`: Required, `quarterly` | `annual`
- `periodStart`: Optional, date (default: start of current period)
- `periodEnd`: Optional, date (default: end of current period)
- `templateId`: Optional, template ID (default: standard template for type)

### Create Template
- `name`: Required, string (1-100 chars)
- `reportType`: Required, `quarterly` | `annual`
- `description`: Optional, string (max 500 chars)
- `sections`: Required, array of section definitions (1-20 items)

### Create Schedule
- `templateId`: Required, valid template ID
- `reportType`: Required, `quarterly` | `annual`
- `schedule`: Required, valid cron expression or `manual`
- `isActive`: Optional, boolean (default: true)

---

## Cache Strategy

| Data | Cache Key | TTL | Invalidation |
|------|-----------|-----|--------------|
| Report list | `reports:list` | 1 hour | New report published |
| Report details | `reports:details:{id}` | 24 hours | Report updated |
| Report data | `reports:data:{id}` | 1 hour | Report regenerated |
| Templates | `reports:templates` | 1 hour | Template CRUD |
| Schedules | `reports:schedules` | 1 hour | Schedule CRUD |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /api/reports | 60 | 1 minute |
| GET /api/reports/:id | 30 | 1 minute |
| POST /api/reports/generate | 5 | 1 hour |
| Template endpoints | 20 | 1 minute |
| Schedule endpoints | 20 | 1 minute |

---

## RBAC Permissions

| Resource | Citizen | Lawyer | Writer | Moderator | Admin |
|----------|---------|--------|--------|-----------|-------|
| reports:view | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports:download | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports:export | ❌ | ❌ | ❌ | ❌ | ✅ |
| reports:regenerate | ❌ | ❌ | ❌ | ❌ | ✅ |
| reports:configure | ❌ | ❌ | ❌ | ❌ | ✅ |
| reports:schedule | ❌ | ❌ | ❌ | ❌ | ✅ |
| reports:audit | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Report Generation Process

### Data Collection
1. Query all relevant data sources
2. Aggregate data by time period
3. Calculate derived metrics
4. Identify trends and comparisons

### Data Transformation
1. Apply business rules to raw data
2. Calculate percentages, rates, averages
3. Identify outliers and anomalies
4. Generate comparisons (period-over-period, vs. targets)

### Report Assembly
1. Populate template with data
2. Generate visualizations (charts, graphs)
3. Compile MDX content for sections
4. Generate summary and highlights

### Review & Publication
1. Save as draft report
2. Notify admin for review
3. Admin reviews and edits if needed
4. Admin publishes report
5. Make report publicly available

---

## Visualization Types

Reports support various visualization types:

| Type | Description | Data Format |
|------|-------------|------------|
| line_chart | Line chart for trends | { labels, datasets } |
| bar_chart | Bar chart for comparisons | { labels, datasets } |
| pie_chart | Pie chart for proportions | { labels, values } |
| table | Data table | { headers, rows } |
| metric | Single metric display | { value, label, change } |
| progress | Progress bar | { value, max, label } |

---

## Integration Points

### Notification Service
- Notifications sent to admins when:
  - Report generation completes
  - Report generation fails
  - Scheduled report time arrives

### Storage Service
- Store generated reports (PDF, JSON)
- Store report assets (images, charts)

### Email Service
- Send report publication notifications to subscribers
- Send report ready-for-review notifications to admins

---

## Database Schema (Reference)

See implementation in `db/schema/reports.ts`

---

## Implementation Tickets

See `.scratch/reports/issues/` directory for individual implementation tickets.
