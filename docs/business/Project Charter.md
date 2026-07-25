# Project Charter — Najia Community Bridge

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Project Sponsor: [Name, Role]*
*Project Lead: [Name, Role]*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft.

---

## 1. Project Identification

| Field | Value |
|-------|-------|
| Project Name | Najia Community Bridge |
| Project Code | NCB-001 |
| Project Type | New product / civic technology platform |
| Sponsoring Organization | Najia Community Bridge (founding entity) |
| Project Location | Nigeria (initial pilot: Lagos State) |
| Project Start Date | 2026-07-20 |
| Target Launch (Pilot) | 2026-10-20 (Month 4 from kickoff, per Implementation Roadmap) |
| Target National Scale | 2027–2028 |

---

## 2. Project Purpose and Justification

### 2.1 Business Need

Nigeria faces a persistent gap between citizens and the institutions that serve them. Trust in government is low, access to legal representation is uneven and often unaffordable, and evidence in everyday disputes (landlord–tenant, consumer, employment) is increasingly digital but unverifiable. Existing civic-tech efforts tend to focus on a single slice of this problem — election monitoring, legal aid hotlines, or document templates — without joining the pieces.

### 2.2 Project Purpose

Najia Community Bridge is a civic technology platform that operates on three interconnected pillars:

1. **Citizen engagement with governance** — non-binding policy sentiment polls and confidence votes on elected officials.
2. **Evidence integrity** — cryptographic verification of uploaded evidence and AI-assisted deepfake detection.
3. **Access to legal representation** — a marketplace connecting citizens with verified lawyers and pro bono opportunities.

All activities are clearly non-binding expressions of citizen sentiment, conducted within clear legal and ethical boundaries.

### 2.3 Strategic Alignment

| Stakeholder | Why It Matters To Them |
|-------------|------------------------|
| Citizens | Voice in governance, evidence security, legal access, civic education |
| Government | Real-time citizen sentiment data, structured feedback, reduced distrust |
| Legal professionals | Client acquisition, pro bono opportunities, professional visibility |
| Civil society | Data for advocacy, citizen engagement tools, accountability monitoring |
| Investors / donors | Social impact, measurable outcomes, sustainable model |

### 2.4 Business Case Summary

Detailed financial projections are in [Business.md](./Business.md). Headline figures:

| Metric | Year 1 | Year 3 |
|--------|--------|--------|
| Total available funding | ₦22,000,000 | ₦30,000,000 |
| Operating costs | ₦25,000,000 | ₦30,000,000 |
| Funding gap | ₦3,000,000 (closed via additional grant or founder bridge) | ₦0 (break-even on paper, no margin) |

The platform is not designed to be a profit-maximizing enterprise. Sustainability is the bar, not profit. The three-year goal is to operate without structural loss on a diversified revenue base (lawyer listings, government/NGO poll fees, training, grants).

---

## 3. Project Description

### 3.1 High-Level Description

A web and mobile application, served by a single deployable service, that allows Nigerian citizens to:

- Express non-binding sentiment on government policies and elected officials
- Upload and cryptographically verify evidence for civil disputes
- Detect AI-manipulated media via an AI-assisted detection pipeline
- Get matched with verified lawyers for advice and representation
- Access legal literacy modules and a blog with educational content

### 3.2 Major Deliverables

| Deliverable | Description | Target |
|-------------|-------------|--------|
| MVP web app | Lagos-only pilot with polls, confidence votes, evidence, and lawyer matching | Month 4 |
| Mobile app (Expo) | iOS + Android clients consuming the Hono API | Month 8 (beta) |
| Blog & legal literacy | 50 articles and 8 legal literacy modules | Month 12 |
| AI detection pipeline | Deepfake detection for images and video, human review | Month 8 |
| NIMC NVS + Onfido integration | Identity verification flow with fallback | Month 2–3 |
| National expansion | All 36 states + FCT | Year 2 |

### 3.3 Out of Scope (for this charter)

- Adjudication of any dispute (the platform is explicitly not a court)
- Replacement of any formal legal process
- Any feature with binding legal or electoral effect
- Law enforcement or prosecution tools
- Public shaming, harassment, or defamation features
- Hardware (we are a software platform only)

These are codified in the platform document §2.2 "What the Platform IS NOT."

---

## 4. Objectives and Success Criteria

### 4.1 SMART Objectives

