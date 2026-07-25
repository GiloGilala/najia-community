# PRD — Najia Community Bridge

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Product Lead*
*Reviewers: Project Sponsor, Engineering Lead, Design Lead, Legal Director, Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Commits to the Lagos pilot scope (Month 4 launch). National expansion features are referenced but not in scope for this PRD.

> **How to read this PRD:** This document is the **commitment**. It defines what we will ship for the Lagos pilot and what we are explicitly not shipping yet. The full product vision, all features ever considered, and the long-term roadmap live in [PLATFORM.md](../PLATFORM.md). When in doubt about the *why* of a feature, look there. When in doubt about the *what* of the pilot scope, look here.

> **Related documents:**
> - [Project Charter](../business/Project%20Charter.md) — strategic purpose, boundaries, success criteria
> - [Business Case](../business/Business.md) — financial model, revenue, projections
> - [Market Research](../business/Market%20Research.md) — market context, competitive landscape, user insights
> - [Personas.md](./Personas.md) — user archetypes (drafted alongside this PRD)
> - [User Journeys.md](./User%20Journeys.md) — end-to-end user flows
> - [Roadmap.md](./Roadmap.md) — phased feature roadmap
> - [PLATFORM.md](../PLATFORM.md) — full product vision and policy

---

## 1. Summary

### 1.1 Product

Najia Community Bridge — a non-binding civic engagement and access-to-justice platform for Nigerian citizens. Web app, mobile app, and API, served from a single deployable service.

### 1.2 Problem

Three problems, one platform:

1. Citizens have **no structured, trusted way** to express sentiment on government policies and elected officials between elections.
2. Citizens dealing with civil disputes (landlord, employer, consumer, family) have **no way to verify the evidence they upload** or to detect when media has been AI-manipulated.
3. Citizens have **unequal and opaque access to legal representation**, especially outside Lagos and Abuja.

### 1.3 Solution

A platform with three integrated pillars:

- **Civic engagement:** non-binding policy polls and quarterly confidence votes on elected officials
- **Evidence integrity:** SHA-256 hash verification on every upload, plus AI-assisted deepfake detection for images and video
- **Lawyer access:** a marketplace of verified lawyers with profile matching, free 15-minute consultations, and a transparent review system

All three pillars are unified by a verified citizen identity (NIMC primary, Onfido fallback), so the platform can guarantee one-person-one-vote and one-person-one-evidence-record.

### 1.4 Success Metrics (Pilot)

| Metric | Target (Month 6, end of pilot phase) |
|--------|--------------------------------------|
| Verified users in Lagos | 500 |
| Policy poll participants (cumulative) | 1,000 |
| Confidence vote participants (cumulative) | 1,000 |
| Evidence uploads (verified) | 500 |
| Lawyers onboarded and active | 5–10 |
| Cases matched to lawyers | 20 |
| Free consultations completed | 50 |
| Citizen satisfaction (NPS) | ≥ 40 |
| Trust in "non-binding" framing (survey) | ≥ 80% of users correctly identify polls as non-binding |

### 1.5 Out of Scope (for this PRD)

These are out of scope for the Lagos pilot and will be addressed in later PRDs:

- National expansion beyond Lagos (separate PRD for Phase 2 expansion)
- USSD fallback (Year 2 roadmap)
- Local language support beyond English (Year 2)
- Sponsored content and premium verification features (Year 2–3)
- Mobile app native features beyond what the API supports (push notifications, offline storage beyond the queue)
- Government dashboard (the back-office interface for government partners)
- Public API for third-party developers
- International expansion

The full out-of-scope rationale is in [PLATFORM.md §1.4 and §2.2](../PLATFORM.md).

---

## 2. Background and Context

### 2.1 Why now?

