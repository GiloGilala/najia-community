# Module Spec — Admin & Operations

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Project Sponsor, Product Lead, Design Lead, Legal Director, Operations Director, Finance Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: admin dashboard, user management, lawyer verification oversight, financial reporting, transparency report data, operational alerts and metrics, admin audit trail, role management, system configuration. Out of scope: content moderation (separate module), poll creation (separate module), blog editing (separate module), payment processing (Paystack), external reporting (NDPC, NBA).

---

## 1. Overview

### 1.1 Module Name

Admin & Operations

### 1.2 Purpose

Provide the operational backbone for the staff team: the admin dashboard, user management, lawyer verification oversight, financial reporting, and the operational metrics that keep the platform healthy. The module is the central nervous system for staff actions — every other module's admin endpoints are exposed through this module's shell. The module's primary design constraints are: (1) **separation from the user-facing app** — the admin shell is visually and functionally distinct to prevent accidental admin actions; (2) **every action is audit-logged** — the admin is the highest-stakes user role; (3) **operational visibility** — the dashboard surfaces the metrics the team needs to run the platform.

### 1.3 In Scope

- Admin dashboard (aggregated metrics from all modules)
- User management (search, view, suspend, restore, change role, warn)
- Lawyer verification oversight (view the bar verification queue, override decisions)
- Financial reporting (lawyer subscription revenue, consultation costs, platform costs)
- Transparency report data (the inputs to the quarterly transparency report)
- Operational alerts and metrics (system health, SLA compliance, error rates)
- Admin audit trail (every admin action is logged)
- Role management (assign/revoke roles for moderators, writers, admins)
- System configuration (feature flags, rate limits, etc.)
- DSAR fulfillment (export user data, fulfill deletion requests)
- Operational runbooks (linked, not implemented in code)

### 1.4 Out of Scope

- **Content moderation workflow** — handled by the Moderation module. The Admin module surfaces moderation metrics but doesn't implement the queue.
- **Poll creation and review** — handled by the Policy Polls module.
- **Blog editing** — handled by the Blog & Content module.
- **Payment processing** — Paystack is the payment processor. This module reports on revenue but doesn't process payments.
- **External regulatory reporting** — NDPC breach notifications, NBA reports. The Admin module provides the data; the Legal Director handles the reporting.
- **Financial accounting** — the platform's accounting is done in a separate accounting system. This module provides revenue and cost data for the quarterly transparency report.
- **Customer support tools** — support is handled via email (support@). A support ticketing system is Y2.
- **Infrastructure management** — server provisioning, database administration. This module surfaces health metrics but doesn't manage infrastructure.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Admin dashboard load time | < 1s (P95) | Server-side timing |
| Admin actions SLA (suspension, restoration) | 100% within 24h of decision | Audit log |
| DSAR fulfillment SLA | 100% within 30 days | DSAR queue metrics |
| Audit log completeness | 100% (every admin action logged) | Audit log verification |
| Financial reporting accuracy | 100% (matches Paystack data) | Reconciliation |
| Transparency report data availability | Quarterly, 7 days before publication | Schedule |
| Admin shell separation (no accidental admin actions in user context) | 100% (verified by testing) | UX testing |

---

## 2. User Stories