| # | Objective | Measure | Target by | Owner |
|---|-----------|---------|-----------|-------|
| 1 | Validate product–market fit in Lagos pilot | MAU in Lagos after 3 months of pilot | ≥ 500 MAU by Month 7 | Product Lead |
| 2 | Build trust via evidence integrity | Evidence uploads verified | ≥ 500 by end of Year 1 | Engineering Lead |
| 3 | Establish lawyer marketplace liquidity | Lawyers onboarded, cases matched | 10 lawyers, 20 cases by Month 12 | Operations |
| 4 | Demonstrate non-binding engagement model | Policy poll participants | 1,000 participants across 12 polls in Year 1 | Product Lead |
| 5 | Achieve sustainability trajectory | Break-even on paper | Year 3 | Finance Director |
| 6 | Pass security and compliance review | NDPR compliance, bar association sign-off, no critical findings | Before pilot launch | Legal Director |

### 4.2 Definition of Success

The project will be considered successful if, by the end of Year 1:

- The Lagos pilot has run for at least 3 months without regulatory intervention
- At least 1,000 verified users have participated in at least one civic feature
- At least 20 cases have been matched to lawyers with documented outcomes
- No critical security incidents have occurred
- The platform has published its first quarterly transparency report

---

## 5. High-Level Requirements

### 5.1 Stakeholder Requirements

| Stakeholder | Requirement |
|-------------|-------------|
| Citizens | Easy onboarding (<5 steps), clear non-binding disclaimers, accessible on low-bandwidth |
| Government | Real-time, anonymized sentiment data; clear distinction from binding instruments |
| Lawyers | Verified profile, fair matching algorithm, transparent client reviews |
| Civil society | Open data products, accountability dashboards |
| Donors | Measurable social impact, transparent financial reporting |
| Regulators (NDPC, NBA) | NDPR compliance, bar association rules, clear legal boundaries |

### 5.2 Technical Requirements (summary)

- **Identity verification:** NIMC NVS API (primary) + Onfido (fallback)
- **Hosting:** Self-hosted VPS behind WireGuard VPN, for data sovereignty
- **Database:** PostgreSQL (primary) + SQLite (cache, rate limit)
- **Stack:** Bun runtime, TanStack Start, Hono, Drizzle ORM, CASL for RBAC
- **Languages:** English initially; major Nigerian languages (Yoruba, Hausa, Igbo, Pidgin) in Year 2
- **Accessibility:** Designed for users across literacy levels and connectivity

Full technical requirements are in [Tech Stack](../technical/Tech%20Stack.md) and [Architecture](../technical/Architecture.md) (forthcoming in Phase 4).

### 5.3 Compliance Requirements

- **NDPR (Nigeria Data Protection Regulation)** — data protection, breach notification, DSAR
- **Nigerian Bar Association Rules** — lawyer advertising, fee-splitting prohibitions, professional conduct
- **Electoral Act 2022** — non-binding nature of polls, election-adjacent timing
- **Cybercrime Act 2015** — content moderation, user safety
- **NIMC Act 2007** — national identity verification compliance

---

## 6. Boundaries

### 6.1 What This Project Will Do

- Build a non-binding civic engagement platform
- Provide cryptographic evidence verification and AI-assisted deepfake detection
- Operate a verified lawyer marketplace
- Publish educational blog content and legal literacy modules
- Operate within NDPR and Nigerian Bar Association rules
- Pilot in Lagos first, then expand nationally

### 6.2 What This Project Will NOT Do

- Adjudicate disputes or substitute for courts
- Influence official election outcomes
- Conduct law enforcement or prosecution
- Operate outside Nigeria (international expansion is a separate future charter)
- Take a percentage of legal fees (bar rule compliance)
- Sell citizen data or run behavioral advertising

### 6.3 Constraints

| Type | Constraint |
|------|------------|
| Regulatory | Must comply with NDPR, NBA rules, Electoral Act, Cybercrime Act, Consumer Protection Act |
| Financial | Year 1 funding gap of ₦3M must be closed before launch |
| Technical | Self-hosted only; no third-party cloud for primary database |
| Organizational | Founding team of fewer than 10 people through Year 1 |
| Reputational | Any perception of the platform as a "court" or "election tool" is a project-ending risk |

### 6.4 Assumptions

- NIMC NVS API access can be obtained during Phase 0
- Lagos pilot users have sufficient smartphone penetration and NIN coverage
- At least 10 lawyers can be onboarded in the first 3 months
- At least one grant funder will back the civic engagement mission
- The legal/ethical "non-binding" framing will be accepted by Nigerian regulators and the public

---

## 7. Stakeholder Analysis