Three market tailwinds (from [Market Research §5.1](../business/Market%20Research.md#51-tailwinds-favorable-trends)) make the timing right:

1. NIN coverage is at scale, making government-grade identity verification feasible for the first time.
2. AI-generated media is becoming widespread, creating urgent demand for detection — particularly for the kind of evidence (screenshots, photos) that appears in civil disputes.
3. The post-2023 Nigerian civic space is more open, and the legal tech sector is growing.

The single most important constraint is the **2027 election cycle** (Market Research §5.3): we have a ~12-month window to launch, prove the model, and reach a stable operating state before the election freeze begins. This makes the Lagos pilot not just a strategic choice but a *timing* choice.

### 2.2 Assumptions

These assumptions are explicit. If any of them proves wrong, the PRD is re-opened.

| # | Assumption | If wrong... |
|---|------------|-------------|
| 1 | NIMC NVS API access can be obtained during Phase 0 (pre-pilot) | We ship with Onfido only for the pilot; NIMC becomes a post-priority add |
| 2 | At least 10 lawyers can be onboarded in Lagos through direct relationship-building | Lawyer marketplace becomes a Year 2 priority; pilot ships without it |
| 3 | Lagos users have NIN coverage at ≥70% | Onfido becomes the primary verification path, not the fallback |
| 4 | At least one anchor grant funder will commit by Month 3 | Founder bridge financing is invoked (per Business Case §7.1) |
| 5 | Public reaction to the non-binding framing will be neutral or positive | We delay launch and re-do user education; we do not soften the framing |
| 6 | Naira devaluation does not accelerate beyond the 20% sensitivity scenario in Business Case §8 | We invoke cost optimization levers; we do not pivot away from self-hosted infrastructure |

### 2.3 Constraints

| Type | Constraint | Source |
|------|------------|--------|
| Regulatory | Must comply with NDPR, NBA Rules, Electoral Act, Cybercrime Act, NIMC Act | [PLATFORM.md §16](../PLATFORM.md#16-legal-framework) |
| Financial | Year 1 budget capped at ₦25M operating + ₦22M available (₦3M gap) | [Business Case §6.1](../business/Business.md#61-year-1--foundation) |
| Technical | Self-hosted VPS behind WireGuard VPN | [ARCHITECTURE.md §1.4.4](../ARCHITECTURE.md#144-why-a-self-hosted-vpn-server) |
| Organizational | Engineering team of fewer than 5 through pilot | [Project Charter §6.4](../business/Project%20Charter.md#64-assumptions) |
| Reputational | Must not be perceived as a court, jury, or election tool | [PLATFORM.md §2.2](../PLATFORM.md#22-what-the-platform-is-not) |
| Timing | Feature and marketing freeze from Month 10 onwards (6 months before 2027 election) | [Decision Log BIZ-20260720-11](./business/Decision%20Log.md) |

---

## 3. Users

The pilot serves Lagos-based users. Personas are detailed in [Personas.md](./Personas.md); summary below.

### 3.1 Primary Personas (Pilot)

| Persona | Role in pilot | Most important feature |
|---------|----------------|------------------------|
| **Amara — the engaged citizen** | First 500 users; provides the MAU base | Confidence votes and policy polls |
| **Tunde — the dispute-haver** | Drives evidence upload volume | Evidence integrity and lawyer matching |
| **Ngozi — the verified lawyer** | First 5–10 lawyers; provides marketplace supply | Lawyer profile and matching |
| **Kemi — the moderator** | Internal (staff); ensures content quality | Moderation queue and review tools |

Secondary personas (the lawyer's existing client, the casual observer, the journalist) are not pilot-blocking and are deferred to [Personas.md](./Personas.md) §3.

### 3.2 User Stories (Pilot MoSCoW)

#### Must-have

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Citizen | Complete NIMC (or Onfido) identity verification | I can vote and upload evidence |
| Citizen | Vote on a policy poll | I can express my view on a government initiative |
| Citizen | Vote on a confidence question for a Lagos official | I can express my approval/disapproval between elections |
| Citizen | Upload evidence (image, video, document) and see a verified badge | I can prove the evidence is unchanged from when I uploaded it |
| Citizen | See AI detection status on my image/video uploads | I know whether the file has been flagged as potentially manipulated |
| Citizen | Complete a lawyer intake form and get 3–5 matched lawyers | I can find a lawyer for my case |
| Citizen | Schedule a free 15-minute consultation with a matched lawyer | I can evaluate the lawyer before engaging |
| Verified lawyer | Register, complete bar verification, and create a profile | I can be matched to clients |
| Verified lawyer | Receive a notification when matched to a case | I can accept or decline |
| Moderator | Review the moderation queue | I can approve or remove flagged content |
| Moderator | Draft, review, and publish a poll | The platform has active polls |

#### Should-have

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Citizen | Appeal an AI detection flag | I can challenge a wrong assessment |
| Citizen | Read blog content and legal literacy modules | I can build my legal knowledge |
| Citizen | Comment on blog posts | I can engage with the community |
| Lawyer | Receive and respond to client reviews | My profile reflects my work |
| Admin | View the admin dashboard | I can see platform health at a glance |
| Admin | Manage user accounts (suspend, restore) | I can respond to abuse |

#### Could-have (pilot stretch)

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Citizen | Subscribe to the newsletter | I get updates about new polls and content |
| Citizen | See poll results broken down by LGA | I understand the geographic distribution |
| Lawyer | Set availability windows | I only get matched when I'm available |
| Moderator | Use the AI-assisted moderation suggestions | I can moderate faster |

#### Won't-have (this pilot)

- USSD access
- Local language UI
- Public API
- Government dashboard
- Sponsored content
- Premium verification

---

## 4. Functional Requirements

### 4.1 Identity Verification (Pillar 0 — the foundation)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-IDENT-01 | User can complete NIMC NVS verification by submitting NIN, DOB, and full name | Must |
| F-IDENT-02 | On NIMC failure or absence of NIN, user can complete Onfido document verification | Must |
| F-IDENT-03 | User sees a clear, consistent verification status in their profile | Must |
| F-IDENT-04 | Verification result is cached for 30 days to avoid repeat API calls | Must |
| F-IDENT-05 | Manual review is available for failed verifications and appeals | Must |
| F-IDENT-06 | User can re-attempt verification after a cool-down period (24h) | Must |

Full spec in [PLATFORM.md §6](../PLATFORM.md#6-identity-verification) and [ARCHITECTURE.md §5](../ARCHITECTURE.md#5-identity-verification).

### 4.2 Policy Polls (Pillar 1)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-POLL-01 | Moderator can draft a poll (title, summary, question, options, dates) | Must |
| F-POLL-02 | Poll draft is reviewed by Advisory Board before publication | Must |
| F-POLL-03 | Verified citizen can vote once per poll | Must |
| F-POLL-04 | Vote requires eligibility (verified + residing in jurisdiction) | Must |
| F-POLL-05 | Results page shows aggregated sentiment with confidence intervals | Must |
| F-POLL-06 | Results page shows a prominent non-binding disclaimer | Must |
| F-POLL-07 | User can suggest poll topics (not create them directly) | Must |
| F-POLL-08 | Public can view poll results without voting | Must |

Full spec in [PLATFORM.md §3.1](../PLATFORM.md#31-policy-sentiment-polls) and [PLATFORM.md §9.1](../PLATFORM.md#91-poll-governance).

### 4.3 Confidence Votes (Pillar 1)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-CONF-01 | Verified citizen can vote Yes / No / Uncertain on a Lagos official | Must |
| F-CONF-02 | Vote is anonymous and one-per-official-per-quarter | Must |
| F-CONF-03 | Results are aggregated quarterly (Jan, Apr, Jul, Oct) | Must |
| F-CONF-04 | Results page shows trend vs. previous quarter | Must |
| F-CONF-05 | Results page shows a prominent non-binding disclaimer | Must |
| F-CONF-06 | Official list is updated within 30 days of election/appointment | Must |

Full spec in [PLATFORM.md §3.2](../PLATFORM.md#32-confidence-votes-on-elected-officials) and [PLATFORM.md §9.2](../PLATFORM.md#92-confidence-vote-governance).

### 4.4 Evidence Integrity (Pillar 2)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-EVID-01 | User can upload a file (image, video, audio, document) and receive a SHA-256 hash | Must |
| F-EVID-02 | Uploaded file is stored with hash, timestamp, and uploader ID | Must |
| F-EVID-03 | File is re-hashed on every access; mismatch shows a "not verified" warning | Must |
| F-EVID-04 | Image and video files are passed through AI manipulation detection | Must |
| F-EVID-05 | AI detection returns Low / Medium / High confidence score with model version | Must |
| F-EVID-06 | High-confidence AI flags require human moderator review before display | Must |
| F-EVID-07 | User sees a clear distinction between integrity status and AI detection status | Must |
| F-EVID-08 | User can appeal an AI detection flag | Should |
| F-EVID-09 | All file access is logged in an audit trail | Must |

Full spec in [PLATFORM.md §4](../PLATFORM.md#4-evidence-integrity--deepfake-detection) and [ARCHITECTURE.md §6](../ARCHITECTURE.md#6-cache-layer) (for hash caching).

### 4.5 Lawyer Marketplace (Pillar 3)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-LAW-01 | Verified lawyer can register with bar license, jurisdiction, and practice areas | Must |
| F-LAW-02 | Lawyer profile shows fees, experience, languages, reviews | Must |
| F-LAW-03 | Citizen completes an intake form (case type, jurisdiction, budget, urgency) | Must |
| F-LAW-04 | Citizen receives 3–5 recommended lawyer profiles | Must |
| F-LAW-05 | Citizen can schedule a free 15–20 minute consultation via the platform | Must |
| F-LAW-06 | Consultation is platform-funded; lawyer is not paid for the consultation | Must |
| F-LAW-07 | Engagement (if any) is between lawyer and client, outside the platform | Must |
| F-LAW-08 | Verified client can post a moderated review after engagement | Must |
| F-LAW-09 | Platform takes a flat listing/subscription fee, **not** a percentage of legal fees | Must |
| F-LAW-10 | Lawyer can respond to reviews | Should |

Full spec in [PLATFORM.md §5](../PLATFORM.md#5-lawyer-matching--case-referral).

### 4.6 Blog and Legal Literacy

| ID | Requirement | Priority |
|----|-------------|----------|
| F-CONT-01 | Public can read blog articles and legal literacy modules | Must |
| F-CONT-02 | Articles and modules are organized by category | Must |
| F-CONT-03 | Writer role can create and edit drafts; cannot publish without moderator approval | Must |
| F-CONT-04 | Moderator can publish, unpublish, and delete content | Must |
| F-CONT-05 | Comments are open to verified users and are moderated | Must |
| F-CONT-06 | At least 50 blog articles and 8 legal literacy modules are live at pilot end | Must |
| F-CONT-07 | Editorial workflow includes fact-check, legal review, and accessibility check | Must |

Full spec in [PLATFORM.md §7](../PLATFORM.md#7-blog--content-platform).

### 4.7 Moderation

| ID | Requirement | Priority |
|----|-------------|----------|
| F-MOD-01 | All user-generated content (polls, comments, evidence, reviews) is subject to moderation | Must |
| F-MOD-02 | AI-assisted moderation flags high-confidence violations for human review | Must |
| F-MOD-03 | Moderator can take action: approve, remove, warn, suspend | Must |
| F-MOD-04 | User is notified of moderation action with reason | Must |
| F-MOD-05 | User can appeal moderation decisions | Must |
| F-MOD-06 | All moderation actions are logged for audit | Must |

Full spec in [PLATFORM.md §8](../PLATFORM.md#8-moderation--content-governance).

### 4.8 Admin and Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| F-ADMIN-01 | Admin can view platform dashboard (users, polls, evidence, lawyers, moderation) | Must |
| F-ADMIN-02 | Admin can manage user accounts (suspend, restore, change role) | Must |
| F-ADMIN-03 | Admin can manage lawyer verifications | Must |
| F-ADMIN-04 | Admin can publish the quarterly transparency report | Should |
| F-ADMIN-05 | All admin actions are logged for audit | Must |

---

## 5. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | API P95 response time (read, cache hit) | < 50ms |
| **Performance** | API P95 response time (read, cache miss) | < 200ms |
| **Performance** | Evidence upload (10MB file) | < 5s |
| **Performance** | NIMC verification | < 3s |
| **Performance** | Onfido verification | < 10s |
| **Scalability** | Concurrent verified users (pilot) | 500 |
| **Scalability** | Total verified users (pilot end) | 1,000 |
| **Security** | All data in transit | TLS 1.3 |
| **Security** | Passwords | Bun.password (argon2id) |
| **Security** | PII at rest | Postgres encryption |
| **Security** | NIN data at rest | AES-256 |
| **Security** | All connections via WireGuard VPN | Yes |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | Data Subject Access Request (DSAR) fulfillment | < 30 days |
| **Privacy** | Breach notification to NDPC | < 72 hours |
| **Accessibility** | WCAG | 2.1 AA |
| **Accessibility** | Plain-language reading level | Secondary education |
| **Localization** | Pilot languages | English only |
| **Reliability** | Uptime | ≥ 99.5% (pilot) |
| **Reliability** | RPO (PostgreSQL) | 1 hour |
| **Reliability** | RTO (PostgreSQL) | 30 minutes |
| **Observability** | Structured logging | All requests |
| **Observability** | Health check endpoint | `/health` |
| **Observability** | Alert on error rate > 5% | Yes |

Full perf targets in [ARCHITECTURE.md §14](../ARCHITECTURE.md#14-performance-targets).

---

## 6. User Experience

### 6.1 Key User Flows

Detailed flows are in [User Journeys.md](./User%20Journeys.md). The five most important:

1. **First-time user → verified citizen** (onboarding + identity verification)
2. **Verified citizen → policy poll voter** (discover poll, verify eligibility, vote, see results)
3. **Verified citizen → confidence voter** (same as above, scoped to an official)
4. **Citizen with dispute → matched lawyer** (intake, match, free consultation, optional engagement)
5. **Lawyer registration** (bar verification → profile creation → first match)

### 6.2 Onboarding

- ≤ 5 steps from landing to first action
- First value shown before verification is required (e.g., browse polls without voting)
- Non-binding disclaimer introduced at the **first poll encounter**, not buried in ToS
- Mobile-first responsive design (most pilot users will be on mobile)

### 6.3 Accessibility

- All interactive elements keyboard-navigable
- Color contrast WCAG 2.1 AA
- Text-to-speech compatible blog content
- Captions/transcripts for any video content
- Form labels and error messages readable by screen readers

### 6.4 Disclaimers (non-negotiable UX requirement)

The non-binding disclaimer must appear:

- On every poll results page (prominent, not footer)
- On every confidence vote results page (prominent)
- During onboarding (introduced, not buried)
- In every user-facing communication about polls (newsletter, blog mentions)

Recommended wording (per [PLATFORM.md §3.1.7](../PLATFORM.md#317-results-display) and §3.2.6):

> "This is citizen sentiment only. It has no legal or electoral weight."

---

## 7. Release Criteria (Pilot Definition of Done)

### 7.1 Feature-complete

- [ ] All Must-have features in §4 are implemented and accepted
- [ ] All Must-have acceptance criteria in §8 are verified

### 7.2 Quality

- [ ] Unit test coverage on services layer ≥ 80%
- [ ] Integration test coverage on API routes ≥ 70%
- [ ] E2E test coverage of the five key user journeys
- [ ] No P1 or P2 bugs open at launch
- [ ] Performance targets in §5 met under simulated 500-user load

### 7.3 Security and compliance

- [ ] NDPR compliance review passed (Legal Director sign-off)
- [ ] NBA consultation on lawyer marketplace fee model completed
- [ ] Security review passed (no critical or high findings open)
- [ ] Penetration test completed on staging environment
- [ ] All PII data flows documented and encrypted

### 7.4 Operations

- [ ] Runbooks for common incidents (NIMC outage, Onfido outage, AI detection failure, moderation surge) written and tested
- [ ] Monitoring and alerting configured (per [ARCHITECTURE.md §9](../ARCHITECTURE.md#9-observability))
- [ ] Backup and recovery procedures tested (per [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-disaster-recovery))
- [ ] On-call rotation established
- [ ] Support email and response SLA in place

### 7.5 Documentation

- [ ] User guide drafted (deferred to Phase 7 for customer-facing, but internal admin guide is ready)
- [ ] API documentation complete for the endpoints in scope
- [ ] This PRD updated to reflect any accepted scope changes
- [ ] Decision Log entries made for any decisions taken during build

### 7.6 Communications

- [ ] Pre-launch press / media briefing prepared
- [ ] Advisory Board briefed
- [ ] Donor / funder update prepared
- [ ] First quarterly transparency report templated

---

## 8. Acceptance Criteria (Pilot-critical)

These are the testable, must-pass criteria for launch. They are a subset of the full acceptance criteria; full criteria live in the Module Specs (Phase 3).

### 8.1 Identity Verification

- [ ] A user with a valid NIN can complete verification in ≤ 3 steps
- [ ] NIMC failure falls through to Onfido without user re-entering their name and DOB
- [ ] A verified user is marked `VERIFIED` in the database and can vote and upload evidence
- [ ] An unverified user cannot vote or upload evidence (returns 403 with the right error code)

### 8.2 Policy Polls

- [ ] A draft poll cannot be published without Advisory Board approval
- [ ] A verified user can vote exactly once per poll; a second attempt returns 409
- [ ] Poll results display a non-binding disclaimer
- [ ] Poll results include a confidence interval
- [ ] A poll outside its date range cannot be voted on

### 8.3 Confidence Votes

- [ ] A confidence vote for a Lagos official is available to verified Lagos residents only
- [ ] Vote results show quarter-over-quarter trend
- [ ] Each user can vote once per official per quarter

### 8.4 Evidence Integrity

- [ ] Every uploaded file has a SHA-256 hash and timestamp stored
- [ ] Modifying an uploaded file and re-accessing it shows a "not verified" warning
- [ ] An AI-flagged image is reviewed by a moderator before becoming visible to other users
- [ ] The AI detection status is shown to the uploader, with a clear explanation that it is not a definitive verdict
- [ ] File access is logged in the audit trail

### 8.5 Lawyer Marketplace

- [ ] A lawyer cannot create a profile without a valid bar license
- [ ] A citizen's intake form returns 3–5 matched lawyers
- [ ] The free consultation is scheduled via the platform and is free to the citizen
- [ ] The platform does **not** take a percentage of any legal fee
- [ ] A client can post a review only after a documented engagement

### 8.6 Moderation

- [ ] Flagged content does not become publicly visible without moderator action
- [ ] A user can appeal a moderation decision
- [ ] All moderation actions are logged

### 8.7 Security

- [ ] All API endpoints are behind TLS 1.3
- [ ] All admin actions are logged with actor, action, target, and timestamp
- [ ] PII data at rest is encrypted
- [ ] NDPR DSAR can be fulfilled in ≤ 30 days

---

## 9. Risks and Mitigations

The full Risk Register is in [PLATFORM.md §11](../PLATFORM.md#11-risk-register). The top risks specific to this PRD's scope:

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| NIMC NVS API integration takes longer than Phase 0 | Delays pilot launch | Medium | Onfido-only fallback; ship with NIMC integration in flight |
| AI detection false positives deter users from uploading legitimate evidence | Lower evidence volume | Medium | Clear "probabilistic" language; human review on High confidence; user appeal |
| Lawyers do not onboard to the marketplace | No Pillar 3 in pilot | Medium | Direct relationship-building; pro bono incentive; defer marketplace if needed |
| Public misperception of polls as binding | Reputational + regulatory | Medium | Repeated disclaimers; Advisory Board review; user education at onboarding |
| Naira devaluation makes API costs unsustainable | Funding gap widens | Medium | Open-source AI models; founder bridge; cost optimization levers (Business Case §4.3) |
| 2027 election cycle begins earlier than expected | Feature freeze triggered | Low | Marketing plan front-loaded for Months 4–9; election freeze defined as Months 10–18 |
| NBA issues guidance against our lawyer listing model | Loss of Pillar 3 | Low | Pre-launch NBA engagement; legal review of fee model; pause marketplace if needed |
| NIN coverage among Lagos users is below 70% | Verification friction | Medium | Onfido as primary for non-NIN users; manual review path |

---

## 10. Open Questions

| # | Question | Owner | Status | Resolution path |
|---|----------|-------|--------|------------------|
| 1 | Will the NIMC NVS API access be confirmed before Month 3? | Engineering Lead | Open | Engagement in progress |
| 2 | What is the realistic CAC for a Lagos citizen through organic + paid channels? | Marketing Lead | Open | Pre-pilot research |
| 3 | What is the right pricing for the basic lawyer listing (₦3K/mo or higher)? | Operations + Finance | Open | Pre-pilot research |
| 4 | Will the NBA confirm that flat listing fees are compliant before pilot launch? | Legal Director | Open | Direct engagement |
| 5 | What is the trust baseline among Lagos citizens for "non-binding" framing? | Product Lead | Open | Pre-pilot survey |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md).

---

## 11. Milestones and Timeline

Detailed in [Roadmap.md](./Roadmap.md). High-level:

| Milestone | Target | Gate |
|-----------|--------|------|
| Phase 0 complete (NIMC integration, advisory board, infra) | Month 3 | Advisory Board + Engineering review |
| Pilot launch (Lagos, 100 beta users) | Month 4 | All §7 criteria met |
| Mid-pilot review | Month 6 | Decision to scale to 3 states |
| Pilot end / scale to 3 states | Month 12 | MAU and engagement targets met |
| National expansion | Year 2 | Sustainability and regulatory clearance |

---

## 12. Approval

This PRD is approved by:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Lead | | | |
| Project Sponsor | | | |
| Engineering Lead | | | |
| Design Lead | | | |
| Legal Director | | | |
| Operations Director | | | |

---

## Appendix A: Glossary
- **DSAR** — Data Subject Access Request (under NDPR)
- **LGA** — Local Government Area
- **LIPO** — Lawyer In, Person Out (consultation)
- **LME** — Large Model Ensemble (AI detection)
- **NBA** — Nigerian Bar Association
- **NDPR** — Nigeria Data Protection Regulation
- **NIN** — National Identification Number
- **NVS** — National Verification Service (NIMC)

## Appendix B: References
- [PLATFORM.md](../PLATFORM.md) — full product vision
- [Project Charter](../business/Project%20Charter.md) — strategy and boundaries
- [Business Case](../business/Business.md) — financial model
- [Market Research](../business/Market%20Research.md) — market context
- [Decision Log](../business/Decision%20Log.md) — running decision index
- [Personas.md](./Personas.md) — user archetypes
- [User Journeys.md](./User%20Journeys.md) — end-to-end flows
- [Roadmap.md](./Roadmap.md) — phased feature roadmap
- [ARCHITECTURE.md](../ARCHITECTURE.md) — technical architecture
- [RBAC.md](../technical/RBAC.md) — role-based access control

## Appendix C: PRD Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Product Lead | Initial draft. Lagos pilot scope only. References PLATFORM.md for full product vision rather than duplicating it. |