| As an... | I want to... | So that... | Priority |
|----------|--------------|------------|----------|
| Admin | See the admin dashboard with key metrics | I can understand platform health at a glance | Must |
| Admin | Search for a user by email, name, or ID | I can find specific users | Must |
| Admin | View a user's full profile and history | I can understand their context | Must |
| Admin | Suspend a user with a written reason | I can respond to abuse | Must |
| Admin | Restore a suspended user | I can lift a suspension | Must |
| Admin | Change a user's role | I can grant or revoke permissions | Must |
| Admin | Warn a user | I can flag concerning behavior | Must |
| Admin | View the bar verification queue (read-only; moderators decide) | I can oversee the process | Must |
| Admin | Override a bar verification decision | I can correct errors | Should |
| Admin | View financial data (lawyer subscription revenue, consultation costs) | I can report to the Board | Must |
| Admin | Generate the quarterly transparency report data | I can publish the report | Must |
| Admin | View operational metrics (uptime, error rates, SLA compliance) | I can monitor the system | Must |
| Admin | View the audit log for any admin action | I can investigate issues | Must |
| Admin | Fulfill a DSAR request | I can comply with NDPR | Must |
| Admin | Process an account deletion request | I can comply with the right to be forgotten | Must |
| Admin | Assign a role to a new moderator or writer | I can staff the team | Must |
| Admin | Revoke a role from a staff member | I can respond to departures | Must |
| Admin | Toggle a feature flag | I can manage rollouts | Must |
| Admin | View the operational runbooks | I can respond to incidents | Must |
| Senior Admin | Approve high-stakes actions (e.g., role changes) | I can ensure oversight | Must |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design). Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `admin_audit_log` | `id`, `actor_id` (the admin), `action` (the standard action code), `target_type`, `target_id`, `reason` (the standard reason code), `notes` (free text), `before_state` (JSON), `after_state` (JSON), `created_at`, `ip_address`, `user_agent` | Every admin action is logged here (in addition to the main `audit_log`) |
| `admin_role_assignments` | `id`, `user_id`, `role` (moderator / writer / admin / etc.), `sub_roles` (JSON array), `assigned_by`, `assigned_at`, `revoked_at` (nullable), `revoked_by` (nullable) | Role assignments with history |
| `dsar_requests` | `id`, `user_id`, `request_type` (EXPORT / DELETION), `status` (PENDING / IN_PROGRESS / COMPLETED / DENIED), `requested_at`, `completed_at`, `deliverable_url` (for exports, time-limited), `notes` | DSAR fulfillment tracking |
| `admin_dashboard_widgets` | `id`, `widget_key`, `title`, `description`, `data_source` (the metrics endpoint), `display_order`, `is_enabled` | Configurable dashboard widgets |
| `system_config` | `key`, `value` (JSON), `updated_by`, `updated_at` | Feature flags, rate limits, etc. |
| `feature_flags` | `key`, `enabled` (boolean), `description`, `updated_by`, `updated_at` | Feature flag state |
| `operational_alerts` | `id`, `alert_type`, `severity` (INFO / WARNING / CRITICAL), `message`, `details` (JSON), `created_at`, `acknowledged_at` (nullable), `acknowledged_by` (nullable), `resolved_at` (nullable) | Active alerts |
| `transparency_report_data` | `id`, `report_period` (e.g., "2026-Q3"), `data` (JSON, the full report data), `generated_at`, `published_at` (nullable), `published_by` (nullable) | Quarterly transparency report data |

