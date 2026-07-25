# Operations

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active*
*Owner: Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial set. Establishes the operational responsibilities, the on-call rotation, the incident response coordination, the operational SLAs, and the relationship between operations and the other teams.

> **How to read this document:** This is the **operational reference** for the platform. It defines who is responsible for what, when they are on call, how they respond to incidents, and how they coordinate with other teams. For the technical runbooks, see [Runbooks.md](./Runbooks.md). For the release process, see [Release.md](./Release.md). For customer support, see [Support.md](./Support.md).

> **Related documents:**
> - [../technical/Infrastructure.md](../technical/Infrastructure.md) — the infrastructure architecture and the technical runbooks
> - [../technical/Security.md §10](../technical/Security.md#10-incident-response) — the security incident response
> - [../technical/Engineering.md](../technical/Engineering.md) — the engineering standards
> - [../modules/Admin & Operations.md](../modules/Admin%20&%20Operations.md) — the admin module
> - [../business/Project Charter.md §7](../business/Project%20Charter.md#7-stakeholder-analysis) — the stakeholder map

---

## 1. Operations Philosophy

The operations function exists to keep the platform healthy, respond to incidents quickly, and support the users. Three principles guide our work:

| Principle | Application |
|-----------|-------------|
| **Reliability over features** | A reliable platform is more valuable than a feature-rich unreliable one. We invest in stability before new features. |
| **Documented, not heroic** | Every operational procedure is documented. If it's not documented, it's a risk. Heroes are not a sustainable operational model. |
| **Continuous improvement** | Every incident is a learning opportunity. Post-mortems are blameless and lead to action items. |

---

## 2. Operational Roles and Responsibilities

### 2.1 The Operations Team

The operations team is small in the pilot and grows with the platform.

| Phase | Operations team size | Notes |
|-------|----------------------|-------|
| Pilot | 1 Operations Director (part-time), 1 Engineering Lead (on-call) | The Operations Director is also the Project Lead initially |
| Phase 2 | 1 Operations Director (full-time), 1 Operations Engineer, 1 Engineering Lead (on-call) | The Operations Engineer handles day-to-day ops |
| Year 2 | 2 Operations Engineers, 1 on-call rotation (3 engineers), 1 Operations Director | 24/7 on-call coverage becomes necessary |

### 2.2 The Role Responsibilities

| Responsibility | Owner | Backup |
|---------------|-------|--------|
| **Platform health monitoring** | Operations Engineer | Engineering Lead |
| **Incident response** | On-call engineer | Operations Director |
| **User support (tier 1)** | Operations Engineer | Support contractor (Y2) |
| **User support (tier 2)** | Engineering Lead | Engineering team |
| **User support (tier 3 — code bugs)** | Engineering Lead | Engineering team |
| **Deployment (staging)** | Engineering Lead | Operations Engineer |
| **Deployment (production)** | Engineering Lead | Project Sponsor (approval) |
| **Database operations (backups, restores)** | Engineering Lead | Operations Engineer |
| **Server operations (provisioning, updates)** | Engineering Lead | Operations Engineer |
| **Financial reporting** | Finance Director | Project Sponsor |
| **Transparency report** | Operations Director | Project Sponsor |
| **Moderation operations (queue, escalations)** | Moderation Lead | Operations Director |
| **Advisory Board coordination** | Project Lead | Operations Director |
| **Grievance Committee coordination** | Legal Director | Operations Director |
| **NDPR compliance** | Legal Director | Operations Director |
| **Bar Association liaison** | Legal Director | Project Lead |
| **Donor / funder reporting** | Project Sponsor | Operations Director |
| **Communications (press, public)** | Project Sponsor | Operations Director |

### 2.3 The Cross-Functional Relationships

| Operations ↔ | Relationship |
|--------------|-------------|
| **Engineering** | Operations escalates bugs and infrastructure issues to Engineering. Engineering provides runbooks and incident response. |
| **Product** | Operations reports user feedback and incident patterns to Product. Product prioritizes fixes and improvements. |
| **Moderation** | Operations coordinates the moderation queue with the Moderation Lead. Operations handles user-facing communications about moderation actions. |
| **Legal** | Operations escalates compliance issues, NDPR matters, and Bar Association issues to Legal. Legal provides guidance and sign-off. |
| **Finance** | Operations provides data for financial reporting. Finance reviews and approves financial decisions. |
| **Project Sponsor / Board** | Operations escalates P1 incidents, security incidents, and any decision that requires Board awareness. |

---

## 3. The On-Call Rotation

### 3.1 The Pilot On-Call Setup

In the pilot, the on-call rotation is simple:

- **Primary on-call:** the Engineering Lead
- **Backup on-call:** the Operations Director (who is also the Project Lead initially)
- **Escalation:** the Project Sponsor (for decisions the Engineering Lead cannot make alone)

The on-call engineer is responsible for:
- Responding to alerts within the SLA
- Investigating and mitigating incidents
- Coordinating with the rest of the team as needed
- Communicating status to stakeholders
- Writing the post-mortem

### 3.2 The On-Call Schedule

In the pilot, the on-call is 24/7 but the response is best-effort (the on-call engineer may not be at a computer at 3 AM, but will respond when they see the alert). As the team grows, the on-call becomes a true rotation with defined shifts.

| Phase | On-call structure | Response time |
|-------|-------------------|---------------|
| Pilot | Single engineer, 24/7 best-effort | Within 1 hour (or next business day for non-P1) |
| Phase 2 | 2 engineers, weekday rotation + 24/7 escalation | Within 30 minutes for P1, 1 hour for P2 |
| Year 2 | 3 engineers, 24/7 rotation | Within 15 minutes for P1, 30 minutes for P2 |

### 3.3 The On-Call Responsibilities

When on call, the engineer:

1. **Carries the phone** (or has the alerting system set up to reach them)
2. **Responds to alerts** within the SLA
3. **Investigates and mitigates** incidents
4. **Communicates** status to stakeholders (per the incident communication plan in §6)
5. **Hands off** at the end of the shift (if applicable)
6. **Writes the post-mortem** (for P1 and P2 incidents)

### 3.4 The On-Call Compensation

In the pilot, the on-call is part of the engineering role and is not separately compensated. In Phase 2, the on-call rotation may warrant a small stipend for after-hours availability.

### 3.5 The On-Call Handoff

At the end of each shift (or at the end of each week in the pilot), the on-call engineer hands off to the next engineer. The handoff includes:

- **Active incidents:** any open incidents that need follow-up
- **Recent changes:** any recent deployments or changes that may be related to ongoing issues
- **Upcoming events:** any scheduled maintenance or known events
- **Open follow-ups:** any post-mortem action items that are in progress

---

## 4. Operational SLAs

### 4.1 Availability SLA

| Metric | Target (Pilot) | Target (Year 2) |
|--------|----------------|-----------------|
| **Uptime** | 99.5% (≈ 3.6 hours downtime/month) | 99.9% (≈ 43 minutes downtime/month) |
| **Planned maintenance windows** | Saturday 10:00–12:00 UTC | Same |
| **Unplanned downtime notification** | Within 30 minutes of detection | Within 15 minutes |

Uptime is measured as the percentage of time the platform is available (excluding planned maintenance). The measurement is from the perspective of the user (does the page load?), not the server (is the process running?).

### 4.2 Incident Response SLA

| Severity | Definition | Response time | Resolution time | Communication |
|----------|------------|---------------|-----------------|---------------|
| **P1** | Service is down or a critical feature is broken; a security breach has occurred or is suspected | Immediate (within 15 minutes) | Within 4 hours | Within 30 minutes; updates every 30 minutes |
| **P2** | A non-critical feature is broken or significantly degraded; a potential security issue is being investigated | Within 1 hour | Within 24 hours | Within 1 hour; updates every 2 hours |
| **P3** | A minor issue or a question | Within 1 business day | Within 1 week | Within 1 business day |

Severity definitions are in [../technical/Security.md §10.1](../technical/Security.md#101-severity-levels).

### 4.3 Support Response SLA

| Tier | Channel | Response time | Resolution time |
|------|---------|---------------|-----------------|
| **Tier 1 (general)** | support@, in-app help | Within 1 business day | Within 5 business days |
| **Tier 2 (technical)** | support@ → escalated to engineering | Within 1 business day | Within 3 business days |
| **Tier 3 (bugs)** | GitHub issue / Linear | Within 1 business day | Per the bug's priority |

See [Support.md](./Support.md) for the full support process.

### 4.4 Backup and Recovery SLA

| Component | RPO | RTO | Test frequency |
|-----------|-----|-----|---------------|
| PostgreSQL | 1 hour | 30 minutes | Monthly |
| SQLite cache | 24 hours | 15 minutes | Monthly |
| File storage | 24 hours | 1 hour | Monthly |
| Application configuration | 0 (in Git) | 5 minutes | On every change |

RPO/RTO definitions and the recovery procedures are in [../technical/Infrastructure.md §4](../technical/Infrastructure.md#4-backup-and-disaster-recovery).

### 4.5 NDPR Breach Notification SLA

| Event | Notification deadline | Authority |
|-------|----------------------|-----------|
| **Breach discovered** | Notify Legal Director within 1 hour | Engineering Lead → Legal Director |
| **NDPC notification** | Within 72 hours of breach discovery | Legal Director → NDPC |
| **User notification** | Within 72 hours of breach discovery (if users are affected) | Legal Director → Users |

The NDPR breach notification procedure is in [../technical/Security.md §10.3](../technical/Security.md#103-security-incident-specifics).

---

## 5. Monitoring and Alerting

### 5.1 The Monitoring Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Logs** | Structured JSON to stdout → log aggregator | Searchable operational history |
| **Metrics** | Prometheus-compatible (e.g., Datadog, self-hosted Prometheus) | Dashboards and alerting |
| **Traces** | OpenTelemetry-compatible (when we adopt it) | Request flow visibility |
| **Errors** | Sentry (or similar) | Error tracking and aggregation |
| **Analytics** | PostHog (or similar) | User behavior and feature usage |
| **Uptime** | External uptime monitor (e.g., Better Uptime) | External perspective on availability |

The specific tools are determined in Phase 5 (Build) and documented in the deployment configuration.

### 5.2 The Dashboards

The operational dashboards are at `/admin/dashboards` (in the admin shell). They include:

- **Service health:** uptime, error rate, P95 response time
- **Database:** connection pool usage, query time, slow query count
- **Cache:** hit rate, eviction rate, size
- **Rate limit:** breaches per hour, top offenders
- **Moderation:** queue size, SLA compliance, decision distribution
- **Business metrics:** DAU, MAU, polls completed, cases matched, consultations completed
- **Operational alerts:** active alerts, acknowledged vs. unresolved
- **Financial:** revenue, costs, runway

### 5.3 The Alerting Rules

The alerting rules are in [../technical/Infrastructure.md §6.3](../technical/Infrastructure.md#63-alerting-rules). The most important:

| Condition | Severity | Action |
|-----------|----------|--------|
| Error rate > 5% | P1 | Alert on-call engineer |
| Response time > 1s (P95) for 5 minutes | P2 | Alert engineering team |
| Backup failure | P1 | Investigate immediately |
| Integrity mismatch (evidence) | P1 | Quarantine, investigate |
| Permission denied rate > 10% | P2 | Review RBAC configuration |
| Voter token pepper self-test fails | P1 | Stop startup, investigate |
| NIMC API failure > 5% | P1 | Check NIMC integration |
| Disk usage > 80% | P3 | Clean up logs/cache |
| Database connection pool > 80% | P2 | Scale connections |

### 5.4 The On-Call Alerting Flow

When an alert fires:

1. The alert is sent to the on-call engineer (via PagerDuty, OpsGenie, or similar)
2. The on-call engineer acknowledges the alert (within the SLA)
3. The on-call engineer investigates and mitigates
4. The on-call engineer communicates the status (per the incident communication plan)
5. The on-call engineer resolves the alert when the incident is resolved
6. The on-call engineer writes the post-mortem (for P1 and P2)

---

## 6. Incident Response

### 6.1 The Incident Response Workflow

1. **Detect:** the issue is detected (alert, user report, monitoring)
2. **Triage:** the on-call engineer assesses the severity
3. **Mitigate:** the on-call engineer takes action to stop the bleeding
4. **Investigate:** the root cause is identified
5. **Fix:** the underlying issue is resolved
6. **Communicate:** the status is communicated to stakeholders
7. **Post-mortem:** for P1 and P2 incidents, a blameless post-mortem is written
8. **Action items:** the action items from the post-mortem are tracked and verified

### 6.2 The Severity Classification

| Severity | Definition | Examples |
|----------|------------|----------|
| **P1** | Service is down or a critical feature is broken; a security breach has occurred or is suspected | Platform is unreachable; evidence integrity mismatch; voter token pepper compromise |
| **P2** | A non-critical feature is broken or significantly degraded; a potential security issue is being investigated | A specific endpoint is failing; slow performance; an unusual rate of failed logins |
| **P3** | A minor issue or a question | A typo in the UI; a feature request; a question about how something works |

### 6.3 The Communication Plan

| Severity | Initial communication | Updates | Resolution |
|----------|----------------------|---------|------------|
| **P1** | Within 30 minutes to: Engineering team, Project Sponsor, Legal Director (if security), users (if affected) | Every 30 minutes | Resolution announced to the same channels |
| **P2** | Within 1 hour to: Engineering team | Every 2 hours | Resolution announced in the engineering channel |
| **P3** | Within 1 business day to: the user who reported it | As needed | Resolution communicated to the user |

Communication channels:
- **Internal (engineering):** the engineering Slack channel (or equivalent)
- **Internal (leadership):** the leadership email list
- **External (users):** the in-app banner, the status page (forthcoming), and the newsletter (for non-urgent matters)
- **External (press):** only via the Project Sponsor, per the communications policy

### 6.4 The Security Incident Response

For security incidents specifically, the response is documented in [../technical/Security.md §10.3](../technical/Security.md#103-security-incident-specifics). The key difference from a regular incident:

1. The Legal Director is notified within 1 hour
2. The Board is notified within 4 hours
3. The NDPC is notified within 72 hours (if NDPR data was breached)
4. Users are notified within 72 hours (if affected)
5. The post-mortem is reviewed by the Legal Director before being finalized
6. Law enforcement is contacted (after Legal Director review) if criminal activity is suspected

### 6.5 The Post-Mortem Process

Post-mortems are **blameless**. The goal is to learn, not to blame. The post-mortem is written within 1 week of the incident resolution and includes:

- **Timeline:** what happened, when, who was involved
- **Root cause:** the underlying cause (not just the symptoms)
- **What went well:** the things that worked
- **What went poorly:** the things that didn't
- **Action items:** the things that will be done to prevent recurrence, with owners and deadlines

The post-mortem template is in the runbooks ([Runbooks.md §6](./Runbooks.md#6-post-mortem-template)).

Action items are tracked in the issue tracker and verified at the next post-mortem review (or at the next incident of a similar type).

---

## 7. Operational Procedures

### 7.1 Daily Operations

| Time (UTC) | Activity | Owner |
|------------|----------|-------|
| 08:00 | Check overnight alerts; acknowledge and resolve any open alerts | Operations Engineer |
| 09:00 | Daily standup (15 min) — Engineering Lead, Operations Engineer, Project Lead | All |
| 12:00 | Mid-day check — review metrics, check for any anomalies | Operations Engineer |
| 17:00 | End-of-day check — verify all systems healthy, hand off to on-call | Operations Engineer |
| 02:00 | Nightly backup (automated) | System |
| 03:00 | Nightly SQLite cache backup (automated) | System |
| 04:00 | Nightly blog and RBAC config backup (automated) | System |

### 7.2 Weekly Operations

| Day | Activity | Owner |
|-----|----------|-------|
| Monday | Weekly metrics review (DAU, MAU, error rate, performance) | Operations Director |
| Wednesday | Weekly backup test (restore from backup to staging, verify integrity) | Operations Engineer |
| Friday | Weekly deployment review (what was deployed, any issues) | Engineering Lead |
| Sunday | (no operations; rest day for the team) | — |

### 7.3 Monthly Operations

| Activity | Owner |
|----------|-------|
| Backup and recovery test (full restore drill) | Operations Engineer |
| RBAC override review (active overrides) | Engineering Lead |
| Dependency update review (security advisories, new versions) | Engineering Lead |
| Moderation metrics review (SLA compliance, decision distribution) | Moderation Lead |
| Financial summary review | Finance Director |
| Transparency report data review (preview for the next quarter) | Operations Director |
| Incident review (any P1/P2 incidents, lessons learned) | Operations Director |

### 7.4 Quarterly Operations

| Activity | Owner |
|----------|-------|
| Quarterly transparency report | Operations Director |
| ADRs and Decision Log review | Engineering Lead |
| Post-mortem action items review (verify completion) | Operations Director |
| On-call rotation review (if applicable) | Operations Director |
| Penetration test (annual, or after major changes) | Engineering Lead + Legal Director |
| NDPR compliance review | Legal Director |

### 7.5 Annual Operations

| Activity | Owner |
|----------|-------|
| Annual penetration test (external firm) | Legal Director |
| Annual NDPR compliance audit | Legal Director |
| Annual NBA compliance review | Legal Director |
| Annual infrastructure cost review | Finance Director |
| Annual platform roadmap review | Project Lead |
| Annual post-mortem review (all incidents from the year) | Operations Director |

---

## 8. The On-Call Engineer's Toolkit

The on-call engineer has access to:

### 8.1 The Operational Documentation

- This document (Operations.md) — the operational reference
- [Runbooks.md](./Runbooks.md) — the technical runbooks
- [Release.md](./Release.md) — the release process
- [Support.md](./Support.md) — the support process
- [../technical/Infrastructure.md](../technical/Infrastructure.md) — the infrastructure architecture
- [../technical/Security.md](../technical/Security.md) — the security architecture
- The module specs (linked from the module index) — the per-module design

### 8.2 The Operational Tools

- The admin shell (for user management, role changes, moderation actions)
- The health check endpoint (`/health`)
- The monitoring dashboards
- The log aggregator
- The error tracking tool
- The alert management tool (PagerDuty, OpsGenie, or similar)
- SSH access to the production server (via WireGuard)
- The deployment scripts
- The backup and restore scripts

### 8.3 The Communication Channels

- The engineering Slack channel
- The leadership email list
- The user support email (support@)
- The on-call phone (for P1 alerts)
- The in-app notification system (for user-facing communications)

---

## 9. Operational Metrics and Reporting

### 9.1 The Metrics We Track

| Category | Metric | Source | Dashboard |
|----------|--------|--------|-----------|
| **Service health** | Uptime, error rate, P95 response time | Application logs, monitoring | Service Health |
| **Database** | Connection pool, query time, slow queries | Postgres logs, monitoring | Database |
| **Cache** | Hit rate, eviction rate, size | Application logs | Cache |
| **Rate limit** | Breaches per hour, top offenders | Application logs | Rate Limit |
| **Moderation** | Queue size, SLA compliance, decision distribution | Application logs | Moderation |
| **Business** | DAU, MAU, polls, cases, consultations | Application logs | Business Metrics |
| **Operations** | Active alerts, acknowledged vs. unresolved | Monitoring | Operations |
| **Financial** | Revenue, costs, runway | Paystack, application logs | Financial |
| **Security** | Failed logins, permission denials, integrity checks | Application logs | Security |

### 9.2 The Reports We Generate

| Report | Frequency | Audience | Owner |
|--------|-----------|----------|-------|
| **Daily operations summary** | Daily | Engineering team | Operations Engineer |
| **Weekly metrics review** | Weekly | Engineering team, Project Lead | Operations Director |
| **Monthly board update** | Monthly | Project Sponsor, Board | Project Lead |
| **Quarterly transparency report** | Quarterly | Public, donors, regulators | Operations Director |
| **Annual impact report** | Annually | Public, donors, regulators | Project Lead |
| **Incident post-mortem** | After each P1/P2 incident | Engineering team, Leadership | On-call engineer |
| **NDPR breach notification** | Within 72 hours of breach | NDPC, users (if affected) | Legal Director |

### 9.3 The Transparency Report

The quarterly transparency report is the public-facing operational report. It's generated from the operational data and includes:

- **Platform activity:** MAU, polls conducted, evidence uploads, cases matched, consultations completed
- **Content activity:** blog posts published, legal literacy modules, comments
- **Moderation activity:** queue size, decisions made, appeals, GC reviews
- **Operational metrics:** uptime, incidents, response times
- **Financial summary:** revenue (lawyer subscriptions, government/NGO poll fees), costs, runway
- **Compliance:** NDPR breach notifications (if any), Bar Association engagement
- **Upcoming:** planned features, election freeze (if applicable)

The report is reviewed by the Project Sponsor and the Finance Director before publication. The report is published at `/transparency` on the public site.

---

## 10. Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Single point of failure in the on-call rotation (one engineer) | If that engineer is unavailable, incidents are unmitigated | Medium in the pilot | Backup on-call (Operations Director); escalation to Project Sponsor; documented runbooks so anyone can respond |
| Operational documentation drift (runbooks out of date) | The on-call engineer follows outdated procedures | Medium | Quarterly review of runbooks; CI check that runbook commands still work; review after every incident |
| Alert fatigue (too many low-severity alerts) | Real alerts are missed | Medium | Quarterly review of alerting rules; tune thresholds; alert on symptoms, not causes |
| Operational cost overrun (cloud bills higher than expected) | Year 1 funding gap widens | Medium | Monthly cost review; alerts on spending thresholds; cost optimization levers in the Business Case |
| Loss of key operational knowledge (a team member leaves) | The team loses institutional knowledge | Medium in the pilot | Documented runbooks; cross-training; pair operations with another team member monthly |
| Vendor outage (NIMC, Onfido, Paystack, storage provider) | The platform is degraded | Low–Medium | Fallbacks for each vendor (Onfido for NIMC, manual review for Onfido, manual subscription tracking for Paystack, secondary storage for file storage); vendor SLAs and support contacts documented |
| NDPR data breach | Notification to NDPC within 72 hours; reputational risk | Low | Defense in depth (security architecture); incident response procedure; NDPR-specific runbook |
| Election cycle disruption (Nigeria 2027) | The platform is constrained by the election freeze; potential regulatory action | Medium | Election freeze planned (no new features in 6 months before the election); non-binding framing maintained; Advisory Board engaged |

---

## 11. Open Operational Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the right on-call compensation model in Phase 2? | Operations Director + Finance Director | Open — depends on hiring |
| 2 | Should we have a public status page (e.g., status.najiacommunitybridge.com)? | Operations Director | Open — recommend yes in Year 2 |
| 3 | How do we handle operational knowledge when the team grows? (Documentation, training, etc.) | Operations Director | Open — recommend quarterly cross-training |
| 4 | What is the right vendor diversity strategy? (Avoiding single-vendor lock-in for NIMC, Onfido, Paystack) | Engineering Lead + Legal Director | Open — Y2 review |
| 5 | How do we coordinate with the Advisory Board on operational issues? (If the platform is down during a poll window, the AB needs to know) | Project Lead | Open — recommend quarterly AB updates |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect operations require the Operations Director's sign-off.

---

## Appendix A: Operational Glossary

- **AB** — Advisory Board
- **CASL** — JavaScript library for role-based access control
- **GC** — Grievance Committee
- **IT** — Information Technology
- **NDPR** — Nigeria Data Protection Regulation
- **NDPC** — Nigeria Data Protection Commission
- **NPM** — Node Package Manager
- **P1/P2/P3** — Severity levels for incidents
- **RBAC** — Role-Based Access Control
- **RPO** — Recovery Point Objective
- **RTO** — Recovery Time Objective
- **SLA** — Service Level Agreement
- **SSO** — Single Sign-On
- **TLS** — Transport Layer Security
- **VPC** — Virtual Private Cloud
- **VPN** — Virtual Private Network
- **WAL** — Write-Ahead Log

## Appendix B: Operational Contact Information

| Role | Person | Contact |
|------|--------|---------|
| Engineering Lead | [Name] | engineering@, [phone] |
| Operations Director | [Name] | ops@, [phone] |
| Project Lead | [Name] | project@, [phone] |
| Project Sponsor | [Name] | sponsor@, [phone] |
| Legal Director | [Name] | legal@, [phone] |
| Finance Director | [Name] | finance@, [phone] |
| Moderation Lead | [Name] | moderation@, [phone] |
| On-call (current) | (rotates) | oncall@, [phone] |

## Appendix C: Related Documents
- [../technical/Infrastructure.md](../technical/Infrastructure.md) — the infrastructure architecture and technical runbooks
- [../technical/Security.md](../technical/Security.md) — the security architecture
- [../technical/Engineering.md](../technical/Engineering.md) — the engineering standards
- [../technical/QA.md](../technical/QA.md) — the testing strategy
- [Runbooks.md](./Runbooks.md) — the technical runbooks for the on-call engineer
- [Release.md](./Release.md) — the release process
- [Support.md](./Support.md) — the support process
- [../modules/Admin & Operations.md](../modules/Admin%20&%20Operations.md) — the admin module
- [../business/Project Charter.md §7](../business/Project%20Charter.md#7-stakeholder-analysis) — the stakeholder map
- [../business/Decision Log.md](../business/Decision%20Log.md) — the institutional memory

## Appendix D: Operations Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Operations Director | Initial set. Establishes the operational responsibilities, the on-call rotation (single engineer in the pilot), the operational SLAs (uptime, incident response, support, backup, NDPR breach notification), the monitoring and alerting, the incident response workflow, the operational procedures (daily, weekly, monthly, quarterly, annual), the on-call engineer's toolkit, the operational metrics and reporting (including the quarterly transparency report), and the operational risks. The most important concepts are the on-call rotation (§3), the SLAs (§4), the incident response workflow (§6), and the quarterly transparency report (§9.3). |