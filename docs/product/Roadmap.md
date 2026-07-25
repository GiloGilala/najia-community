# Product Roadmap — Najia Community Bridge

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Product Lead*
*Reviewers: Project Sponsor, Engineering Lead, Design Lead, Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Three horizons (Pilot / Phase 2 expansion / Year 2–3 scale). Each feature has a priority, a rationale, dependencies, and a status. Project-level milestones (which team does what by when) are in [PLATFORM.md §13](../PLATFORM.md#13-implementation-roadmap); this document is the feature-level companion.

> **How to read this document:** A roadmap is a **plan, not a promise.** The pilot horizon is committed; the Phase 2 horizon is planned; the Year 2–3 horizon is directional. Dates shift as we learn. What does not shift is the **priority** — the order in which we will build if we have to choose.

> **Related documents:**
> - [PLATFORM.md §13 — Implementation Roadmap](../PLATFORM.md#13-implementation-roadmap) — the project-level roadmap (phases by month, team activities)
> - [PRD.md](./PRD.md) — the pilot commitment
> - [Personas.md](./Personas.md) — who we're building for
> - [User Journeys.md](./User%20Journeys.md) — what they're trying to do
> - [UX & Design.md](./UX%20%26%20Design.md) — how it looks and feels
> - [Business Case §6](../business/Business.md#6-three-year-financial-projections) — the financial model that constrains the roadmap

---

## 1. Roadmap at a Glance

| Horizon | Period | Goal | Constraint |
|---------|--------|------|------------|
| **Pilot** | Months 0–6 | Prove the three-pillar model in Lagos; reach 500 MAU, 1,000 poll participants, 20 matched cases | Lagos only; English only; no USSD |
| **Phase 2 expansion** | Months 7–12 | Expand to 3 states; reach 2,000 verified users, 10 lawyers, 50 matched cases | Election freeze begins Month 10 |
| **Year 2 scale** | Year 2 | National expansion, 50,000+ users, 100+ lawyers, 50,000 poll participants | Sustainability target (Business Case §6.4) |
| **Year 3 maturity** | Year 3 | Durable sustainability, 100,000+ users, local language support, USSD | On-paper break-even only (not durable) |

The pilot horizon is committed by the [PRD §7 Release Criteria](./PRD.md#7-release-criteria-pilot-definition-of-done). The other horizons are planned and will be re-forecast at the end of each phase.

---

## 2. The Pilot Horizon (Months 0–6)

The pilot horizon is the **committed** scope. It is the answer to "what are we shipping?" Everything in the PRD is in this horizon unless explicitly deferred.

### 2.1 Pilot Feature Inventory

| # | Feature | Pillar | Persona | Priority | Source |
|---|---------|--------|---------|----------|--------|
| P-01 | NIMC NVS identity verification | 0 — Identity | All | Must | PRD §4.1, [PLATFORM.md §6](../PLATFORM.md#6-identity-verification) |
| P-02 | Onfido document verification (fallback) | 0 — Identity | All | Must | PRD §4.1, [PLATFORM.md §6](../PLATFORM.md#6-identity-verification) |
| P-03 | Manual verification review | 0 — Identity | All | Must | [PLATFORM.md §6.4.1](../PLATFORM.md#641-verification-priority) |
| P-04 | Email registration and login | 0 — Identity | All | Must | [ARCHITECTURE.md §3.1](../ARCHITECTURE.md#31-web-application--tanstack-start) |
| P-05 | Policy polls (vote, results, disclaimer) | 1 — Civic | Amara | Must | PRD §4.2, [PLATFORM.md §3.1](../PLATFORM.md#31-policy-sentiment-polls) |
| P-06 | Poll topic suggestion by citizens | 1 — Civic | Amara | Must | [PLATFORM.md §3.1.5](../PLATFORM.md#3115-poll-creation-rights) |
| P-07 | Confidence votes on Lagos officials | 1 — Civic | Amara | Must | PRD §4.3, [PLATFORM.md §3.2](../PLATFORM.md#32-confidence-votes-on-elected-officials) |
| P-08 | Quarterly confidence windows (Q3 2026 onwards) | 1 — Civic | Amara | Must | [PLATFORM.md §3.2.7](../PLATFORM.md#327-frequency-and-timing) |
| P-09 | Poll results with confidence intervals | 1 — Civic | All | Must | [PLATFORM.md §3.1.7](../PLATFORM.md#317-results-display) |
| P-10 | Evidence upload (image, video, audio, document) | 2 — Evidence | Tunde | Must | PRD §4.4, [PLATFORM.md §4](../PLATFORM.md#4-evidence-integrity--deepfake-detection) |
| P-11 | SHA-256 hash integrity verification | 2 — Evidence | Tunde | Must | [PLATFORM.md §4.2](../PLATFORM.md#42-evidence-integrity-pipeline) |
| P-12 | AI manipulation detection (image, video) | 2 — Evidence | Tunde | Must | [PLATFORM.md §4.3](../PLATFORM.md#43-ai-powered-manipulation-detection) |
| P-13 | Human moderator review of High AI flags | 2 — Evidence | Kemi | Must | [PLATFORM.md §4.3.6](../PLATFORM.md#436-human-review-process) |
| P-14 | Evidence appeal flow | 2 — Evidence | Tunde | Should | [PLATFORM.md §4.3.6](../PLATFORM.md#436-human-review-process) |
| P-15 | Lawyer registration with bar verification | 3 — Lawyer | Ngozi | Must | PRD §4.5, [PLATFORM.md §5.3](../PLATFORM.md#53-lawyer-onboarding) |
| P-16 | Lawyer profile (practice areas, fees, languages) | 3 — Lawyer | All | Must | [PLATFORM.md §5.3.3](../PLATFORM.md#533-profile-elements) |
| P-17 | Lawyer intake form (case type, jurisdiction, budget, urgency) | 3 — Lawyer | Tunde | Must | [PLATFORM.md §5.4](../PLATFORM.md#54-lawyer-matching) |
| P-18 | Lawyer match (3–5 recommended) | 3 — Lawyer | Tunde | Must | [PLATFORM.md §5.4](../PLATFORM.md#54-lawyer-matching) |
| P-19 | Free 15-minute consultation scheduling | 3 — Lawyer | Tunde, Ngozi | Must | [PLATFORM.md §5.2.4](../PLATFORM.md#524-initial-consultation) |
| P-20 | Free consultation delivery (video/audio/chat) | 3 — Lawyer | Tunde, Ngozi | Must | [PLATFORM.md §5.2.4](../PLATFORM.md#524-initial-consultation) |
| P-21 | Lawyer reviews (verified client, moderated) | 3 — Lawyer | All | Must | [PLATFORM.md §5.5](../PLATFORM.md#55-lawyer-ratings--reviews) |
| P-22 | Lawyer subscription tiers (Basic/Enhanced/Premium) | 3 — Lawyer | Ngozi | Must | Business Case §3.2.1 |
| P-23 | Blog platform with 8 categories | Cross-pillar | All | Must | [PLATFORM.md §7](../PLATFORM.md#7-blog--content-platform) |
| P-24 | 8 legal literacy modules | Cross-pillar | All | Must | [PLATFORM.md §7.6](../PLATFORM.md#76-legal-literacy-modules) |
| P-25 | Blog comments with moderation | Cross-pillar | All | Must | [PLATFORM.md §7.5.3](../PLATFORM.md#753-comment-moderation) |
| P-26 | Content moderation queue | Cross-pillar | Kemi | Must | [PLATFORM.md §8](../PLATFORM.md#8-moderation--content-governance) |
| P-27 | AI-assisted moderation (flags + human review) | Cross-pillar | Kemi | Must | [PLATFORM.md §8.5.2](../PLATFORM.md#852-ai-assisted-moderation-flow) |
| P-28 | User appeals of moderation decisions | Cross-pillar | Amara, Tunde | Must | [PLATFORM.md §8.3.3](../PLATFORM.md#833-appealable-decisions) |
| P-29 | Admin dashboard (users, polls, evidence, lawyers, moderation) | Operations | Admin | Must | [PLATFORM.md §14.1](../PLATFORM.md#141-organizational-structure) |
| P-30 | User management (suspend, restore, role change) | Operations | Admin | Must | [PLATFORM.md §14.1](../PLATFORM.md#141-organizational-structure) |
| P-31 | Quarterly transparency report (template, Q3 2026 actual) | Operations | Admin | Should | [PLATFORM.md §14.2.1](../PLATFORM.md#1421-quarterly-reports) |
| P-32 | Mobile web app (responsive) | Platform | All | Must | PRD §6.2 |
| P-33 | Expo mobile app (iOS, Android) | Platform | All | Must | [ARCHITECTURE.md §3.3](../ARCHITECTURE.md#33-mobile-application--expo) |
| P-34 | USSD fallback | Platform | All | Won't (Year 2) | [PLATFORM.md §5.6.2](../PLATFORM.md#562-access-and-equity-risks) |
| P-35 | Local language UI (Yoruba, Hausa, Igbo, Pidgin) | Platform | All | Won't (Year 2) | [PLATFORM.md §3.1.3](../PLATFORM.md#313-scope-and-levels) |
| P-36 | Government dashboard | Cross-pillar | Government | Won't (Year 2) | [PLATFORM.md §18.3](../PLATFORM.md#183-what-the-platform-is) |
| P-37 | Sponsored content | Revenue | All | Won't (Year 2) | [Business Case §3.1](../business/Business.md#31-revenue-streams) |
| P-38 | Premium verification | Revenue | All | Won't (Year 2) | [Business Case §3.1](../business/Business.md#31-revenue-streams) |
| P-39 | Public API for third-party developers | Platform | External | Won't (Year 3) | [PLATFORM.md §18.3](../PLATFORM.md#183-what-the-platform-is) |
| P-40 | Newsletter (basic) | Engagement | All | Should | [PLATFORM.md §17.1.1](../PLATFORM.md#1711-community-channels) |
| P-41 | Push notifications (mobile) | Engagement | All | Won't (Year 2) | [ARCHITECTURE.md §3.3.1](../ARCHITECTURE.md#331-architecture) |
| P-42 | Public case dispute resolution (mediation) | Cross-pillar | Tunde | Won't (NOT) | [PLATFORM.md §2.2](../PLATFORM.md#22-what-the-platform-is-not) |
| P-43 | Binding arbitration | Cross-pillar | Tunde | Won't (NOT) | [PLATFORM.md §2.2](../PLATFORM.md#22-what-the-platform-is-not) |
| P-44 | Election tools (voter guides, results) | Cross-pillar | All | Won't (NOT) | [PLATFORM.md §2.2](../PLATFORM.md#22-what-the-platform-is-not) |

**Pilot totals:** 33 features to ship, 11 features explicitly deferred or out of scope, 1 of which is permanently out (P-42, P-43, P-44 are *not* part of the platform's role).

### 2.2 Pilot Feature Prioritization Rationale

The Must / Should / Could / Won't split is the PRD's MoSCoW. The rationale for the high-priority items:

| Why these are Must | |
|--------------------|--|
| The three pillars need at least one full vertical each (P-05, P-10, P-15) to validate the model |
| Identity (P-01, P-02, P-03) is the foundation; without it, nothing else works |
| Moderation (P-26, P-27, P-28) is the safety floor; without it, we can't launch |
| The non-binding disclaimer UX is embedded in P-05 and P-07, not a separate feature |

| Why these are Should | |
|----------------------|--|
| Evidence appeal (P-14) is important for fairness but the moderator review (P-13) catches most issues |
| Newsletter (P-40) is engagement glue, not core |
| Quarterly transparency report (P-31) is the first one — the second one onward is operational |

| Why these are Won't (Year 2) | |
|------------------------------|--|
| USSD (P-34) and local language (P-35) are equity features that matter for national scale, not Lagos pilot |
| Government dashboard (P-36) is B2B, deferred until the consumer model is proven |
| Sponsored content (P-37) and premium verification (P-38) are revenue experiments with brand risk; deferred until the core is solid |
| Public API (P-39) is ecosystem, not platform — Year 3 at earliest |

| Why these are Won't (NOT) | |
|----------------------------|--|
| Mediation (P-42), arbitration (P-43), and election tools (P-44) are *categorically* out of scope. They would change the platform's nature and violate the "what the platform IS NOT" list in [PLATFORM.md §2.2](../PLATFORM.md#22-what-the-platform-is-not). |

### 2.3 Pilot Dependencies

| Feature | Depends on | Notes |
|---------|------------|-------|
| P-05 (Policy polls) | P-01, P-02, P-04 | Needs verified users and authentication |
| P-07 (Confidence votes) | P-01, P-02, P-04 | Same |
| P-10 (Evidence upload) | P-01, P-02, P-04 | Same |
| P-12 (AI detection) | P-11 | Hash verification is the foundation |
| P-15 (Lawyer registration) | P-01, P-04 | Plus bar verification (NBA engagement) |
| P-18 (Lawyer match) | P-15, P-17 | Needs lawyer profiles and intake form |
| P-19 (Free consultation) | P-18 | Needs match to schedule |
| P-26 (Moderation queue) | P-04 | Plus admin role |
| P-33 (Mobile app) | All web app features | The mobile app is a client of the API; web app must be stable first |

The critical path is: identity (P-01, P-02) → poll or evidence or lawyer → supporting features. P-01 and P-02 are the gating features for everything else.

---

## 3. The Phase 2 Expansion Horizon (Months 7–12)

Phase 2 is the Lagos pilot scaled out. It is **planned**, not committed. The PRD for Phase 2 will be written at the end of the pilot, with what we learn informing scope.

### 3.1 Phase 2 Themes

1. **Geographic expansion** — Lagos pilot learnings applied to 2 additional states (likely Abuja and Port Harcourt, where lawyer supply is concentrated)
2. **Marketplace liquidity** — grow the lawyer count from 5–10 to 50+, grow matched cases from 20 to 50+
3. **Content depth** — grow the blog to 100+ articles and the legal literacy library to all 8 modules fully built out
4. **Operational maturity** — second and third quarterly transparency reports, formal appeal SLA, formal Bar Association engagement
5. **Election freeze** — feature and marketing freeze from Month 10 onwards (per Decision Log BIZ-20260720-11)

### 3.2 Phase 2 Feature Candidates

| # | Feature | Phase 2 priority | Source | Notes |
|---|---------|------------------|--------|-------|
| P2-01 | Expand to 2 additional states | Must | [PLATFORM.md §13.3](../PLATFORM.md#133-phase-2-scaling-months-712) | The first state for expansion is likely Abuja or Port Harcourt |
| P2-02 | Onboard 50+ lawyers | Must | [Business Case §3.2.1](../business/Business.md#321-lawyer-listings-primary-revenue-stream-from-year-2) | Driven by Operations |
| P2-03 | Match 50+ cases | Must | [Business Case §3.2.1](../business/Business.md#321-lawyer-listings-primary-revenue-stream-from-year-2) | |
| P2-04 | Lawyer availability windows | Should | [PRD §3.2](../product/PRD.md#32-user-stories-pilot-moscow) | Currently a "Could-have" stretch; promotion to Should based on pilot data |
| P2-05 | LGAs in results breakdowns (when statistically significant) | Should | [PRD §4.2](../product/PRD.md#42-policy-polls-pillar-1) | |
| P2-06 | 100+ blog articles | Should | [PLATFORM.md §13.3](../PLATFORM.md#133-phase-2-scaling-months-712) | |
| P2-07 | 8 legal literacy modules fully built | Should | [PLATFORM.md §7.6](../product/PLATFORM.md#76-legal-literacy-modules) | |
| P2-08 | AI detection for audio | Could | [PLATFORM.md §4.3.2](../PLATFORM.md#432-scope) | "Out of scope initially due to detection complexity and cost" |
| P2-09 | Government poll partnerships | Must | [PLATFORM.md §13.3](../PLATFORM.md#133-phase-2-scaling-months-712) | Revenue stream from Year 2 |
| P2-10 | Mobile app v2 (offline improvements) | Could | [ARCHITECTURE.md §3.3.3](../ARCHITECTURE.md#333-offline-capabilities) | |
| P2-11 | Newsletter v2 (segmented) | Could | [PLATFORM.md §17.1.1](../PLATFORM.md#1711-community-channels) | |
| P2-12 | Second and third transparency reports | Must | [PLATFORM.md §14.2.1](../PLATFORM.md#1421-quarterly-reports) | |
| P2-13 | Election freeze compliance | Must | Decision Log BIZ-20260720-11 | Not a feature per se, but a constraint on the Phase 2 calendar |
| P2-14 | Formal Bar Association engagement | Must | Open Question in [Business Case §12](../business/Business.md#12-open-questions) | Confirm fee model compliance |

**Phase 2 totals:** ~14 feature candidates, ~7 Must, ~4 Should, ~3 Could. Final prioritization in the Phase 2 PRD.

### 3.3 Phase 2 Election Freeze

The 6-month feature and marketing freeze (Decision Log BIZ-20260720-11) covers the months before the 2027 election. During the freeze:

- No new feature launches
- No major marketing pushes
- Existing features continue to be supported (bug fixes, security updates)
- The transparency report for Q4 2026 / Q1 2027 is published as scheduled
- Internal preparation for Year 2 is allowed

This is a hard constraint, not a soft target. The freeze is a feature of the platform's risk posture, not a slowdown.

---

## 4. The Year 2 Scale Horizon (Year 2)

Year 2 is the horizon where the platform attempts national scale. The decisions made here are largely conditional on the pilot and Phase 2 outcomes.

### 4.1 Year 2 Themes

1. **National coverage** — all 36 states + FCT
2. **Sustainability** — revenue covers operating cost (on paper; durable sustainability is a Year 4 target per Business Case §6.4)
3. **Equity features** — USSD, local language UI
4. **Marketplace scale** — 100+ lawyers, 500+ cases matched
5. **Engagement depth** — 50,000+ verified users

### 4.2 Year 2 Feature Candidates

| # | Feature | Year 2 priority | Notes |
|---|---------|------------------|-------|
| Y2-01 | National expansion to all 36 states + FCT | Must | [PLATFORM.md §13.4](../PLATFORM.md#134-phase-3-national-expansion-years-23) |
| Y2-02 | USSD fallback for low-bandwidth users | Must | [PLATFORM.md §5.6.2](../PLATFORM.md#562-access-and-equity-risks) |
| Y2-03 | Local language UI (Yoruba, Hausa, Igbo, Pidgin) | Must | [PLATFORM.md §3.1.3](../PLATFORM.md#313-scope-and-levels) |
| Y2-04 | 100+ lawyers onboarded | Must | [Business Case §3.2.1](../business/Business.md#321-lawyer-listings-primary-revenue-stream-from-year-2) |
| Y2-05 | 500+ cases matched | Must | [Business Case §3.2.1](../business/Business.md#321-lawyer-listings-primary-revenue-stream-from-year-2) |
| Y2-06 | Government dashboard (B2B) | Should | [PLATFORM.md §13.4](../PLATFORM.md#134-phase-3-national-expansion-years-23) |
| Y2-07 | Premium verification feature | Could | [Business Case §3.1](../business/Business.md#31-revenue-streams) |
| Y2-08 | Sponsored content (clearly labeled) | Could | [Business Case §3.1](../business/Business.md#31-revenue-streams) |
| Y2-09 | AI detection for audio | Should | [PLATFORM.md §4.3.2](../PLATFORM.md#432-scope) |
| Y2-10 | Formal press / media partnerships | Should | [PLATFORM.md §9.3.1](../PLATFORM.md#93-advisory-board) |
| Y2-11 | Push notifications (mobile) | Could | [ARCHITECTURE.md §3.3.1](../ARCHITECTURE.md#331-architecture) |
| Y2-12 | Public case studies and data stories | Should | [PLATFORM.md §7.4](../PLATFORM.md#74-blog-content-types) |
| Y2-13 | International funder diversification (Y2+) | Should | [Business Case §3.2.3](../business/Business.md#323-grant-funding-year-1-anchor) |
| Y2-14 | In-app lawyer messaging | Could | Deferred from pilot per PRD scope |
| Y2-15 | Lawyer document automation | Could | Deferred from pilot per PRD scope |
| Y2-16 | Mediation partner integrations | Could | We are not a mediator, but we can surface partners |
| Y2-17 | Diaspora features | Won't (Y3) | [Personas §4.3](./Personas.md#43-hadiza--the-diaspora-supporter) |

**Year 2 totals:** ~17 feature candidates, ~5 Must, ~5 Should, ~6 Could, 1 Won't (Y3). Final prioritization in the Year 2 PRD.

### 4.3 Year 2 Open Questions (Pre-Work)

These need answers before the Year 2 PRD is written:

| Question | Owner | Resolution path |
|----------|-------|------------------|
| Can USSD be supported at the cost structure in Business Case? | Engineering + Finance | Year 1 cost analysis |
| Is the local language UI maintenance cost sustainable? | Engineering + Content | Year 1 content cost analysis |
| Is the Bar Association on board with the marketplace model? | Legal | Pre-pilot engagement |
| Has the 2027 election cycle passed without regulatory action? | Project Lead | Track through 2027 |

---

## 5. The Year 3 Maturity Horizon (Year 3)

Year 3 is the durability test. The platform is not new anymore; the question is whether it can sustain.

### 5.1 Year 3 Themes

1. **Durable sustainability** — operating reserve of 6 months (per Business Case §6.4)
2. **Platform maturity** — features are stable; effort shifts from building to maintaining
3. **Ecosystem** — public API, partner integrations
4. **Quality** — performance, accessibility, content quality all measurably above pilot

### 5.2 Year 3 Feature Candidates

| # | Feature | Year 3 priority | Notes |
|---|---------|------------------|-------|
| Y3-01 | Operating reserve of 6 months | Must | Business Case §6.4 target |
| Y3-02 | Public API for third-party developers | Could | [PLATFORM.md §18.3](../PLATFORM.md#183-what-the-platform-is) |
| Y3-03 | Diaspora features (Hadiza persona) | Could | [Personas §4.3](./Personas.md#43-hadiza--the-diaspora-supporter) |
| Y3-04 | Multi-language content (translated blog and modules) | Should | Depends on Year 2 local language UI |
| Y3-05 | International expansion (Y4+) | Won't (Y3) | [PLATFORM.md §6.4](../PLATFORM.md#64-assumptions) — out of charter scope |
| Y3-06 | Platform-as-a-service for other civic groups | Could | Exploratory |
| Y3-07 | Native iOS and Android (not Expo wrapper) | Could | Performance and feature parity |
| Y3-08 | Advanced analytics for civil society partners | Should | [PLATFORM.md §3.1.7](../PLATFORM.md#317-results-display) |

Year 3 is the most uncertain horizon; the feature list is a placeholder for a more rigorous Year 3 PRD written in late Year 2.

---

## 6. Roadmap Principles

These are the principles that govern prioritization decisions when in doubt.

### 6.1 The Non-Binding Constraint

A feature that compromises the non-binding framing, even by appearance, is deprioritized. This is not a guideline; it is a hard rule.

### 6.2 The Three-Pillar Balance

No pillar gets starved. If a phase over-invests in one pillar (e.g., civic engagement) at the expense of another (e.g., lawyer marketplace), the roadmap is rebalanced.

### 6.3 Equity Features Come With Scale

USSD and local language UI are equity features that matter for national scale, not for the Lagos pilot. They are deliberately deferred. When they ship, they are not optional and not nice-to-have.

### 6.4 What We Won't Build

Some features are *categorically* out of scope. Adding them to the roadmap requires changing the platform's nature, not just the roadmap.

- Adjudication, mediation, or arbitration
- Election tools, voter guides, or campaign features
- Public shaming, harassment, or defamation features
- Sale of citizen data
- Behavioral advertising
- Percentage of legal fees (Bar Association compliance)

These are codified in [PLATFORM.md §2.2](../PLATFORM.md#22-what-the-platform-is-not) and reinforced in the [Decision Log](../business/Decision%20Log.md).

### 6.5 When the Roadmap Changes

The roadmap is updated:

- At the end of each phase (after the pilot, after Phase 2, etc.)
- When a major new constraint appears (e.g., regulatory change, funder withdrawal)
- When a feature is found to be infeasible
- Quarterly, regardless, with a small "what changed" section

Major changes go through the [Decision Log](../business/Decision%20Log.md). Minor changes (e.g., reordering within a phase) are noted in the document's changelog.

---

## 7. Roadmap Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Pilot does not reach 500 MAU | Phase 2 expansion is delayed | Medium | Marketing investment in Months 4–6; outreach partnerships |
| Naira devaluation accelerates | Operating costs grow faster than revenue | Medium | Open-source AI; cost optimization; USD-grant preference |
| Government action against the platform | National expansion is blocked | Low | Non-binding framing; legal counsel; election freeze discipline |
| Bar Association objects to the marketplace model | Pillar 3 is at risk | Low | Pre-pilot engagement; legal review; defer marketplace if needed |
| 2027 election cycle triggers early feature freeze | Phase 2 is compressed | Low | Front-load Phase 2 features to Months 7–9 |
| Engineering team cannot deliver 33 features in 6 months | Pilot is delayed | Medium | Ruthless prioritization; defer Could-haves; Engineering Lead review of PRD scope |
| AI detection costs grow faster than projected | Funding gap widens | Medium | Open-source models first; cache results; rate limit per user |

---

## 8. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the right State #2 and #3 for Phase 2 expansion? | Project Lead | Open — pending pilot learnings |
| 2 | What is the right pricing for lawyer subscriptions? | Operations + Finance | Open — pre-pilot research |
| 3 | Should the Phase 2 expansion wait for a stable pilot (Month 6) or run in parallel? | Project Sponsor | Open — propose serial |
| 4 | Is Year 2 USSD technically feasible on the cost structure? | Engineering | Open — depends on Year 1 learnings |
| 5 | What is the international expansion charter? | Project Sponsor | Won't (Y3+) — separate charter when needed |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md).

---

## Appendix A: Glossary
- **LGA** — Local Government Area
- **MAU** — Monthly Active Users
- **NBA** — Nigerian Bar Association
- **NIN** — National Identification Number
- **RPO** — Recovery Point Objective
- **USSD** — Unstructured Supplementary Service Data (feature-phone interaction)

## Appendix B: References
- [PRD.md](./PRD.md) — pilot commitment
- [PLATFORM.md §13 — Implementation Roadmap](../PLATFORM.md#13-implementation-roadmap) — project-level roadmap
- [Business Case §6 — Three-Year Financial Projections](../business/Business.md#6-three-year-financial-projections)
- [Decision Log BIZ-20260720-11 — Election freeze](../business/Decision%20Log.md)
- [Personas.md](./Personas.md)
- [User Journeys.md](./User%20Journeys.md)
- [UX & Design.md](./UX%20%26%20Design.md)

## Appendix C: Roadmap Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Product Lead | Initial draft. Pilot horizon is committed by the PRD; Phase 2 is planned; Year 2 and Year 3 are directional. Election freeze is built into Phase 2 calendar. |