| Stakeholder | Interest | Influence | Engagement Strategy |
|-------------|----------|-----------|---------------------|
| Citizens (verified) | High | Medium | Onboarding flow, in-product education, community channels |
| Government (federal/state) | High | High | Early dialogue, non-binding framing, opt-in poll partnerships |
| Nigerian Bar Association | High | High | Direct engagement, bar association sign-off before lawyer marketplace launch |
| NDPC (data protection) | Medium | High | NDPR compliance program, pre-launch consultation |
| Lawyers | High | Medium | Onboarding support, transparent marketplace, pro bono incentives |
| Civil society NGOs | High | Medium | Free poll creation, open data products |
| Donors / grant funders | Medium | High | Quarterly transparency reports, impact metrics |
| Mobile users (low-bandwidth) | High | Low | USSD fallback (Year 2), offline queue, low-bandwidth UI |
| Press / media | Medium | Medium | Press kit, designated press contact, transparent response to incidents |

---

## 8. High-Level Risks

The full Risk Register is in the platform document §11. The top three for the project as a whole:

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Government retaliation or regulatory action against the platform | High | Medium | Non-binding framing; independent operation; legal counsel review of all poll questions |
| Platform perceived as a court or jury system | High | Medium | Repeated, prominent disclaimers; explicit "what the platform IS NOT" in onboarding |
| Funding shortfall (Year 1 has a ₦3M gap) | High | Medium | Diversified revenue from Year 1; grant pipeline; founder bridge financing |

---

## 9. Governance

### 9.1 Decision-Making

| Decision Type | Decider | Forum |
|---------------|---------|-------|
| Strategic (mission, scope, funding) | Project Sponsor | Monthly steering review |
| Product (features, prioritization) | Project Lead | Weekly product review |
| Technical (stack, architecture) | Engineering Lead | Architecture review board |
| Legal / compliance | Legal Director | Pre-launch review and ongoing |
| Operations | Operations Director | Weekly ops standup |

All material decisions are recorded in the [Decision Log](./Decision%20Log.md). Significant technical decisions get a full ADR (template forthcoming in Phase 4).

### 9.2 Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|----------|
| Steerco update | Monthly | Sponsor, project lead, leads |
| Engineering health | Weekly | Engineering team |
| Pilot progress | Bi-weekly during pilot | Sponsor, leads, donors |
| Quarterly transparency report | Quarterly | Public, donors, regulators |
| Annual impact report | Annually | Public, donors, regulators |

### 9.3 Advisory Board

The Advisory Board (per platform document §9.3) reviews poll methodology, risk, and appeals. Composition is fixed: 2 legal experts, 1 political scientist, 2 civil society leaders, 1 tech expert, 1 journalist/media, 1 academic. They are formed by Month 3, before the first poll is published.

---

## 10. Milestones (Summary)

| Phase | Period | Milestone | Gate |
|-------|--------|-----------|------|
| Phase 0 | Months 1–3 | Pre-launch: legal setup, VPN, NIMC integration, advisory board | Ready for beta |
| Phase 1 | Months 4–6 | Lagos beta launch, first poll, first confidence vote, 5–10 lawyers live | Decision to scale |
| Phase 2 | Months 7–12 | Expansion to 3 states, AI detection launch, 2,000 users | Decision to expand nationally |
| Phase 3 | Years 2–3 | National coverage, 100+ lawyers, 50,000+ users, sustainability | Independent operation |

Full roadmap is in the platform document §13 and will be mirrored to [Roadmap.md](../product/Roadmap.md) in Phase 2.

---

## 11. Budget Summary

| Category | Year 1 | Year 3 |
|----------|--------|--------|
| Revenue (lawyer listings, poll fees, training) | ₦2,000,000 | ₦25,000,000 |
| Grant funding | ₦20,000,000 | ₦5,000,000 |
| **Total available** | **₦22,000,000** | **₦30,000,000** |
| Operating costs | ₦25,000,000 | ₦30,000,000 |
| **Funding gap** | **₦3,000,000** | **₦0** |

Detailed line items are in [Business.md](./Business.md).

---

## 12. Approval

This Project Charter is approved by:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | | | |
| Project Lead | | | |
| Legal Director | | | |
| Finance Director | | | |

---

## Appendix A: Glossary
## Appendix B: References
- Platform document §1–§2 (mission, scope)
- Platform document §11 (Risk Register)
- Platform document §13 (Implementation Roadmap)
## Appendix C: Charter Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Project Lead | Initial draft |