The Admin module is mostly a consumer of data from other modules. It owns:
- The admin audit log
- Role assignments
- DSAR requests
- System configuration
- Operational alerts (the alert state, not the alert generation — that's distributed across modules)
- Transparency report data

#### 3.1.1 The Admin Audit Log

Every admin action goes through the admin audit log, which is separate from the main `audit_log` for two reasons:
1. Admin actions are higher-stakes and need their own review workflow
2. The admin audit log is queryable by the Board for oversight

The admin audit log captures:
- **Who:** The admin's user ID
- **What:** The action code (from a standard set)
- **On whom:** The target type and ID
- **Why:** The reason code (from a standard set) and free-text notes
- **Before/after:** The state before and after the action (for state-changing actions)
- **When:** Timestamp
- **Where:** IP address and user agent (for security investigation)

The log is append-only. It is never edited or deleted (except for the rare DSAR-driven deletion, which is itself logged).

#### 3.1.2 Role Management

Roles and sub-roles are managed via this module. The roles:

| Role | Description | Who assigns | Sub-roles supported |
|------|-------------|-------------|---------------------|
| `admin` | Full system access | Project Sponsor (one per person, not delegated) | None (admin has everything) |
| `senior_admin` | Approves high-stakes actions | Admin | None |
| `moderator` | Content moderation | Admin | content_moderator, poll_moderator, ai_reviewer, blog_editor |
| `writer` | Blog and legal literacy content | Admin | None |
| `advisory_board` | Poll draft review | Project Lead (per PLATFORM.md §9.3) | None |
| `grievance_committee` | Final appeal review | Legal Director | None |

Sub-roles are assigned when the role is granted. A moderator can have multiple sub-roles (e.g., content_moderator + blog_editor).

Role changes are themselves admin actions and are audit-logged. The new role and sub-roles are recorded, along with the old role and sub-roles.

### 3.2 API Surface

Reference [API.md](../technical/API.md). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `GET` | `/api/admin/dashboard` | Get the admin dashboard data | Authenticated | `admin:dashboard` |
| `GET` | `/api/admin/users` | Search/list users | Authenticated | `admin:users` |
| `GET` | `/api/admin/users/:userId` | Get a user's full profile | Authenticated | `admin:users` |
| `POST` | `/api/admin/users/:userId/suspend` | Suspend a user | Authenticated | `admin:users` |
| `POST` | `/api/admin/users/:userId/restore` | Restore a suspended user | Authenticated | `admin:users` |
| `POST` | `/api/admin/users/:userId/warn` | Issue a warning | Authenticated | `admin:users:warn` |
| `POST` | `/api/admin/users/:userId/change-role` | Change a user's role | Authenticated | `admin:users` (senior for high-stakes) |
| `GET` | `/api/admin/audit-log` | Get the admin audit log | Authenticated | `admin:audit` |
| `GET` | `/api/admin/dsar-requests` | List DSAR requests | Authenticated | `admin:users` |
| `POST` | `/api/admin/dsar-requests/:requestId/fulfill` | Fulfill a DSAR request | Authenticated | `admin:users` |
| `GET` | `/api/admin/transparency-report/:period` | Get the transparency report data for a period | Authenticated | `admin:system` |
| `POST` | `/api/admin/transparency-report/:period/generate` | Generate the transparency report data | Authenticated | `admin:system` |
| `POST` | `/api/admin/transparency-report/:period/publish` | Publish the transparency report | Authenticated | `admin:system` (senior) |
| `GET` | `/api/admin/feature-flags` | List feature flags | Authenticated | `admin:system` |
| `PUT` | `/api/admin/feature-flags/:key` | Update a feature flag | Authenticated | `admin:system` |
| `GET` | `/api/admin/operational-alerts` | List active alerts | Authenticated | `admin:system` |
| `POST` | `/api/admin/operational-alerts/:alertId/acknowledge` | Acknowledge an alert | Authenticated | `admin:system` |
| `POST` | `/api/admin/operational-alerts/:alertId/resolve` | Resolve an alert | Authenticated | `admin:system` |
| `GET` | `/api/admin/financial-summary` | Get the financial summary | Authenticated | `admin:system` |
| `GET` | `/api/admin/health` | Get the system health check | Authenticated | `admin:system` |

#### 3.2.1 Server Functions (Web App)

| Server Function | Purpose |
|-----------------|---------|
| `adminDashboardLoader` | Load the admin dashboard |
| `userSearchAction` | Search for users |
| `userProfileLoader` | Load a user's profile |
| `suspendUserAction` | Suspend a user |
| `restoreUserAction` | Restore a user |
| `changeRoleAction` | Change a user's role |
| `fulfillDsarAction` | Fulfill a DSAR request |
| `transparencyReportLoader` | Load the transparency report data |
| `featureFlagsLoader` | Load feature flags |
| `operationalAlertsLoader` | Load operational alerts |

### 3.3 Business Rules

1. **Every admin action requires a reason.** The reason is from a standard set; free-text notes are also allowed.
2. **Every admin action is audit-logged** with the full context (who, what, whom, why, before/after, when, where).
3. **High-stakes actions require senior admin approval.** Specifically: role changes for `admin` or `senior_admin`, permanent suspensions, DSAR denials.
4. **The admin shell is visually and functionally distinct from the user-facing app.** There is no "admin mode" toggle within the user app; admins switch shells via the avatar menu.
5. **Role changes are themselves admin actions** and are audit-logged. The old and new roles are recorded.
6. **DSAR requests are fulfilled within 30 days** of submission (per the Auth module's SLA).
7. **Account deletion has a 30-day grace period** during which the user can restore (per the Auth module).
8. **The quarterly transparency report is generated 7 days before publication** and reviewed by the Project Sponsor and Finance Director before publication.
9. **Feature flags are documented** — every flag has a description, an owner, and a rollback plan.
10. **Operational alerts are acknowledged and resolved.** Unacknowledged critical alerts page the on-call engineer.
11. **Financial data is reconciled with Paystack monthly.** Discrepancies are investigated.
12. **The admin audit log is preserved for the legally required retention period** (7 years per NDPR, or longer for specific data types).
13. **The admin audit log itself cannot be edited or deleted by any admin.** It is append-only.
14. **All admin actions are rate-limited** (100 actions per admin per hour) to prevent runaway scripts.

### 3.4 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| Admin tries to suspend themselves | "You cannot suspend your own account." | `SELF_SUSPEND_DENIED` (403) |
| Admin tries to change their own role | "You cannot change your own role. Another admin must do this." | `SELF_ROLE_CHANGE_DENIED` (403) |
| Admin tries to suspend the only remaining admin | "There must be at least one active admin. Promote another user first." | `LAST_ADMIN_PROTECTION` (409) |
| Admin tries to grant a role they don't have permission to grant | "You do not have permission to grant this role." | `INSUFFICIENT_PRIVILEGE` (403) |
| High-stakes action attempted without senior admin approval | "This action requires senior admin approval. [Request approval]" | `SENIOR_APPROVAL_REQUIRED` (403) |
| DSAR request denied | The user is notified with the reason (per NDPR). The denial is audit-logged. | — |
| Feature flag toggled without a rollback plan | "This flag does not have a documented rollback plan. Please add one before toggling." | `NO_ROLLBACK_PLAN` (422) |
| Admin action rate limit exceeded | "You've exceeded the admin action rate limit. Please slow down." | `RATE_LIMIT_EXCEEDED` (429) |
| Admin audit log query for a very large range | The query is paginated; the user sees the first page and can paginate. | — |
| Operational alert not acknowledged within SLA | The alert is escalated to the on-call engineer. | (Operational) |
| Admin tries to view another admin's audit log entries (for sensitive actions) | "You do not have permission to view this audit log entry." | `AUDIT_LOG_ACCESS_DENIED` (403) |

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md). This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `admin:dashboard` | `moderator`, `senior_admin`, `admin` | Access to the dashboard |
| `admin:users` | `senior_admin`, `admin` | User management |
| `admin:users:warn` | `moderator`, `senior_admin`, `admin` | Issue warnings |
| `admin:permissions` | `admin` | Role and permission management |
| `admin:system` | `senior_admin`, `admin` | System configuration, feature flags, operational alerts |
| `admin:financial` | `senior_admin`, `admin` | Financial reporting |
| `admin:audit` | `senior_admin`, `admin` | Audit log access |
| `admin:transparency` | `senior_admin`, `admin` | Transparency report generation and publication |

The `senior_admin` role is introduced by this module. It's a step below `admin` and exists to provide oversight without giving full admin access to too many people.

---

## 5. User Experience

### 5.1 The Admin Shell

The admin shell is a separate visual and navigation system from the user-facing app. The shell includes:

- **Top bar:** "Najia Admin" branding, the admin's name and role, a "Switch to user view" link
- **Left sidebar:** Navigation to admin sections (Dashboard, Users, Content, Moderation, Financial, Transparency, System, Audit Log)
- **Main area:** The selected section's content

The shell is intentionally utilitarian — no marketing copy, no decorative imagery. The focus is operational efficiency.

### 5.2 The Admin Dashboard

The dashboard is the first thing an admin sees. It shows:

- **Top metrics row:** Total users, verified users, active lawyers, MAU (last 30 days)
- **Civic engagement:** Active polls, total poll votes (last 30 days), confidence vote participants (last 30 days)
- **Evidence:** Total evidence uploads, AI detection flags pending review, integrity issues
- **Lawyer marketplace:** Active lawyers, matches this month, consultations this month, no-show rate
- **Content:** Published blog posts, published legal literacy modules, comments pending moderation
- **System health:** Uptime (last 30 days), error rate, P95 response time, active alerts
- **Financial:** Lawyer subscription revenue (this month), platform costs (this month), runway

Each metric is clickable to a deeper view.

### 5.3 User Management

The user management section:

- **Search:** By email, name, or user ID
- **User list:** Paginated, with key fields (name, email, role, status, created_at)
- **User detail:** Full profile, verification status, role, activity history, audit log entries for actions on this user
- **Actions:** Suspend, Restore, Warn, Change Role (with reason)

### 5.4 Financial Reporting

The financial section shows:

- **Revenue by stream:** Lawyer subscriptions, government/NGO poll fees, training, etc.
- **Costs by category:** Infrastructure, identity verification, AI detection, development, moderation, legal, marketing, operations
- **Net position:** Revenue minus costs
- **Runway:** Months of operating cost covered by current funds
- **Monthly trend:** Chart of revenue, costs, and net position over the last 12 months
- **Reconciliation status:** Match with Paystack data

### 5.5 Transparency Report Data

The transparency report section:

- **Period selector:** Quarterly (the current period and the last 4 periods)
- **Data preview:** The full report data in a readable format
- **Generate button:** Triggers generation (if not already generated)
- **Review workflow:** The data must be reviewed by the Project Sponsor and Finance Director before publication
- **Publish button:** Publishes the report publicly
- **Historical reports:** Link to all previously published reports

### 5.6 Operational Alerts

The alerts section:

- **Active alerts:** List of unacknowledged and unresolved alerts
- **Acknowledged alerts:** List of acknowledged but unresolved alerts
- **Resolved alerts:** List of recently resolved alerts (last 30 days)
- **Alert detail:** Full context, related metrics, runbook link
- **Acknowledge / Resolve actions**

### 5.7 Feature Flags

The feature flags section:

- **Flag list:** All flags with current state, description, owner, last updated
- **Toggle:** Enable/disable a flag (with confirmation and rollback plan check)
- **History:** When the flag was last toggled, by whom

### 5.8 Accessibility

Same standards as the user-facing app. The admin shell is keyboard-navigable, screen-reader friendly, and uses clear, plain language for all labels and actions.

### 5.9 The Admin Test (Module-Specific)

Beyond the general design principles:

> **Would an admin be able to (1) find any user in under 30 seconds, (2) take a high-stakes action with appropriate oversight, and (3) find the runbook for any alert in one click?**

If the answer to any of these is "no" — the design is not ready. Speed, oversight, and operational visibility are the admin's binding constraints.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Admin dashboard load P95 | < 1s |
| **Performance** | User search P95 | < 500ms |
| **Performance** | User detail load P95 | < 500ms |
| **Performance** | Audit log query (paginated) P95 | < 1s |
| **Performance** | Financial summary P95 | < 1s |
| **Security** | All API endpoints over TLS 1.3 | Yes |
| **Security** | All connections over WireGuard | Yes |
| **Security** | Admin shell is on a separate URL prefix (e.g., `/admin/*`) | Yes |
| **Security** | Admin actions rate-limited | 100 per admin per hour |
| **Security** | Admin audit log is append-only | Verified by DB constraints |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | DSAR data is delivered via a time-limited signed URL | Yes |
| **Reliability** | Admin shell uptime | ≥ 99.5% |
| **Reliability** | DSAR fulfillment SLA | 100% within 30 days |
| **Observability** | Every admin action logged | Yes |
| **Observability** | Operational alerts integrated with the team's alerting system | Yes |
| **Observability** | Audit log queryable by the Board for oversight | Yes |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Every other module | Internal (lateral) | This module aggregates metrics and surfaces admin actions from all other modules |
| Authentication & Identity Verification module | Internal | Admin must be authenticated; user management affects auth state |
| RBAC module | Internal | All admin actions are RBAC-gated |
| Audit log module | Internal | Every action is logged |
| Notification service | Internal | Notify users of admin actions (suspension, etc.); notify admins of alerts |
| Paystack | External | Source of financial data (lawyer subscription revenue) |
| Email service | External | DSAR data delivery, transparency report distribution |
| Postgres + Drizzle ORM | Internal | Primary database |
| Operational monitoring (e.g., Datadog, Sentry) | External | Source of system health metrics |

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Admin Dashboard

- [ ] The dashboard loads in < 1s
- [ ] All key metrics are displayed (users, civic, evidence, marketplace, content, system, financial)
- [ ] Each metric is clickable to a deeper view
- [ ] The dashboard reflects real-time data (updated at least every 5 minutes)

### 8.2 User Management

- [ ] An admin can search for a user by email, name, or ID
- [ ] An admin can view a user's full profile and history
- [ ] An admin can suspend a user with a reason
- [ ] An admin can restore a suspended user
- [ ] An admin can warn a user
- [ ] An admin can change a user's role
- [ ] An admin cannot suspend themselves
- [ ] An admin cannot change their own role
- [ ] An admin cannot remove the last admin
- [ ] All user management actions are audit-logged

### 8.3 Role Management

- [ ] An admin can grant a role with sub-roles
- [ ] An admin can revoke a role
- [ ] Role changes are audit-logged with old and new roles
- [ ] High-stakes role changes require senior admin approval

### 8.4 Financial Reporting

- [ ] Revenue by stream is displayed
- [ ] Costs by category are displayed
- [ ] Net position and runway are calculated correctly
- [ ] Data is reconciled with Paystack monthly
- [ ] Discrepancies are flagged for investigation

### 8.5 Transparency Report

- [ ] The report data is generated 7 days before publication
- [ ] The Project Sponsor and Finance Director review before publication
- [ ] The report is published quarterly
- [ ] Historical reports are accessible

### 8.6 DSAR

- [ ] A user can request a DSAR
- [ ] The request is fulfilled within 30 days
- [ ] The data is delivered via a time-limited signed URL
- [ ] The fulfillment is audit-logged

### 8.7 Operational Alerts

- [ ] Active alerts are displayed
- [ ] An admin can acknowledge an alert
- [ ] An admin can resolve an alert
- [ ] Critical alerts page the on-call engineer if not acknowledged within SLA

### 8.8 Feature Flags

- [ ] All flags are listed with state, description, owner, last updated
- [ ] An admin can toggle a flag
- [ ] Toggling a flag without a rollback plan is rejected
- [ ] The history of flag toggles is preserved

### 8.9 Audit Log

- [ ] Every admin action is logged
- [ ] The log includes who, what, whom, why, before/after, when, where
- [ ] The log is queryable by the Board
- [ ] The log is append-only

### 8.10 Security

- [ ] All API endpoints over TLS 1.3
- [ ] All connections over WireGuard
- [ ] Admin shell on a separate URL prefix
- [ ] Admin actions rate-limited
- [ ] Senior admin approval required for high-stakes actions

### 8.11 Operational

- [ ] Health check includes admin service status
- [ ] Runbooks are linked from relevant alerts
- [ ] Audit log retention meets legal requirements (7 years per NDPR)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests

- `admin.user.service.ts` — user search, suspend, restore, change role
- `admin.role.service.ts` — role assignment, sub-role management
- `admin.audit.service.ts` — audit log creation, query
- `admin.dsar.service.ts` — DSAR fulfillment
- `admin.financial.service.ts` — revenue, cost, runway calculations
- `admin.transparency.service.ts` — report generation, publication
- `admin.alerts.service.ts` — alert acknowledgment, resolution

Coverage target: ≥ 90% on the audit log code (the highest-stakes); ≥ 85% on the rest.

### 9.2 Integration Tests

- Full user management flow: search → view → suspend → notify → audit
- Role change flow: change role → senior approval (if needed) → audit
- DSAR flow: request → fulfillment → URL generation → audit
- Transparency report flow: generate → review → publish
- Operational alert flow: alert fires → acknowledge → resolve
- Feature flag toggle: with rollback plan (allowed) and without (rejected)
- Admin self-protection: cannot suspend self, cannot change own role, cannot remove last admin

### 9.3 E2E Tests

- Full admin workflow from admin shell perspective
- DSAR fulfillment from the user's perspective (request → receive data)
- Transparency report publication from the public's perspective (report appears on the public site)

### 9.4 Manual Tests (during pilot)

- Real user management actions
- Real DSAR fulfillment
- Real transparency report generation and publication
- Edge case: a coordinated abuse event (multiple users, multiple actions)
- Edge case: a critical operational alert at 3 AM

### 9.5 Security Tests (required)

- **Penetration test:** Attempt to access the admin shell without admin role. Must fail.
- **Penetration test:** Attempt to suspend self via direct API call. Must fail.
- **Penetration test:** Attempt to edit the audit log directly. Must fail (DB constraints).
- **Penetration test:** Attempt to bypass senior admin approval for high-stakes actions. Must fail.
- **Code review:** Every change to the admin role management or audit log code is reviewed by the Engineering Lead AND the Legal Director.

### 9.6 The "Negative Test" Rule

For every "admin can do X" test, there must be a matching "admin cannot do X" test. For this module, the negative tests are critical:
- An admin cannot suspend themselves
- An admin cannot change their own role
- An admin cannot remove the last admin
- A non-admin cannot access the admin shell
- An admin cannot edit the audit log
- A non-senior-admin cannot perform high-stakes actions without approval

---

## 10. Rollout Plan

### 10.1 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `admin.module.enabled` | true | Disable the entire admin shell (catastrophic) |
| `admin.dashboard.enabled` | true | Hide the dashboard |
| `admin.user-management.enabled` | true | Disable user management |
| `admin.financial.enabled` | true | Hide financial data |
| `admin.transparency.enabled` | true | Disable transparency report generation |

### 10.2 Migration (if applicable)

Not applicable — greenfield module.

### 10.3 Rollback Plan

- **Admin shell compromise:** This is the catastrophic case. Disable the admin shell, rotate all admin credentials, audit-log review.
- **DSAR backlog:** Add staff. The 30-day SLA may slip temporarily; users are notified.
- **Transparency report data issue:** Delay publication. Investigate. Re-generate. Re-review.
- **Operational alert storm:** The alerting system is configured to deduplicate and rate-limit. If the storm is genuine (not a bug), staff up.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | How many admins and senior admins should the pilot have? | Project Sponsor | Open — recommend 2 admins, 2–3 senior admins |
| 2 | Should the admin shell be a separate app (different codebase) or a separate route prefix? | Engineering Lead | Open — recommend separate route prefix with distinct layout |
| 3 | What is the right audit log retention period? (7 years is the spec per NDPR.) | Legal Director | Open — needs NDPR review |
| 4 | Should the transparency report be auto-generated or manually curated? | Project Sponsor | Open — recommend semi-automated (data is auto, narrative is manual) |
| 5 | How do we handle a senior admin who is unavailable for a high-stakes action? | Project Sponsor | Open — recommend a "two-deep" rule (at least 2 senior admins) |
| 6 | Should admin actions be visible to the affected user in real-time, or batched in a notification? | Product Lead | Open — recommend real-time for suspensions, batched for other actions |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the admin policy or the audit log require Legal Director sign-off.

---

## Appendix A: Glossary
- **DSAR** — Data Subject Access Request (NDPR)
- **GC** — Grievance Committee
- **MDX** — Markdown with JSX
- **NBA** — Nigerian Bar Association
- **NDPR** — Nigeria Data Protection Regulation
- **PII** — Personally Identifiable Information
- **RBAC** — Role-Based Access Control
- **SLA** — Service Level Agreement

## Appendix B: References
- [PRD.md §4.8 — Admin and Operations](../product/PRD.md#48-admin-and-operations)
- [PLATFORM.md §14 — Governance & Oversight](../PLATFORM.md#14-governance--oversight)
- [PLATFORM.md §14.1 — Organizational Structure](../PLATFORM.md#141-organizational-structure)
- [PLATFORM.md §14.2 — Transparency Reports](../PLATFORM.md#142-transparency-reports)
- [ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements)
- [modules/Authentication & Identity Verification.md](./Authentication%20%26%20Identity%20Verification.md) — user management
- [modules/Moderation.md](./Moderation.md) — moderation oversight
- [Business Case §6 — Three-Year Financial Projections](../business/Business.md#6-three-year-financial-projections)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers the admin dashboard, user management, role management, financial reporting, transparency report data, DSAR fulfillment, operational alerts, feature flags, and the admin audit log. 14 business rules, 11 edge cases, 50+ acceptance criteria. The admin audit log and the senior admin approval requirement are the most important design decisions and reflect the platform's commitment to oversight and accountability. |