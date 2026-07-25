# Release Process

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active*
*Owner: Engineering Lead + Project Sponsor*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial set. Establishes the formal release process for the pilot, including the release checklist, the go/no-go decision, the rollback plan, the post-release monitoring, and the release retrospective.

> **How to read this document:** This is the **formal release process** for the platform. It defines what must be true before we go live, who decides, what happens if it goes wrong, and what we watch for after. For the technical deployment procedure, see [../technical/Infrastructure.md §3](../technical/Infrastructure.md#3-deployment-process). For the runbooks used during the release, see [Runbooks.md](./Runbooks.md).

> **Related documents:**
> - [../technical/Infrastructure.md §3](../technical/Infrastructure.md#3-deployment-process) — the technical deployment procedure
> - [../technical/Security.md](../technical/Security.md) — the security architecture (release gate)
> - [../technical/QA.md](../technical/QA.md) — the testing strategy (release gate)
> - [../product/PRD.md §7](../product/PRD.md#7-release-criteria-pilot-definition-of-done) — the pilot release criteria
> - [Runbooks.md](./Runbooks.md) — the operational runbooks

---

## 1. Release Philosophy

A release is a **commitment to our users** that the platform is ready for them. Three principles guide our releases:

| Principle | Application |
|-----------|-------------|
| **Quality over speed** | We do not ship a release that doesn't meet the gates. The cost of a bad release is higher than the cost of a delay. |
| **Reversibility** | Every release is reversible. The rollback plan is tested before the release, not after. |
| **Learning** | Every release is a learning opportunity. The retrospective feeds the next release's process. |

---

## 2. Release Types

The platform has four types of releases, each with a different process.

### 2.1 Pilot Launch (the First Release)

The pilot launch is the first time the platform is available to real users. It is the highest-stakes release.

- **Audience:** 500 Lagos users (the pilot cohort)
- **Process:** the full release process (§3 below)
- **Approval:** Project Sponsor + Engineering Lead + Legal Director
- **Rollback plan:** full rollback (the platform is reverted to "coming soon" page)
- **Post-release monitoring:** the most intense (1 month of close monitoring)

### 2.2 Major Releases (Phase Transitions)

A major release is a significant feature addition or a phase transition (e.g., the Phase 2 expansion to 3 states).

- **Audience:** all users in the affected states
- **Process:** the full release process (§3 below), but with a faster turnaround for non-blocking items
- **Approval:** Engineering Lead + Project Lead
- **Rollback plan:** feature rollback or full rollback (depending on the change)
- **Post-release monitoring:** 1 week of close monitoring

### 2.3 Minor Releases (Regular Updates)

A minor release is a regular update with bug fixes, performance improvements, or non-breaking feature additions.

- **Audience:** all users
- **Process:** the standard deployment process ([../technical/Infrastructure.md §3](../technical/Infrastructure.md#3-deployment-process)) + the release checklist (§3 below, abbreviated)
- **Approval:** Engineering Lead
- **Rollback plan:** deployment rollback
- **Post-release monitoring:** 24 hours of close monitoring

### 2.4 Hotfixes (Emergency Fixes)

A hotfix is an emergency fix for a P1 incident or a critical security issue.

- **Audience:** all users
- **Process:** the abbreviated hotfix process ([../technical/Infrastructure.md §3.4](../technical/Infrastructure.md#34-rollback))
- **Approval:** Engineering Lead (or the on-call engineer if the Engineering Lead is unavailable)
- **Rollback plan:** deployment rollback
- **Post-release monitoring:** until the issue is confirmed resolved

---

## 3. The Release Process

The release process has six phases. Each phase has specific gates. If any gate fails, the release is delayed (or the release is rolled back, if already deployed).

### 3.1 Phase 1: Pre-Release Planning (T-14 days)

The pre-release planning phase starts 2 weeks before the target release date. The purpose is to ensure the release is well-defined, the team is prepared, and the gates are achievable.

**Activities:**

- [ ] **Release scope is defined:** the specific features, fixes, and changes in this release are documented
- [ ] **Release date is confirmed:** the target release date is communicated to the team, the users (if applicable), and the stakeholders
- [ ] **Release owner is assigned:** the Engineering Lead is the default owner; a specific engineer may be assigned for a major release
- [ ] **Rollback plan is documented:** the specific steps to roll back the release (see §6)
- [ ] **Communication plan is documented:** who is notified, when, and how (see §7)
- [ ] **Feature flags are set:** any features that should be off by default are flagged
- [ ] **Pre-release checklist is started:** the items in §4 are tracked

**Gate:** the release scope, date, owner, and rollback plan are all documented and approved by the Engineering Lead.

### 3.2 Phase 2: Pre-Release Testing (T-7 days)

The pre-release testing phase starts 1 week before the target release date. The purpose is to verify the release meets the quality gates.

**Activities:**

- [ ] **All "Must-have" features are implemented and accepted:** per [../product/PRD.md §7.1](../product/PRD.md#71-feature-complete)
- [ ] **All "Must-have" acceptance criteria are verified:** per [../product/PRD.md §8](../product/PRD.md#8-acceptance-criteria-pilot-critical) and the module specs
- [ ] **The full test suite passes:** unit, integration, E2E (per [../technical/QA.md](../technical/QA.md))
- [ ] **The security tests pass:** per [../technical/QA.md §7](../technical/QA.md#7-security-tests)
- [ ] **The performance tests pass:** load test at expected traffic, per [../technical/QA.md §13](../technical/QA.md#133-load-testing)
- [ ] **The fee model grep passes:** per [../technical/Engineering.md §6](../technical/Engineering.md#6-the-fee-model-grep-audit)
- [ ] **The voter anonymization tests pass:** per [../technical/QA.md §7.3](../technical/QA.md#73-the-voter-anonymization-test)
- [ ] **The penetration test report is reviewed and findings are addressed:** per [../technical/QA.md §7.2](../technical/QA.md#72-penetration-testing)
- [ ] **The rollback plan is rehearsed in staging:** the rollback is tested, not just documented
- [ ] **The NDPR compliance review is complete:** per [../technical/Security.md §9.1](../technical/Security.md#91-ndpr-nigeria-data-protection-regulation)
- [ ] **The Bar Association engagement is complete:** per [../technical/Security.md §9.2](../technical/Security.md#92-nigerian-bar-association-rules)
- [ ] **The documentation is complete:** user guide, API documentation, runbooks
- [ ] **The operational runbooks are tested:** the on-call engineer can execute the most common runbooks
- [ ] **The transparency report template is ready:** the first quarterly report is templated
- [ ] **The pre-launch press / media briefing is prepared:** per [../product/PRD.md §7.6](../product/PRD.md#76-communications)

**Gate:** all items above are checked. The Engineering Lead signs off on the technical readiness. The Legal Director signs off on the compliance readiness.

### 3.3 Phase 3: The Go/No-Go Decision (T-1 day)

The go/no-go decision is made the day before the target release date. The decision is **explicit** — the team does not "go" by default. The decision is based on the pre-release checklist and any last-minute issues.

**Decision-makers:**
- **Engineering Lead:** technical readiness (all gates passed)
- **Project Sponsor:** strategic readiness (funding, communications, stakeholders)
- **Legal Director:** compliance readiness (NDPR, Bar Association, etc.)

**The meeting:**
- 30 minutes, scheduled the day before the release
- Each decision-maker states their position: GO, NO-GO, or GO-WITH-CONDITIONS
- If all are GO: the release proceeds
- If any is NO-GO: the release is delayed (a new date is set)
- If any is GO-WITH-CONDITIONS: the conditions are documented and must be met before the release proceeds

**The decision is documented:**
- Date and time of the decision
- Each decision-maker's position
- The conditions (if any)
- The decision (GO / NO-GO)
- The next steps

### 3.4 Phase 4: The Release Day (T-0)

The release day is the day the platform goes live. The release follows the technical deployment procedure ([../technical/Infrastructure.md §3](../technical/Infrastructure.md#3-deployment-process)) and the release checklist (§4 below).

**Activities:**

- [ ] **Pre-deployment checks:** the release checklist is verified one more time
- [ ] **Staging deployment:** the release is deployed to staging and smoke-tested
- [ ] **Production deployment (blue-green):** the release is deployed to the "green" environment, the health check passes, and the load balancer is swapped
- [ ] **Initial smoke tests:** the key flows are verified (login, vote, upload, find lawyer, consult)
- [ ] **Monitoring is active:** the dashboards, alerts, and logs are confirmed
- [ ] **Communication is sent:** the release announcement is sent to the team, the users (if applicable), and the stakeholders
- [ ] **The on-call engineer is on standby:** the release day is staffed

**Gate:** all items above are checked. The release is "live."

### 3.5 Phase 5: Post-Release Monitoring (T+0 to T+1 month)

The post-release monitoring phase is the most intense for the first 24 hours, then gradually relaxes.

**The first hour:**
- [ ] All endpoints are responding
- [ ] The error rate is < 1%
- [ ] The response time is within the targets
- [ ] The user flows are working (login, vote, upload, find lawyer, consult)
- [ ] No alerts are firing
- [ ] The on-call engineer is actively monitoring

**The first day:**
- [ ] The error rate is stable
- [ ] The user signups are happening
- [ ] The first poll is going live
- [ ] The first evidence upload is happening
- [ ] The first lawyer match is happening
- [ ] No major issues reported

**The first week:**
- [ ] The first moderation actions are happening
- [ ] The first support requests are coming in
- [ ] The first transparency report data is being collected
- [ ] The user feedback is being monitored

**The first month:**
- [ ] The first quarterly transparency report is published
- [ ] The first post-mortem (if any incidents) is written
- [ ] The release retrospective is held

### 3.6 Phase 6: The Release Retrospective (T+1 month)

The release retrospective is a blameless review of the release process. The purpose is to learn and improve.

**Activities:**
- [ ] **What went well:** the things that worked
- [ ] **What went poorly:** the things that didn't
- [ ] **Where we got lucky:** the things that could have gone worse
- [ ] **Action items:** the things that will be changed for the next release

**Participants:** the release team, the Engineering Lead, the Operations Director, the Project Lead.

**Output:** the retrospective document is shared with the team. The action items are tracked in the issue tracker.

---

## 4. The Release Checklist (Pre-Release)

This is the master checklist. Every item must be checked before the release proceeds. If any item fails, the release is delayed.

### 4.1 The Code and Testing Gate

- [ ] All "Must-have" features are implemented and accepted (per [../product/PRD.md §7.1](../product/PRD.md#71-feature-complete))
- [ ] All "Must-have" acceptance criteria are verified (per [../product/PRD.md §8](../product/PRD.md#8-acceptance-criteria-pilot-critical))
- [ ] All "Should-have" features are evaluated; the decision to include or defer is documented
- [ ] The full unit test suite passes (≥ 85% coverage for services)
- [ ] The full integration test suite passes (≥ 70% of endpoints)
- [ ] All 8 user journeys have E2E tests that pass
- [ ] The negative test rule is satisfied (for every "can do" test, there's a "cannot do" test)
- [ ] The security tests pass (per [../technical/QA.md §7](../technical/QA.md#7-security-tests))
- [ ] The penetration test report is reviewed and findings are addressed
- [ ] The performance tests pass (load test at expected traffic)
- [ ] The fee model grep passes
- [ ] The voter anonymization tests pass
- [ ] No P1 or P2 bugs are open
- [ ] All merged PRs have been deployed to staging and verified

### 4.2 The Quality Gate

- [ ] The Definition of Done is met for all included features (per [../technical/Engineering.md §14](../technical/Engineering.md#14-the-definition-of-done))
- [ ] The code review process was followed for all PRs
- [ ] The "two pairs of eyes" rule was applied where required
- [ ] The engineering standards are met (per [../technical/Engineering.md](../technical/Engineering.md))
- [ ] The negative tests are present and passing
- [ ] The fee model grep is passing
- [ ] No secrets in code
- [ ] No `console.log` debugging statements
- [ ] No commented-out code
- [ ] No `any` types without justification

### 4.3 The Security and Compliance Gate

- [ ] NDPR compliance review is complete (per [../technical/Security.md §9.1](../technical/Security.md#91-ndpr-nigeria-data-protection-regulation))
- [ ] Bar Association engagement is complete (per [../technical/Security.md §9.2](../technical/Security.md#92-nigerian-bar-association-rules))
- [ ] The penetration test report is reviewed and findings are addressed
- [ ] The security tests pass (per [../technical/QA.md §7](../technical/QA.md#7-security-tests))
- [ ] The voter anonymization tests pass
- [ ] The fee model tests pass
- [ ] The voter token pepper is in the environment variable (not in code)
- [ ] The JWT signing secret is in the environment variable (not in code)
- [ ] All secrets are rotated per the schedule
- [ ] The audit log is functioning
- [ ] The DSAR fulfillment process is documented and tested
- [ ] The breach notification process is documented and tested

### 4.4 The Documentation Gate

- [ ] The API documentation is complete and accurate (per [../technical/API.md](../technical/API.md))
- [ ] The database schema is documented (per [../technical/Database.md](../technical/Database.md))
- [ ] The module specs are up-to-date
- [ ] The user guide is drafted (the user-facing documentation; the final version is in Phase 7)
- [ ] The runbooks are complete and tested (per [Runbooks.md](./Runbooks.md))
- [ ] The release process is documented (this document)
- [ ] The transparency report template is ready
- [ ] The internal documentation is up-to-date (ADRs, Decision Log, etc.)

### 4.5 The Operations Gate

- [ ] The deployment process is rehearsed in staging (per [../technical/Infrastructure.md §3](../technical/Infrastructure.md#3-deployment-process))
- [ ] The rollback plan is rehearsed in staging
- [ ] The health check endpoint returns 200 and all dependencies are healthy
- [ ] The monitoring is active (dashboards, alerts, logs)
- [ ] The on-call engineer is identified and on standby
- [ ] The backup and recovery procedures are tested
- [ ] The incident response procedures are tested (a tabletop exercise)
- [ ] The communication channels are set up (engineering Slack, leadership email, user support, etc.)
- [ ] The support channels are set up (support@, in-app help, etc.)
- [ ] The escalation matrix is documented and tested
- [ ] The post-release monitoring plan is documented (see §3.5)

### 4.6 The Communications Gate

- [ ] The pre-launch press / media briefing is prepared (per [../product/PRD.md §7.6](../product/PRD.md#76-communications))
- [ ] The user-facing release announcement is drafted
- [ ] The Advisory Board is briefed
- [ ] The donor / funder update is prepared
- [ ] The internal team announcement is prepared
- [ ] The in-app banner for the release day is ready
- [ ] The newsletter (if applicable) is scheduled
- [ ] The press kit is ready (if applicable)

### 4.7 The Business Gate

- [ ] The Year 1 funding gap is closed (per [../business/Business.md §7.1](../business/Business.md#71-the-3m-year-1-gap--closure-plan))
- [ ] The pilot cohort is identified (500 Lagos users)
- [ ] The pilot support is staffed
- [ ] The pilot metrics are defined
- [ ] The pilot success criteria are documented

### 4.8 The Final Approval

- [ ] **Engineering Lead:** technical readiness signed off
- [ ] **Project Sponsor:** strategic readiness signed off
- [ ] **Legal Director:** compliance readiness signed off
- [ ] **Operations Director:** operational readiness signed off
- [ ] **Project Lead:** project readiness signed off

If all approvals are GO, the release proceeds. If any approval is NO-GO or GO-WITH-CONDITIONS, the release is delayed or the conditions are addressed.

---

## 5. The Pilot Launch (the First Release)

The pilot launch is the first time the platform is available to real users. It is the highest-stakes release, and it has some specific additional requirements.

### 5.1 The Pilot Cohort

The pilot cohort is 500 Lagos-based verified users. The cohort is selected to represent the user personas (Amara, Tunde, Ngozi) and the geographic distribution within Lagos.

**Recruitment:**
- [ ] 50 users via existing networks (founders' contacts, Advisory Board)
- [ ] 200 users via civil society organizations (NGOs, Bar Association chapters)
- [ ] 100 users via law firm partnerships (for the lawyer-side)
- [ ] 150 users via targeted outreach (community groups, professional associations)

**Selection criteria:**
- Verified (NIN or Onfido)
- Lagos-based
- 18+ years old
- Willing to provide feedback
- Diverse across age, gender, occupation, and LGA

### 5.2 The Pre-Pilot Research (5 Blocking Items)

The Market Research §4.3 lists 5 blocking research items that must be completed before the pilot:

- [ ] Willingness-to-pay for lawyer listings (50+ lawyer survey)
- [ ] NIN coverage among likely platform users (NIMC data + sample survey)
- [ ] Trust baseline for civic platforms (200+ citizen survey)
- [ ] How citizens currently resolve disputes (15+ citizen interviews)
- [ ] Bar Association's posture on third-party lawyer listings (direct engagement)

These are owned by specific people and must be completed by the pre-release planning phase (T-14 days).

### 5.3 The Pilot-Specific Quality Gates

In addition to the standard release gates, the pilot launch requires:

- [ ] All 5 pre-pilot research items are complete
- [ ] The pilot cohort is recruited
- [ ] The pilot onboarding materials are ready (welcome email, in-app tutorial, etc.)
- [ ] The pilot feedback mechanism is set up (in-app survey, support email, etc.)
- [ ] The pilot metrics dashboard is set up
- [ ] The pilot success criteria are communicated to the team
- [ ] The pilot risk register is reviewed (per [../product/PLATFORM.md §11](../product/PLATFORM.md#11-risk-register))
- [ ] The 2027 election freeze is accounted for in the pilot timeline

### 5.4 The Pilot-Specific Communication

- [ ] The Advisory Board is briefed on the pilot launch
- [ ] The donor / funder update is sent (with the pilot metrics plan)
- [ ] The pilot cohort receives a welcome email with onboarding instructions
- [ ] The press / media briefing is held (per the communications plan)
- [ ] The in-app banner for the pilot launch is set
- [ ] The status page is set up (if available)

### 5.5 The Pilot Post-Release Monitoring

The pilot post-release monitoring is more intense than other releases because it's the first time real users are on the platform.

**The first 24 hours:**
- On-call engineer is on standby for the full 24 hours
- The error rate is monitored continuously
- The user signups are monitored
- Any user-facing issue is addressed immediately
- A daily status update is sent to the team and the Project Sponsor

**The first week:**
- Daily status updates
- Daily user feedback review
- Daily pilot metrics review
- Any P1/P2 issue is addressed immediately
- The first weekly retrospective is held

**The first month:**
- Weekly status updates
- Weekly user feedback review
- Weekly pilot metrics review
- The first quarterly transparency report is published
- The pilot retrospective is held

---

## 6. The Rollback Plan

Every release is reversible. The rollback plan is tested before the release, not after.

### 6.1 The Rollback Decision

The decision to roll back a release is made by:
- **For P1 incidents during release:** the on-call engineer (with immediate notification to the Engineering Lead)
- **For other incidents:** the Engineering Lead, in consultation with the Project Lead

**The criteria for rolling back:**
- The release has caused a P1 incident that cannot be mitigated within 1 hour
- The release has caused data loss or data corruption
- The release has caused a security incident
- The release has failed the pilot's success criteria within the first 24 hours

**The decision is documented:** the time, the reason, the decision-maker, and the next steps.

### 6.2 The Rollback Procedure

The rollback procedure depends on the type of release.

#### 6.2.1 Rollback for a Blue-Green Deployment (Default)

The standard procedure:

```bash
# 1. Identify the previous "blue" environment
ls /opt/najia-{blue,green}

# 2. Swap the load balancer to point to the previous "blue"
sudo ln -sf /etc/nginx/sites-available/najia-blue /etc/nginx/sites-enabled/najia
sudo systemctl reload nginx

# 3. Verify the rollback
sleep 30
curl -fsS https://najiacommunitybridge.com/health

# 4. Communicate the rollback
# (use the P1 communication templates from Runbooks.md)

# 5. Stop the "green" environment
sudo systemctl stop najia-green

# 6. Investigate the failure
# 7. Fix the issue
# 8. Plan the next release
6.2.2 Rollback for a Database Migration
Database migrations are the most dangerous part of a release. The rollback procedure depends on whether the migration is reversible.

For a reversible migration (additive only):

Roll back the code (per §6.2.1)
The database remains in the new schema (no further action)
For a non-reversible migration (data transformation, column drop):

Do not roll back the code — the old code may not work with the new schema
Restore the database from the most recent backup (per ../technical/Infrastructure.md §4.5)
Apply any necessary migrations to bring the database to the expected state
Verify the data integrity
Communicate the rollback
For a pilot launch rollback specifically:

The "coming soon" page is restored
The pilot cohort is notified that the launch is delayed
The user data collected so far is preserved (no data loss)
The post-mortem is written to identify the cause
6.2.3 Rollback for a Feature Flag Toggle
The simplest rollback: toggle the feature flag off.

Bash

# Toggle the feature flag off (the previous state)
# (use the admin shell or the feature_flags API)

# Verify the change
curl -fsS https://najiacommunitybridge.com/health
6.3 The Rollback Verification
After any rollback, verify:

 The health check endpoint returns 200
 The affected functionality is restored to the previous behavior
 The error rate returns to normal
 The user flows are working again
 The data integrity is preserved (if applicable)
6.4 The Post-Rollback Actions
 Communicate the rollback (per the communication plan)
 Investigate the root cause
 Write a post-mortem
 Plan the fix
 Plan the next release (with the fix included)
 Update the runbooks based on the lessons learned
7. The Communication Plan
The communication plan defines who is notified, when, and how, at each phase of the release.

7.1 The Communication Matrix
Audience	Channel	When	What
Engineering team	Engineering Slack	T-7 days, T-1 day, T-0, T+0 (during release), T+1 day, T+1 week	Status updates, action items, decisions
Project Sponsor	Email + Slack DM	T-7 days, T-1 day, T-0, T+1 day, T+1 week	Decision points, status updates, risk escalations
Legal Director	Email + Slack DM	T-7 days, T-1 day, T-0, T+1 day	Compliance sign-offs, risk escalations
Operations Director	Email + Slack DM	T-7 days, T-0, T+1 day, T+1 week	Operational readiness, post-release monitoring
Advisory Board	Email	T-7 days, T-0, T+1 week	Release notification, post-release update
Donors / funders	Email	T-7 days, T+1 week	Release notification, post-release update
Pilot cohort	Email + in-app	T-1 day, T-0, T+0 (welcome), T+1 week	Welcome, onboarding, check-in
Press / media	Press kit + briefing	T-7 days, T-0, T+1 week	Press release, follow-up
Public	In-app banner + status page	T-0, ongoing	Release announcement, status updates
7.2 The Communication Templates
The communication templates are in Runbooks.md §5. The release-specific templates are:

7.2.1 The T-7 Days Announcement (Internal)
text

Subject: [Release Name] — T-7 days to release

Team,

[Release Name] is scheduled for [DATE]. Here's the current status:

Release scope: [DESCRIPTION]
Release owner: [NAME]
Rollback plan: [DESCRIPTION]
Pre-release checklist: [LINK]

Key dates:
- T-7 days (today): pre-release testing begins
- T-1 day: go/no-go meeting at [TIME]
- T-0: release day
- T+1 day: first post-release status update
- T+1 week: first weekly retrospective
- T+1 month: release retrospective

Please review the pre-release checklist and flag any blockers.

Thanks,
[ENGINEERING LEAD]
7.2.2 The T-0 Release Announcement (Internal)
text

Subject: 🚀 [Release Name] — LIVE

Team,

[Release Name] is now live in production.

Deployment completed at: [TIME]
Health check: ✅ healthy
Smoke tests: ✅ passing
Initial monitoring: ✅ active

Post-release monitoring plan:
- First hour: on-call engineer actively monitoring
- First day: daily status updates
- First week: weekly retrospectives
- First month: release retrospective

Please report any issues immediately in this channel.

Thanks,
[ENGINEERING LEAD]
7.2.3 The T-0 User-Facing Announcement
text

Subject: Welcome to Najia Community Bridge!

We're excited to announce that the Najia Community Bridge is now available in Lagos.

What is it?
A civic engagement and access-to-justice platform where you can:
- Vote on policy polls (your voice on government policies)
- Upload evidence for civil disputes (verified for integrity)
- Connect with verified lawyers (free 15-minute consultation)
- Read legal guides and take legal literacy courses

Important: All polls are non-binding expressions of citizen sentiment. They have no legal or electoral weight. Your vote is recorded anonymously.

Get started: [LINK]

If you have any questions, contact us at support@.

Thanks for being part of the pilot!
The Najia Community Bridge Team
8. The Release Retrospective
The release retrospective is a blameless review of the release process. The purpose is to learn and improve.

8.1 The Retrospective Template
Markdown

# Release Retrospective: [Release Name]

*Date: [YYYY-MM-DD]*
*Author: [Release owner]*
*Participants: [NAMES]*

## Summary

[One-paragraph summary of the release: what was released, when, how it went.]

## What Went Well

- [THING 1]
- [THING 2]
- [THING 3]

## What Went Poorly

- [THING 1]
- [THING 2]
- [THING 3]

## Where We Got Lucky

- [THING 1]

## What We Learned

- [LEARNING 1]
- [LEARNING 2]

## Action Items

| # | Action | Owner | Deadline | Status |
|---|--------|-------|----------|--------|
| 1 | [ACTION] | [OWNER] | [DATE] | [Open / Done] |
| 2 | [ACTION] | [OWNER] | [DATE] | [Open / Done] |
| 3 | [ACTION] | [OWNER] | [DATE] | [Open / Done] |
8.2 The Retrospective Process
 The release retrospective is held within 1 week of the release (for minor releases) or 1 month (for major releases and the pilot launch)
 The release owner facilitates the retrospective
 All participants contribute
 The action items are tracked in the issue tracker
 The retrospective document is shared with the team
 The action items are reviewed at the next retrospective
9. The Release Schedule
9.1 The Pilot Launch Schedule
Date	Activity	Owner
2026-07-20	Pre-release planning starts (T-14)	Engineering Lead
2026-07-27	Pre-release testing starts (T-7)	Engineering Lead
2026-08-02	Pre-pilot research due	Product Lead + Operations Director
2026-08-03	Go/no-go decision (T-1)	Engineering Lead + Project Sponsor + Legal Director
2026-08-04	Pilot launch (T-0)	Engineering Lead
2026-08-04 (T+0 to T+24h)	First 24 hours of post-release monitoring	Operations Director + on-call engineer
2026-08-05 to T+1 week	First week of post-release monitoring	Operations Director
2026-08-04 to T+1 month	First month of post-release monitoring	Operations Director
2026-09-04 (T+1 month)	Release retrospective	Engineering Lead
9.2 The Recurring Release Cadence
After the pilot launch, the platform moves to a regular release cadence:

Minor releases: weekly (Tuesday 10:00 UTC)
Major releases: monthly (first Tuesday of the month)
Hotfixes: as needed (with Engineering Lead approval)
Pilot cohort feedback: continuous (via the in-app feedback mechanism)
The release schedule is maintained in the project management tool and communicated to the team.

10. Open Questions
#	Question	Owner	Status
1	Should we have a public status page (status.najiacommunitybridge.com)?	Operations Director	Open — recommend yes in Year 2
2	Should the pilot cohort be expanded beyond 500 users?	Project Lead	Open — pending pilot results
3	How do we handle a rollback that affects the pilot cohort's data?	Legal Director + Engineering Lead	Open — needs policy
4	What is the right cadence for major releases in Phase 2?	Engineering Lead + Product Lead	Open — depends on Phase 2 features
5	Should the release process be automated (CI/CD with auto-deploy)?	Engineering Lead	Open — pilot is manual; automation is Y2
Resolved questions move to the Decision Log. Decisions that affect the release process require the Engineering Lead and the Project Sponsor's sign-off.

Appendix A: The Release Checklist (Quick Reference)
The master checklist is in §4. This is a one-page summary.

A.1 Code and Testing Gate
 All "Must-have" features accepted
 All acceptance criteria verified
 Full test suite passes (unit, integration, E2E)
 Security tests pass
 Performance tests pass
 Fee model grep passes
 Voter anonymization tests pass
 No P1/P2 bugs open
A.2 Quality Gate
 Definition of Done met
 Code review process followed
 "Two pairs of eyes" applied where required
 Engineering standards met
 Negative tests present
 No secrets in code
 No debugging statements
 No commented-out code
 No unjustified any
A.3 Security and Compliance Gate
 NDPR compliance review complete
 Bar Association engagement complete
 Penetration test findings addressed
 Security tests pass
 Voter anonymization tests pass
 Fee model tests pass
 Voter token pepper in env var
 JWT secret in env var
 Secrets rotated per schedule
 Audit log functioning
 DSAR process documented
 Breach notification process documented
A.4 Documentation Gate
 API documentation complete
 Database schema documented
 Module specs up-to-date
 User guide drafted
 Runbooks complete
 Release process documented
 Transparency report template ready
 Internal documentation up-to-date
A.5 Operations Gate
 Deployment rehearsed in staging
 Rollback plan rehearsed in staging
 Health check returning 200
 Monitoring active
 On-call engineer identified
 Backup and recovery tested
 Incident response tested
 Communication channels set up
 Support channels set up
 Escalation matrix documented
 Post-release monitoring plan documented
A.6 Communications Gate
 Press / media briefing prepared
 User-facing release announcement drafted
 Advisory Board briefed
 Donor / funder update prepared
 Internal team announcement prepared
 In-app banner ready
 Press kit ready
A.7 Business Gate
 Year 1 funding gap closed
 Pilot cohort identified
 Pilot support staffed
 Pilot metrics defined
 Pilot success criteria documented
A.8 Final Approval
 Engineering Lead
 Project Sponsor
 Legal Director
 Operations Director
 Project Lead
Appendix B: Related Documents
../technical/Infrastructure.md §3 — the technical deployment procedure
../technical/QA.md — the testing strategy (the release gates)
../technical/Security.md — the security architecture (release gate)
../product/PRD.md §7 — the pilot release criteria
../business/Market Research.md §4.3 — the 5 pre-pilot research items
Runbooks.md — the operational runbooks (used during the release)
Operations.md — the operational reference
Support.md — the support process (forthcoming)
../business/Decision Log.md — business-level decisions
Appendix C: Release Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead + Project Sponsor	Initial set. Establishes the formal release process with 4 release types (pilot launch, major, minor, hotfix), 6 phases (planning, testing, go/no-go, release day, monitoring, retrospective), the 8 release gates (code/testing, quality, security/compliance, documentation, operations, communications, business, final approval), the explicit rollback plan (with blue-green, database migration, and feature flag scenarios), the post-release monitoring plan (1 hour → 1 day → 1 week → 1 month), the communication plan (with the audience, channel, timing, and content), the release retrospective (with the blameless principle), and the pilot launch schedule. The most important additions are the explicit rollback plan (§6) and the post-release monitoring plan (§3.5) — these ensure that the release is both reversible and observable.