# Technical Documentation

*Phase 4 of the Najia Community Bridge documentation flow*
*Status: ✅ Phase 4 complete — ready for Phase 5 (Build)*

*Document Set Version: 1.0.0*
*Last Updated: 2026-07-20*
*Owner: Engineering Lead*

> **How to read this folder:** Start with [ARCHITECTURE.md](./ARCHITECTURE.md) for the system philosophy and the high-level architecture. Then use the [Document Map](#document-map) below to find the focused document for any specific topic. For onboarding, see the [Onboarding Paths](#onboarding-paths) section.

> **Maintenance principle:** **One source of truth per topic.** If you find a topic covered in two places, that's a bug — report it. The architecture document is the navigational overview; the focused documents are the authoritative sources.

---

## Document Map

The technical documentation is organized into a top-level architecture document and 9 focused documents. Each focused document covers a specific area in depth and points to the others for cross-cutting concerns.

### The Top-Level Document

| Document | What it is | When to read it |
|----------|------------|------------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | The system philosophy, the high-level architecture, and the cross-cutting patterns | First read; navigation; the architectural overview |

### The Focused Documents

| Document | What it covers | When to read it |
|----------|----------------|------------------|
| [Tech Stack.md](./Tech%20Stack.md) | The technology choices, versions, alternatives, what we did NOT choose | When choosing or evaluating a dependency; when onboarding |
| [ADRs.md](./ADRs.md) | The architectural decisions (12+ ADRs) with context, consequences, and alternatives | When understanding why a decision was made; before proposing a change |
| [Engineering.md](./Engineering.md) | Coding standards, CI, code review, the fee model grep, the voter token pepper | Daily reference; the "how we write code" |
| [QA.md](./QA.md) | Testing strategy, the test pyramid, the negative test rule, security tests | When writing tests; the "how we verify the code" |
| [Database.md](./Database.md) | The database schema, conventions, indexes, the anonymization pattern | When querying the schema; the "what the data looks like" |
| [Security.md](./Security.md) | Threat model, controls, compliance (NDPR, NBA), incident response | When evaluating a security change; the "what we defend against" |
| [Infrastructure.md](./Infrastructure.md) | Deployment, backup, scaling, monitoring, runbooks | When deploying; the "how we run it" |
| [API.md](./API.md) | The API reference (endpoints, request/response, error codes) | When integrating with the API; the "what the API does" |
| [RBAC.md](./RBAC.md) | The RBAC model, roles, permissions, conditions | When implementing a permission check; the "who can do what" |

### The Module Specifications

Each of the 11 modules has its own spec. The module specs are the **contract** for each module: business rules, data model, API surface, permissions, UX, NFRs, acceptance criteria.

| Module | Reference |
|--------|-----------|
| Authentication & Identity Verification | [modules/Authentication & Identity Verification.md](../modules/Authentication%20%26%20Identity%20Verification.md) |
| Policy Polls | [modules/Policy Polls.md](../modules/Policy%20Polls.md) |
| Confidence Votes | [modules/Confidence Votes.md](../modules/Confidence%20Votes.md) |
| Evidence Upload & Integrity | [modules/Evidence Upload & Integrity.md](../modules/Evidence%20Upload%20%26%20Integrity.md) |
| Lawyer Onboarding & Verification | [modules/Lawyer Onboarding & Verification.md](../modules/Lawyer%20Onboarding%20%26%20Verification.md) |
| Lawyer Matching & Consultation | [modules/Lawyer Matching & Consultation.md](../modules/Lawyer%20Matching%20%26%20Consultation.md) |
| Lawyer Reviews | [modules/Lawyer Reviews.md](../modules/Lawyer%20Reviews.md) |
| Moderation | [modules/Moderation.md](../modules/Moderation.md) |
| Blog & Content | [modules/Blog & Content.md](../modules/Blog%20%26%20Content.md) |
| Admin & Operations | [modules/Admin & Operations.md](../modules/Admin%20%26%20Operations.md) |
| Mobile App | [modules/Mobile App.md](../modules/Mobile%20App.md) |

---

## Onboarding Paths

Different roles need different documents. Here's the recommended reading order for each.

### New Engineer (Backend or Full-Stack)

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the system philosophy and the high-level architecture
2. **[ADRs.md](./ADRs.md)** — the 12 key architectural decisions
3. **[Tech Stack.md](./Tech%20Stack.md)** — the technology choices
4. **[Engineering.md](./Engineering.md)** — the engineering standards
5. **[Database.md](./Database.md)** — the schema
6. **[QA.md](./QA.md)** — the testing strategy
7. **[Security.md](./Security.md)** — the security architecture
8. At least 3 module specs in depth (recommend: Authentication, Policy Polls, Lawyer Onboarding)
9. **[Infrastructure.md](./Infrastructure.md)** — the deployment (after you ship your first PR)

### New Engineer (Mobile)

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the system philosophy
2. **[modules/Mobile App.md](../modules/Mobile%20App.md)** — the mobile module spec
3. **[API.md](./API.md)** — the API reference (the mobile app is a client of the API)
4. **[Tech Stack.md §2.4](./Tech%20Stack.md#24-mobile--react-native--expo)** — the mobile stack
5. **[Security.md §3.1](./Security.md#31-authentication)** — the authentication model
6. **[QA.md §7](./QA.md#7-security-tests)** — the security tests for the mobile app
7. **[Infrastructure.md](./Infrastructure.md)** — the deployment and the app store rollout

### New Designer

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the system philosophy
2. **[../product/UX & Design.md](../product/UX%20%26%20Design.md)** — the UX and design standards
3. **[../product/User Journeys.md](../product/User%20Journeys.md)** — the 8 user journeys
4. **[../product/Personas.md](../product/Personas.md)** — the user archetypes
5. The module specs relevant to your area (e.g., [modules/Policy Polls.md](../modules/Policy%20Polls.md), [modules/Lawyer Matching & Consultation.md](../modules/Lawyer%20Matching%20%26%20Consultation.md))
6. **[API.md](./API.md)** — to understand the data shapes

### New Stakeholder (Product, Legal, Operations, Board)

1. **[../PLATFORM.md](../PLATFORM.md)** — what the platform is and what it isn't
2. **[../business/Project Charter.md](../business/Project%20Charter.md)** — the strategic purpose
3. **[../business/Business.md](../business/Business.md)** — the financial model
4. **[../business/Market Research.md](../business/Market%20Research.md)** — the market context
5. **[ARCHITECTURE.md §2](./ARCHITECTURE.md#2-high-level-architecture)** — the high-level architecture (just the diagram and the request flow)
6. **[Security.md §8](./Security.md#8-audit-logging)** — the audit and compliance posture
7. **[Security.md §9](./Security.md#9-compliance)** — the regulatory compliance

### New Auditor (External)

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the system philosophy and the constraints
2. **[Security.md](./Security.md)** — the security architecture and the threat model
3. **[Database.md](./Database.md)** — the schema (with the anonymization pattern)
4. **[API.md](./API.md)** — the API contract
5. **[../business/Decision Log.md](../business/Decision%20Log.md)** — the institutional memory
6. **[../PLATFORM.md §11](../PLATFORM.md#11-risk-register)** — the risk register
7. The module specs relevant to your audit scope

### New Moderator (Kemi persona)

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the system philosophy
2. **[modules/Moderation.md](../modules/Moderation.md)** — the moderation workflow
3. **[../product/User Journeys.md §10](../product/User%20Journeys.md#10-j8--user-appeals-a-moderation-decision)** — the appeals journey
4. **[Security.md §9](./Security.md#9-compliance)** — the regulatory compliance
5. **[../product/Personas.md §3.4](../product/Personas.md#34-kemi--the-moderator)** — your persona and the Kemi test

### New Lawyer (Ngozi persona)

1. **[../PLATFORM.md §5](../PLATFORM.md#5-lawyer-matching--case-referral)** — the lawyer marketplace
2. **[modules/Lawyer Onboarding & Verification.md](../modules/Lawyer%20Onboarding%20%26%20Verification.md)** — the onboarding flow
3. **[../business/Business.md §5.4](../business/Business.md#54-bar-association-fee-splitting-constraint)** — the fee model commitment
4. **[../product/Personas.md §3.3](../product/Personas.md#33-ngozi--the-verified-lawyer)** — your persona and the Ngozi test
5. **[../PLATFORM.md §5.6](../PLATFORM.md#56-risk-mitigation--lawyer-marketplace)** — the lawyer marketplace risks

### New Citizen User (Amara or Tunde persona)

If you're a real user (not a team member), you don't need any of these documents. The platform is designed to be self-explanatory. The non-binding disclaimer on every poll page and the engagement model for lawyers are explained in the product UI.

---

## The Cross-Cutting Concerns

Some topics span multiple documents. Here are the most important ones and where to find them:

| Topic | Where it's covered | Cross-references |
|------|-------------------|------------------|
| **Voter anonymization** | [ADRs.md#009](./ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id) | [Database.md §4.3](./Database.md#43-poll_votes--the-anonymization-critical-table), [Security.md §3.3](./Security.md#33-the-voter-token-anonymization-special-case), [Engineering.md §7](./Engineering.md#7-the-voter-token-pepper-management) |
| **Flat subscription model** | [ADRs.md#011](./ADRs.md#adr-011--flat-subscription-model-for-lawyer-marketplace) | [Engineering.md §6](./Engineering.md#6-the-fee-model-grep-audit), [../business/Business.md §5.4](../business/Business.md#54-bar-association-fee-splitting-constraint) |
| **Self-hosted VPS** | [ADRs.md#008](./ADRs.md#adr-008--self-hosted-vps-behind-wireguard-vpn) | [Infrastructure.md §2](./Infrastructure.md#2-server-provisioning), [Security.md §12](./Security.md#12-security-operations) |
| **Single service architecture** | [ADRs.md#007](./ADRs.md#adr-007--single-deployable-service-with-two-entry-points) | [ARCHITECTURE.md §1.2](./ARCHITECTURE.md#22-the-request-flow) |
| **Manual bar verification** | [ADRs.md#012](./ADRs.md#adr-012--manual-bar-verification-by-moderator) | [modules/Lawyer Onboarding & Verification.md §3.3](../modules/Lawyer%20Onboarding%20%26%20Verification.md) |
| **The negative test rule** | [QA.md §8](./QA.md#8-the-negative-test-rule) | [Engineering.md §3.6](./Engineering.md#36-the-negative-test-rule), every module spec's "Acceptance Criteria" section |
| **The fee model grep** | [Engineering.md §6](./Engineering.md#6-the-fee-model-grep-audit) | [ADRs.md#011](./ADRs.md#adr-011--flat-subscription-model-for-lawyer-marketplace) |
| **NDPR compliance** | [Security.md §9.1](./Security.md#91-ndpr-nigeria-data-protection-regulation) | [../business/Project Charter.md §5](../business/Project%20Charter.md#5-constraints), [../business/Market Research.md §5](../business/Market%20Research.md#5-market-trends) |
| **The 2027 election freeze** | [../product/Roadmap.md §3.3](../product/Roadmap.md#33-phase-2-election-freeze) | [../business/Decision Log BIZ-20260720-11](../business/Decision%20Log.md) |

---

## The Non-Negotiable Constraints

These constraints come from the platform's mission, the regulatory environment, and the trust contract with the users. They are non-negotiable. The full list is in [ARCHITECTURE.md Appendix B](./ARCHITECTURE.md#appendix-b-architectural-constraints-summary). The most important ones:

| Constraint | Source | Enforced by |
|-----------|--------|-------------|
| All polls are non-binding | The platform's mission and the regulatory environment | Disclaimers on every poll page; the Amara test |
| Votes are anonymized | The Amara persona's trust constraint; NDPR | No user_id column; voter token hash; pepper rotation |
| The platform does not take a percentage of legal fees | NBA Rules of Professional Conduct | Data model; service code; CI grep; code review |
| Data is stored within Nigeria (NDPR) | NDPR | Self-hosted VPS in Nigeria |
| All state changes are audit-logged | NDPR; operational best practice | The audit log service |
| Moderation is human-in-the-loop | The platform's trust contract | The AI only flags; humans decide |
| Lawyers cannot see citizen identity before consultation | The lawyer's professional ethics; the Ngozi test | API-level enforcement |
| Evidence integrity is verified on every access | The Tunde persona's trust constraint | Re-hash on access; integrity mismatch triggers alert |
| The same moderator cannot decide both the original and the appeal | Fairness; the Kemi test | Reviewer reassignment at the queue level |

---

## Document Status

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 2.0.0 | 2026-07-20 | Active (rewritten as overview) |
| [Tech Stack.md](./Tech%20Stack.md) | 1.0.0 | 2026-07-20 | Active |
| [ADRs.md](./ADRs.md) | 1.0.0 | 2026-07-20 | Active (12 ADRs; more forthcoming) |
| [Engineering.md](./Engineering.md) | 1.0.0 | 2026-07-20 | Active |
| [QA.md](./QA.md) | 1.0.0 | 2026-07-20 | Active |
| [Database.md](./Database.md) | 1.0.0 | 2026-07-20 | Active |
| [Security.md](./Security.md) | 1.0.0 | 2026-07-20 | Active |
| [Infrastructure.md](./Infrastructure.md) | 1.0.0 | 2026-07-20 | Active |
| [API.md](./API.md) | 1.0.0 | 2026-07-20 | Active |
| [RBAC.md](./RBAC.md) | (forthcoming) | — | Drafted; final version in Phase 5 |

**Upcoming documents:**
- [RBAC.md](./RBAC.md) — the RBAC model, with the full permission matrix and the conditions per role. Drafted in earlier work; will be finalized in Phase 5 (Build) as the implementation confirms the model.
- Additional ADRs (ADR-013 through ADR-020) — the storage layer, AI detection vendor, email service, etc.

---

## Maintenance

The technical documentation is maintained by the Engineering Lead. Updates happen:

- **On every PR that changes a technical decision** — the relevant document is updated in the same PR
- **On every ADR** — the ADR is added to [ADRs.md](./ADRs.md)
- **Quarterly** — a review of all technical documents for accuracy and freshness
- **On every major incident** — the runbooks in [Infrastructure.md](./Infrastructure.md) are updated
- **On every major decision** — the [Decision Log](../business/Decision%20Log.md) and the relevant ADR are updated

The CI pipeline checks that the OpenAPI spec is in sync with [API.md](./API.md) and that the schema is in sync with [Database.md](./Database.md). Drift between documents is a CI failure.

---

## Phase 4 Status

**Phase 4 — Technical Design is complete.** All the technical documents listed above are drafted and ready for Phase 5 (Build).

**What's been done in Phase 4:**
- The architecture document was rewritten as an overview and navigation index (v2.0.0)
- 8 focused technical documents were drafted: Tech Stack, ADRs, Engineering, QA, Database, Security, Infrastructure, API
- The cross-references between documents are established
- The non-negotiable constraints are documented in multiple places
- The onboarding paths for different roles are documented

**What remains for Phase 5 (Build):**
- Finalize [RBAC.md](./RBAC.md) based on implementation learnings
- Add ADRs as technical decisions are made (storage layer, AI vendor, email service, etc.)
- Update [API.md](./API.md) and [Database.md](./Database.md) as the implementation evolves
- Maintain the [Decision Log](../business/Decision%20Log.md) and the ADRs continuously

---

## Contact

For questions about any document in this folder, contact the Engineering Lead. For questions about the documentation flow itself, contact the Project Lead.

---

## Appendix A: Related Folders

| Folder | Phase | Contents |
|--------|-------|----------|
| [`../templates/`](../templates/) | Phase 0 | Reusable templates used across all phases |
| [`../business/`](../business/) | Phase 1 | Project Charter, Business Case, Market Research, Decision Log |
| [`../product/`](../product/) | Phase 2 | PRD, Personas, User Journeys, UX & Design, Roadmap |
| [`../modules/`](../modules/) | Phase 3 | One file per product module (Authentication, Polls, Evidence, etc.) |
| [`../technical/`](../technical/) | Phase 4 | The documents in this folder |
| `../operations/` | Phase 6 (forthcoming) | Operations, Runbooks, Release, Support |
| `../customer/` | Phase 7 (forthcoming) | Marketing, User Guide, FAQ, Troubleshooting |
| `../growth/` | Phase 8 (forthcoming) | Analytics & Experiments |

## Appendix B: Technical Documentation Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial set. Phase 4 documentation complete. The technical/ folder is organized with ARCHITECTURE.md as the overview and 9 focused documents (Tech Stack, ADRs, Engineering, QA, Database, Security, Infrastructure, API, RBAC forthcoming) covering all aspects of the technical design. Onboarding paths are documented for 7 different roles. Cross-cutting concerns and non-negotiable constraints are documented with cross-references. |
That's technical/README.md. A few choices I made worth flagging:

The document is the front door, not a summary. It orients the team to the technical documentation set and tells them where to start, but it doesn't duplicate the content. The principle: read this first, then follow the links to the documents you need.
Role-based onboarding paths (§"Onboarding Paths") are the most useful section. A new engineer has different needs than a new designer, a new stakeholder, a new auditor, a new moderator, or a new lawyer. Each path is a specific sequence of documents to read.
The "Non-Negotiable Constraints" table mirrors the table in ARCHITECTURE.md Appendix B but is more concise. This is intentional — the architectural constraints are referenced from multiple places, and the principle "one source of truth per topic" doesn't mean "only one place that mentions it." A constraint can be mentioned in the architecture document (the source of truth) and in the README (the front door).
The Document Status table is honest about what's drafted and what's forthcoming. RBAC.md is listed as "drafted; final version in Phase 5" because it was drafted in the early sessions but the implementation may reveal changes.
The "Phase 4 Status" section explicitly closes out Phase 4 and points to Phase 5. This is the operational definition of "Phase 4 is complete."
The "Contact" section has a single point of contact (the Engineering Lead) for technical documentation questions. This avoids the diffusion of responsibility that comes with multiple contacts.
Phase 4 is now complete. Here's the final tally for Phase 4:

Phase 4 — Technical Design (10 documents):

ARCHITECTURE.md (rewritten as v2.0.0 — overview and navigation index)
Tech Stack.md
ADRs.md (with 12 ADRs documented)
Engineering.md
QA.md
Database.md
Security.md
Infrastructure.md
API.md
README.md (this document)
Phase 4 output: ✅ Development Ready — the technical design is complete and the codebase can be built against these documents.