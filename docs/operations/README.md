# Operations Documentation

*Phase 6 of the Najia Community Bridge documentation flow*
*Status: ✅ Phase 6 complete — ready for Phase 7 (Customer Documentation)*

*Document Set Version: 1.0.0*
*Last Updated: 2026-07-20*
*Owner: Operations Director*

> **How to read this folder:** Start with this README for orientation. If you're responding to an incident, go directly to [Runbooks.md](./Runbooks.md). If you're managing a release, go to [Release.md](./Release.md). If you're handling a support request, go to [Support.md](./Support.md). For the overall operational reference, see [Operations.md](./Operations.md).

> **Maintenance principle:** **One source of truth per topic.** If you find a topic covered in two places, that's a bug — report it. The operations documents are operational references; the technical documents (in [`../technical/`](../technical/)) are the design references.

---

## During an Incident

If you're responding to an incident right now, **stop reading this and go to [Runbooks.md](./Runbooks.md).** The first 5 minutes checklist is at the top.

If the incident is a security incident or a suspected NDPR breach, also see [../technical/Security.md §10](../technical/Security.md#10-incident-response) for the security-specific procedure.

---

## Document Map

The operations documentation is organized into 4 focused documents plus this README.

### The Operations Documents

| Document | What it covers | When to read it |
|----------|----------------|------------------|
| [Operations.md](./Operations.md) | Operational roles, on-call rotation, SLAs, monitoring, incident response workflow, operational procedures | When you need the overall operational reference |
| [Runbooks.md](./Runbooks.md) | Scenario-specific runbooks (14 of them), communication templates, post-mortem template, recovery verification | When you're responding to an incident |
| [Release.md](./Release.md) | The formal release process, the release checklist, the rollback plan, the post-release monitoring | When you're planning, executing, or rolling back a release |
| [Support.md](./Support.md) | Customer support process, tier system, SLAs, help center, pilot support | When you're handling a support request or designing the support process |

---

## Onboarding Paths

Different roles need different documents. Here's the recommended reading order for each.

### New On-Call Engineer

1. **[Operations.md](./Operations.md)** — the operational reference
2. **[Runbooks.md](./Runbooks.md)** — the scenario-specific runbooks (read all 14)
3. **[../technical/Infrastructure.md](../technical/Infrastructure.md)** — the infrastructure architecture
4. **[../technical/Security.md](../technical/Security.md)** — the security architecture
5. **[../technical/Engineering.md](../technical/Engineering.md)** — the engineering standards (so you understand the code)
6. **[Release.md](./Release.md)** — the release process (so you understand deployments)
7. **Shadow a senior on-call engineer for at least one shift**

### New Support Team Member

1. **[Support.md](./Support.md)** — the customer support process
2. **[Operations.md §3-§4](./Operations.md)** — the on-call rotation and SLAs
3. **[../product/Personas.md](../product/Personas.md)** — the user archetypes
4. **[../product/User Journeys.md](../product/User%20Journeys.md)** — the user flows
5. **[../modules/Authentication & Identity Verification.md](../modules/Authentication%20&%20Identity%20Verification.md)** — the most common support area
6. **[../modules/Lawyer Matching & Consultation.md](../modules/Lawyer%20Matching%20&%20Consultation.md)** — the second most common support area
7. **Shadow a senior support team member for at least one week**

### New Operations Director

1. **[Operations.md](./Operations.md)** — the operational reference
2. **[Runbooks.md](./Runbooks.md)** — the scenario-specific runbooks
3. **[Release.md](./Release.md)** — the release process
4. **[Support.md](./Support.md)** — the support process
5. **[../technical/Infrastructure.md](../technical/Infrastructure.md)** — the infrastructure architecture
6. **[../business/Business.md](../business/Business.md)** — the financial model (for the cost projections)
7. **[../business/Project Charter.md §7](../business/Project%20Charter.md#7-stakeholder-analysis)** — the stakeholder map

### New Project Sponsor / Board Member

1. **[Operations.md §1-§4](./Operations.md)** — the operational philosophy, roles, SLAs
2. **[Operations.md §9](./Operations.md)** — the metrics and reporting (including the quarterly transparency report)
3. **[Release.md §3.3](./Release.md)** — the go/no-go decision (what to expect during a release)
4. **[Support.md §9](./Support.md)** — the support metrics and reporting
5. **[../business/Project Charter.md](../business/Project%20Charter.md)** — the strategic context

### New Moderator (Kemi persona)

1. **[../product/Personas.md §3.4](../product/Personas.md#34-kemi--the-moderator)** — your persona
2. **[../modules/Moderation.md](../modules/Moderation.md)** — the moderation workflow
3. **[../product/User Journeys.md §10](../product/User%20Journeys.md#10-j8--user-appeals-a-moderation-decision)** — the appeals journey
4. **[../technical/Security.md §9](../technical/Security.md#9-compliance)** — the regulatory compliance
5. **[Operations.md §3](./Operations.md)** — the on-call rotation (if you also do on-call)

---

## The Cross-Cutting Concerns

Some topics span multiple documents. Here are the most important ones and where to find them:

| Topic | Where it's covered | Cross-references |
|------|-------------------|------------------|
| **The on-call rotation** | [Operations.md §3](./Operations.md#3-the-on-call-rotation) | [Runbooks.md §3](./Runbooks.md#3-the-escalation-matrix) (escalation), [Security.md §10.3](../technical/Security.md#103-security-incident-specifics) (security incidents) |
| **The incident response workflow** | [Operations.md §6](./Operations.md#6-incident-response) | [Runbooks.md](./Runbooks.md) (the runbooks), [Security.md §10](../technical/Security.md#10-incident-response) (security incidents) |
| **The post-mortem process** | [Operations.md §6.5](./Operations.md#65-the-post-mortem-process) | [Runbooks.md §6](./Runbooks.md#6-the-post-mortem-template) (the template) |
| **The release process** | [Release.md](./Release.md) | [../technical/Infrastructure.md §3](../technical/Infrastructure.md#3-deployment-process) (the technical deployment) |
| **The rollback plan** | [Release.md §6](./Release.md#6-the-rollback-plan) | [../technical/Infrastructure.md §3.4](../technical/Infrastructure.md#34-rollback) (the technical rollback) |
| **The quarterly transparency report** | [Operations.md §9.3](./Operations.md#93-the-transparency-report) | [../modules/Admin & Operations.md](../modules/Admin%20&%20Operations.md) (the admin module that generates the data) |
| **The support SLAs** | [Support.md §3](./Support.md#3-the-support-tiers) | [Operations.md §4.3](./Operations.md#43-support-response-sla) |
| **The DSAR process** | [Support.md §4.2](./Support.md#42-the-ticket-categories) (the DSAR category) | [../modules/Authentication & Identity Verification.md](../modules/Authentication%20&%20Identity%20Verification.md) (the technical implementation) |
| **The breach notification process** | [Security.md §10.3](../technical/Security.md#103-security-incident-specifics) | [Operations.md §6.4](./Operations.md#64-the-security-incident-response), [Runbooks.md §4.6](./Runbooks.md#46-rb-006-evidence-integrity-mismatch-p1) |
| **The pilot support** | [Support.md §7](./Support.md#7-the-pilot-cohort-support) | [Release.md §5](./Release.md#5-the-pilot-launch-the-first-release) (the pilot launch) |

---

## The Non-Negotiable Constraints

These constraints are operational commitments that cannot be relaxed without a formal decision.

| Constraint | Source | Enforced by |
|-----------|--------|-------------|
| All state changes are audit-logged | NDPR | The audit log service |
| Incident response SLAs are met | [Operations.md §4.2](./Operations.md#42-incident-response-sla) | The alerting and the on-call rotation |
| NDPR breach notification within 72 hours | NDPR | [Security.md §10.3](../technical/Security.md#103-security-incident-specifics) |
| Backups are tested monthly | [../technical/Infrastructure.md §4.6](../technical/Infrastructure.md#46-backup-testing) | The monthly backup test |
| Post-mortems are blameless | [Operations.md §6.5](./Operations.md#65-the-post-mortem-process) | The retrospective process |
| Support SLAs are met | [Support.md §3](./Support.md#3-the-support-tiers) | The SLA tracking |
| The fee model grep fails the build | [../technical/Engineering.md §6](../technical/Engineering.md#6-the-fee-model-grep-audit) | The CI pipeline |
| The voter token pepper is in the environment variable | [../technical/Engineering.md §7](../technical/Engineering.md#7-the-voter-token-pepper-management) | The secret management |
| The negative test rule is satisfied | [../technical/QA.md §8](../technical/QA.md#8-the-negative-test-rule) | The CI pipeline |
| The release gates are met before each release | [Release.md §4](./Release.md#4-the-release-checklist-pre-release) | The go/no-go decision |

---

## Document Status

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| [Operations.md](./Operations.md) | 1.0.0 | 2026-07-20 | Active |
| [Runbooks.md](./Runbooks.md) | 1.0.0 | 2026-07-20 | Active (14 runbooks; updated after each incident) |
| [Release.md](./Release.md) | 1.0.0 | 2026-07-20 | Active (pilot launch in progress) |
| [Support.md](./Support.md) | 1.0.0 | 2026-07-20 | Active (pilot support in progress) |

**Upcoming documents:**
- Additional runbooks will be added as new scenarios are identified
- The support tool migration (Phase 2) will require updates
- The status page (Year 2) will require a new section

---

## Maintenance

The operations documentation is maintained by the Operations Director. Updates happen:

- **After every incident** — the relevant runbook is updated based on the post-mortem
- **After every release** — the release process is updated based on the retrospective
- **Quarterly** — a review of all operations documents for accuracy and freshness
- **After every operational decision** — the Decision Log is updated

The CI pipeline checks that the runbook commands still work (e.g., the database backup script, the health check endpoint). Drift between documents is a CI failure.

---

## Phase 6 Status

**Phase 6 — Release Preparation is complete.** All the operational documents listed above are drafted and ready for the pilot launch.

**What's been done in Phase 6:**
- [Operations.md](./Operations.md) — the operational reference (roles, on-call, SLAs, monitoring, incident response, procedures)
- [Runbooks.md](./Runbooks.md) — 14 scenario-specific runbooks, communication templates, post-mortem template, recovery verification
- [Release.md](./Release.md) — the formal release process (6 phases, 8 gates, rollback plan, post-release monitoring, retrospective)
- [Support.md](./Support.md) — the customer support process (tiers, SLAs, help center, pilot support)

**What remains for Phase 7 (Customer Documentation):**
- The user-facing documentation: the user guide, the FAQ, the troubleshooting guide, the marketing materials
- These are the documents the pilot cohort and the public will see

**What remains for Phase 8 (Post-Launch):**
- The analytics and experimentation framework
- The growth process
- These are the documents and processes for after the launch

---

## Contact

For questions about any document in this folder, contact the Operations Director. For questions about a specific incident, contact the on-call engineer. For questions about the documentation flow itself, contact the Project Lead.

---

## Appendix A: Related Folders

| Folder | Phase | Contents |
|--------|-------|----------|
| [`../templates/`](../templates/) | Phase 0 | Reusable templates used across all phases |
| [`../business/`](../business/) | Phase 1 | Project Charter, Business Case, Market Research, Decision Log |
| [`../product/`](../product/) | Phase 2 | PRD, Personas, User Journeys, UX & Design, Roadmap |
| [`../modules/`](../modules/) | Phase 3 | One file per product module (Authentication, Polls, Evidence, etc.) |
| [`../technical/`](../technical/) | Phase 4 | Architecture, Tech Stack, ADRs, Engineering, QA, Database, Security, Infrastructure, API, RBAC |
| `../operations/` | Phase 6 | The documents in this folder |
| `../customer/` | Phase 7 (forthcoming) | Marketing, User Guide, FAQ, Troubleshooting |
| `../growth/` | Phase 8 (forthcoming) | Analytics & Experiments |

## Appendix B: The Operational Glossary

- **DSAR** — Data Subject Access Request (NDPR)
- **GC** — Grievance Committee
- **IT** — Information Technology
- **LGA** — Local Government Area
- **MDX** — Markdown with JSX
- **NDPR** — Nigeria Data Protection Regulation
- **NDPC** — Nigeria Data Protection Commission
- **NPM** — Node Package Manager
- **P1/P2/P3** — Severity levels for incidents
- **RPO** — Recovery Point Objective
- **RTO** — Recovery Time Objective
- **SLA** — Service Level Agreement
- **VPC** — Virtual Private Cloud
- **VPN** — Virtual Private Network

## Appendix C: The Operational Decision Log

Operational decisions are recorded in the [Decision Log](../business/Decision%20Log.md). The most important operational decisions are:

| Decision | Status |
|----------|--------|
| Self-hosted VPS in Nigeria | ✅ Accepted (ADR-008) |
| Single deployable service | ✅ Accepted (ADR-007) |
| Manual bar verification | ✅ Accepted (ADR-012) |
| Flat subscription for lawyer marketplace | ✅ Accepted (ADR-011) |
| Voter anonymization via hash | ✅ Accepted (ADR-009) |

Future operational decisions (e.g., the support tool for Phase 2) will be added as they are made.

## Appendix D: Operations Documentation Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Operations Director | Initial set. Phase 6 documentation complete. The operations/ folder is organized with this README as the front door, 4 focused documents (Operations, Runbooks, Release, Support), role-based onboarding paths for 5 operational roles, cross-cutting concerns mapped across the documents, the non-negotiable operational constraints, and the maintenance and phase status. The most important document during an incident is [Runbooks.md](./Runbooks.md), and the "During an Incident" section at the top of this README ensures that the on-call engineer can find it fast. |