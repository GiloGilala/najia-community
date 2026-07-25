# Decision Log

*Last Updated: 2026-07-20*
*Owner: Project Lead*
*Custodian: Project Sponsor*

> The Decision Log is the **chronological record of every meaningful decision** made on the project, both business and technical. It is the index; the details live in PRDs, ADRs, and meeting notes — not here. For conventions, status values, and the "how to use" rules, see the [Decision Log template](../templates/Decision%20Log%20Template.md).

---

## Decision Index

| ID | Date | Decision | Category | Status | Owner | Link |
|----|------|----------|----------|--------|-------|------|
| BIZ-20260720-01 | 2026-07-20 | Sustainability, not profit, is the financial bar | Business | ✅ Accepted | Project Sponsor | [Project Charter §2.4](./Project%20Charter.md#24-business-case-summary), [Business Case §2.1](./Business.md#21-mission-aligned-business-model) |
| BIZ-20260720-02 | 2026-07-20 | Lagos-only pilot before national expansion | Business | ✅ Accepted | Project Lead | [Project Charter §6.1](./Project%20Charter.md#61-what-this-project-will-do), [PLATFORM.md §13.2](../PLATFORM.md#132-phase-1-beta-launch-months-46) |
| BIZ-20260720-03 | 2026-07-20 | Year 1 ₦3M funding gap is a hard gate; do not launch pilot without closure | Business | ✅ Accepted | Project Sponsor | [Project Charter §11](./Project%20Charter.md#11-budget-summary), [Business Case §7.1](./Business.md#71-the-3m-year-1-gap--closure-plan) |
| BIZ-20260720-04 | 2026-07-20 | Lawyer marketplace revenue is flat subscription, not percentage of legal fees | Business / Legal | ✅ Accepted | Finance Director | [Business Case §5.4](./Business.md#54-bar-association-fee-splitting-constraint), [PLATFORM.md §5.2.3](../PLATFORM.md#523-fee-structure) |
| BIZ-20260720-05 | 2026-07-20 | Year 3 break-even described as "on paper, no margin"; durable sustainability is a Year 4 target | Business | ✅ Accepted | Finance Director | [Business Case §6.3](./Business.md#63-year-3--sustainability) |
| BIZ-20260720-06 | 2026-07-20 | No single funder may represent more than 40% of total grant funding in any year | Business / Governance | ✅ Accepted | Project Sponsor | [Business Case §7.2](./Business.md#72-diversification-rules) |
| BIZ-20260720-07 | 2026-07-20 | No single revenue stream may represent more than 60% of total revenue by Year 3 | Business / Governance | ✅ Accepted | Project Sponsor | [Business Case §7.2](./Business.md#72-diversification-rules) |
| BIZ-20260720-08 | 2026-07-20 | Avoid direct competition with LawPadi in the SME contract segment; position as complementary | Product / Business | ✅ Accepted | Project Lead | [Market Research §3.4](./Market%20Research.md#34-lawyer-marketplaces) |
| BIZ-20260720-09 | 2026-07-20 | Evidence integrity is the wedge product; the lawyer marketplace is secondary | Product | ✅ Accepted | Product Lead | [Market Research §7.2](./Market%20Research.md#72-evidence-integrity-is-the-standout-differentiator), [§7.3](./Market%20Research.md#73-the-lawyer-marketplace-is-the-risk-not-the-opportunity) |
| BIZ-20260720-10 | 2026-07-20 | Non-binding framing is a feature, not just a compliance note; reinforced throughout product, marketing, and onboarding | Product / Compliance | ✅ Accepted | Project Lead | [Market Research §7.1](./Market%20Research.md#71-the-non-binding-framing-is-a-feature-not-just-a-compliance-note) |
| BIZ-20260720-11 | 2026-07-20 | Feature and marketing freeze 6 months before the 2027 election | Business / Operations | ✅ Accepted | Project Lead | [Market Research §5.3](./Market%20Research.md#53-timing-assessment) |
| BIZ-20260720-12 | 2026-07-20 | Open-source AI detection preferred where accuracy is sufficient; commercial APIs only for highest-accuracy cases | Technical / Business | ✅ Accepted | Engineering Lead | [Business Case §4.2](./Business.md#42-cost-notes-by-category), [PLATFORM.md §10.2.2](../PLATFORM.md#1022-cost-optimization) |
| BIZ-20260720-13 | 2026-07-20 | Security, legal, and NDPR compliance spend is non-discretionary; cost optimization will not touch these | Business / Compliance | ✅ Accepted | Finance Director | [Business Case §4.3](./Business.md#43-cost-optimization-levers) |
| BIZ-20260720-14 | 2026-07-20 | Founder bridge financing is acceptable as a Year 1 contingency, with a written loan agreement and Board approval | Business | ✅ Accepted | Project Sponsor | [Business Case §7.1](./Business.md#71-the-3m-year-1-gap--closure-plan) |
| BIZ-20260720-15 | 2026-07-20 | Pre-pilot primary research (5 items) is a hard gate before Lagos launch | Product | ✅ Accepted | Product Lead | [Market Research §4.3](./Market%20Research.md#43-open-research-questions) |
| BIZ-20260720-16 | 2026-07-20 | The platform will not run advertising, sell citizen data, or charge access fees to citizens | Business / Compliance | ✅ Accepted | Project Sponsor | [Business Case §2.3](./Business.md#23-what-the-platform-will-not-do-revenue), [PLATFORM.md §10.1.2](../PLATFORM.md#1012-prohibited-revenue) |
| BIZ-20260720-17 | 2026-07-20 | Self-hosted VPS behind WireGuard VPN is the only acceptable deployment model in Year 1–3 | Technical | ✅ Accepted | Engineering Lead | [ARCHITECTURE.md §1.4.4](../ARCHITECTURE.md#144-why-a-self-hosted-vpn-server) |
| BIZ-20260720-18 | 2026-07-20 | Advisory Board is the body that reviews all poll questions for neutrality and risk | Governance | ✅ Accepted | Project Sponsor | [PLATFORM.md §9.1.1](../PLATFORM.md#911-poll-creation-process), [§9.3](../PLATFORM.md#93-advisory-board) |
| BIZ-20260720-19 | 2026-07-20 | The platform will not pursue premium verification or sponsored content as primary revenue streams in Year 1–2 | Business | ✅ Accepted | Finance Director | [Business Case §3.3](./Business.md#33-revenue-assumptions-and-risks) |
| BIZ-20260720-20 | 2026-07-20 | Quarterly transparency reports (including a financial summary) are mandatory and public | Business / Governance | ✅ Accepted | Project Sponsor | [PLATFORM.md §14.2.1](../PLATFORM.md#1421-quarterly-reports), [Business Case §7.3](./Business.md#73-donor-reporting-commitments) |

---

## Recent Decisions (last 30 days)

All entries above are from 2026-07-20 (the v1.0.0 of the Phase 1 documents). As the project evolves, this section will show only decisions from the last 30 days for quick reference.

| Date | ID | Decision | Status |
|------|----|----------|--------|
| 2026-07-20 | BIZ-20260720-20 | Quarterly transparency reports are mandatory and public | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-19 | Premium verification and sponsored content are not Year 1–2 priorities | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-18 | Advisory Board reviews all poll questions | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-17 | Self-hosted VPN deployment only, Years 1–3 | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-16 | No advertising, data sales, or citizen access fees | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-15 | Pre-pilot research is a hard gate | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-14 | Founder bridge financing is acceptable with Board approval | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-13 | Security/legal/compliance spend is non-discretionary | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-12 | Open-source AI detection preferred | ✅ Accepted |
| 2026-07-20 | BIZ-20260720-11 | 6-month feature/marketing freeze before 2027 election | ✅ Accepted |

---

## Search by Category

### Business
BIZ-20260720-01, BIZ-20260720-02, BIZ-20260720-03, BIZ-20260720-05, BIZ-20260720-06, BIZ-20260720-07, BIZ-20260720-11, BIZ-20260720-14, BIZ-20260720-16, BIZ-20260720-19, BIZ-20260720-20

### Product
BIZ-20260720-08, BIZ-20260720-09, BIZ-20260720-10, BIZ-20260720-15

### Technical
BIZ-20260720-12, BIZ-20260720-17

### Legal / Compliance
BIZ-20260720-04, BIZ-20260720-13, BIZ-20260720-16, BIZ-20260720-18

### Governance
BIZ-20260720-06, BIZ-20260720-07, BIZ-20260720-18, BIZ-20260720-20

---

## ID Convention

IDs follow the format `[CATEGORY]-[YYYYMMDD]-[NN]`:

- `BIZ` — Business
- `PROD` — Product
- `TECH` — Technical (most of these will become ADRs in Phase 4; the Decision Log entry here is just a pointer)
- `SEC` — Security
- `LEGAL` — Legal / Compliance
- `OPS` — Operations
- `GOV` — Governance
- `PEOPLE` — People / Hiring / Timeline
- `OTHER` — Anything that doesn't fit

A compound decision (e.g., "freeze product and marketing") gets a single ID. A decision that has both business and technical aspects (e.g., "open-source AI preferred") gets one ID with the primary category, and the secondary category is noted in the Search by Category section.

---

## Convention Notes

1. **Never delete an entry.** Use status to mark it as Deprecated or Superseded. The history is the value.
2. **Link to the source of truth.** Every entry should link to the document (Charter, Business, ADR, etc.) where the decision is justified. The Decision Log itself does not contain justification.
3. **A decision that is later reversed** gets a new ID, not a status change. Example: a future `BIZ-20270101-03` decision might supersede `BIZ-20260720-11` if the election freeze policy changes. The old entry's status is then updated to "🔄 Superseded by BIZ-20270101-03".
4. **Trivial decisions don't go here.** "We used PostgreSQL because the team knows it" is not a decision; it's a default. "We chose PostgreSQL over MySQL because [reason]" is a decision and gets a TECH- ID (or, more usually, a full ADR in Phase 4).
5. **Add entries the day the decision is made**, not the day the document is published. If we make a decision in a Monday meeting, it goes in the log on Monday even if the document it refers to isn't published until Friday.

---

## Appendix A: Glossary
- **ADR** — Architecture Decision Record (see [ADR template](../templates/ADR%20Template.md))
- **NBA** — Nigerian Bar Association
- **NDPR** — Nigeria Data Protection Regulation

## Appendix B: Related Documents
- [Decision Log Template](../templates/Decision%20Log%20Template.md) — conventions and how-to
- [ADR Template](../templates/ADR%20Template.md) — for technical decisions that warrant full context, alternatives, and consequences
- [Project Charter](./Project%20Charter.md) — strategic decisions
- [Business Case](./Business.md) — financial decisions
- [Market Research](./Market%20Research.md) — market and competitive decisions

## Appendix C: Decision Log Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Project Lead | Initial log. Backfilled 20 decisions from the v1.0.0 of Project Charter, Business Case, and Market Research. |