# Customer Support

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active*
*Owner: Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial set. Establishes the customer support process for the pilot, including the support channels, the tier system, the SLAs, the escalation paths, the integration with incident response, and the help center approach.

> **How to read this document:** This is the **customer support reference** for the platform. It defines how users get help, how support requests are triaged, how they escalate, and how the support process integrates with incident response. For the incident response, see [Operations.md §6](./Operations.md#6-incident-response). For the runbooks, see [Runbooks.md](./Runbooks.md).

> **Related documents:**
> - [Operations.md](./Operations.md) — the operational reference
> - [Runbooks.md](./Runbooks.md) — the operational runbooks
> - [../product/Personas.md](../product/Personas.md) — the user archetypes (helps with tone and channel choice)
> - [../product/User Journeys.md](../product/User%20Journeys.md) — the user flows (helps with troubleshooting)
> - [../business/Market Research.md §4](../business/Market%20Research.md#4-user-research) — the user research (informs the support priorities)

---

## 1. Support Philosophy

The support function exists to help users succeed on the platform. Three principles guide our work:

| Principle | Application |
|-----------|-------------|
| **Help, don't deflect** | Every support request is a real person with a real need. We respond with empathy and we solve the problem. |
| **Self-service first** | The first goal is to have the answer in the help center, not in the support inbox. Every support request should result in a help center article (or an improvement to an existing one). |
| **Support is a signal** | A spike in support requests can be the first signal of an incident. The support process feeds into the monitoring and alerting. |

---

## 2. The Support Channels

### 2.1 The Primary Channel: Email

**support@najiacommunitybridge.com**

The primary support channel for the pilot. Users send an email; the support inbox is monitored by the Operations Engineer (Tier 1) and the Engineering Lead (Tier 2/3 escalation).

**The email is configured with:**
- An auto-reply confirming receipt (within 1 business day)
- A triage label system (see §4.2)
- A signature template (the team name, the response time SLA, the escalation path)
- A forwarding rule to the support team's shared inbox (so any team member can respond)

### 2.2 The In-App Help

The in-app help is a help center accessible from the user menu. It includes:

- **Getting started guides** (per persona)
- **FAQ** (the most common questions)
- **Troubleshooting guides** (per user journey)
- **Contact us** (links to the support email)
- **Status page** (forthcoming; links to the platform status)

The in-app help is the **self-service channel** — users can find answers without contacting support. The help center content is the responsibility of the Content Lead and the Operations Director.

### 2.3 The Advisory Board (for Sensitive Issues)

For sensitive issues (e.g., a user feels the platform is biased, a user wants to escalate a moderation decision beyond the appeal process), the Advisory Board can be engaged. The Project Lead coordinates the engagement.

### 2.4 The Grievance Committee (for Final Appeals)

For moderation decisions that have exhausted the appeal process, the Grievance Committee is the final review body. The Legal Director coordinates the engagement.

### 2.5 The Bar Association Liaison (for Lawyer-Related Issues)

For lawyer-related issues (e.g., a user has a complaint about a lawyer on the platform), the Bar Association liaison (the Legal Director) is the escalation path.

### 2.6 The NDPC (for Privacy Complaints)

For NDPR-related complaints (e.g., a user wants to escalate a privacy issue beyond our internal process), the NDPC is the regulatory escalation. The Legal Director coordinates the engagement.

---

## 3. The Support Tiers

The support is a tier-based system. Each tier has an owner, a response SLA, and an escalation path.

### 3.1 Tier 1: General Support

**Owner:** Operations Engineer
**Response SLA:** Within 1 business day
**Resolution SLA:** Within 5 business days

**Scope:**
- Account questions (how do I verify? how do I delete my account?)
- Feature questions (how do I vote? how do I upload evidence?)
- General troubleshooting (the page won't load, the button doesn't work)
- DSAR requests (data export, account deletion)
- General feedback and feature requests

**Escalation to Tier 2:** technical issues, suspected bugs, integration questions

### 3.2 Tier 2: Technical Support

**Owner:** Engineering Lead
**Response SLA:** Within 1 business day
**Resolution SLA:** Within 3 business days

**Scope:**
- Suspected bugs (after Tier 1 triage)
- Performance issues
- Integration questions (NIMC, Onfido, Paystack)
- Account issues that require backend investigation
- Moderation actions that require engineering review

**Escalation to Tier 3:** confirmed bugs that require code changes, security issues

### 3.3 Tier 3: Code Bugs

**Owner:** Engineering team
**Response SLA:** Within 1 business day
**Resolution SLA:** Per the bug's priority (P1: hours, P2: days, P3: weeks)

**Scope:**
- Confirmed bugs that require code changes
- Security issues
- Performance issues that require optimization

**Escalation:** to incident response (per [Operations.md §6](./Operations.md#6-incident-response)) if the issue is a P1 or P2 incident

### 3.4 The Escalation Path
Tier 1 (Operations Engineer)
│
├── Resolved → Close the ticket
│
└── Not resolved → Tier 2 (Engineering Lead)
│
├── Resolved → Close the ticket
│
└── Not resolved → Tier 3 (Engineering team)
│
├── Resolved → Close the ticket
│
└── Not resolved → Incident response

text


The escalation is documented in the support ticket. The user is informed at each step.

---

## 4. The Support Process

### 4.1 The Ticket Lifecycle

Every support request becomes a ticket. The ticket lifecycle:

1. **Received** — the user sends an email or submits a form
2. **Acknowledged** — the system sends an auto-reply (within 1 business day)
3. **Triaged** — the support team categorizes the ticket (see §4.2)
4. **Assigned** — the ticket is assigned to the appropriate tier
5. **Investigated** — the support team investigates
6. **Resolved** — the issue is resolved (either by fixing the problem or by providing an answer)
7. **Closed** — the ticket is closed; the user is notified

### 4.2 The Ticket Categories

| Category | Description | Tier |
|----------|-------------|------|
| **Account** | Account questions, verification, deletion | 1 |
| **Feature** | Feature questions, how-to | 1 |
| **Bug** | Suspected bugs | 1 → 2 → 3 |
| **Performance** | Slow or unresponsive behavior | 1 → 2 |
| **Integration** | NIMC, Onfido, Paystack issues | 1 → 2 |
| **Moderation** | Moderation actions, appeals | 1 → 2 |
| **DSAR** | Data export, account deletion | 1 |
| **Feedback** | Feature requests, general feedback | 1 |
| **Security** | Suspected security issues | 1 → 2 → Incident response |
| **Privacy** | NDPR-related issues | 1 → 2 → Legal |
| **Lawyer** | Lawyer-related issues | 1 → 2 → Bar Association liaison |
| **Press** | Press inquiries | 1 → Project Sponsor |

### 4.3 The Ticket Priority

| Priority | Definition | Response SLA | Resolution SLA |
|----------|------------|--------------|-----------------|
| **Urgent** | Service is unusable; data is at risk; security incident | Within 1 hour | Within 4 hours |
| **High** | A critical feature is broken; user is significantly impacted | Within 4 hours | Within 24 hours |
| **Medium** | A non-critical feature is broken or significantly degraded | Within 1 business day | Within 5 business days |
| **Low** | A minor issue or a question | Within 2 business days | Within 10 business days |

The priority is set during triage. The user is informed of the priority and the expected response time.

### 4.4 The Ticket SLA Tracking

Every ticket has an SLA timer. The timer starts when the ticket is acknowledged. If the timer expires without a response, the ticket is automatically escalated to the next tier.

The SLA tracking is implemented in the support tool (a shared inbox with labels, or a dedicated support tool like Zendesk, Intercom, or Help Scout — the tool is determined in Phase 5).

### 4.5 The Ticket Templates

The most common ticket types have response templates:

#### 4.5.1 Account Verification Issue
Hi [NAME],

Thanks for reaching out. I see you're having trouble with identity verification.

[SPECIFIC INSTRUCTIONS based on the issue — e.g., "Your NIN is not in the NIMC database. Please try the document verification option instead." or "Your Onfido selfie didn't match the document. Please try again with a clearer photo."]

If the issue persists, please reply with:

A screenshot of the error (if applicable)
The method you tried (NIMC or Onfido)
The timestamp of the attempt
We'll get back to you within [SLA TIME].

Thanks,
[Najia Support Team]

text


#### 4.5.2 Vote Not Recorded
Hi [NAME],

Thanks for reaching out. I see your vote wasn't recorded.

[SPECIFIC INSTRUCTIONS based on the issue — e.g., "The poll had already closed when you tried to vote. Results are now available." or "You may have already voted in this poll. You can only vote once per poll."]

If the issue persists, please reply with:

The poll you were trying to vote on
The timestamp of the attempt
Any error message you saw
We'll get back to you within [SLA TIME].

Thanks,
[Najia Support Team]

text


#### 4.5.3 Lawyer Match Issue
Hi [NAME],

Thanks for reaching out. I see you had trouble with the lawyer matching.

[SPECIFIC INSTRUCTIONS based on the issue — e.g., "We don't have lawyers matching your case type in your jurisdiction yet. We'll notify you when one joins." or "The lawyer you selected didn't respond within 24 hours. You can select another."]

If the issue persists, please reply with:

The case type and jurisdiction
The lawyers you were matched with
Any error message you saw
We'll get back to you within [SLA TIME].

Thanks,
[Najia Support Team]

text


### 4.6 The Ticket Closure

When a ticket is resolved, the support team:

- Sends a resolution message to the user
- Marks the ticket as resolved
- Closes the ticket after 7 days (if the user doesn't respond)
- Adds the resolution to the knowledge base (see §6)

---

## 5. Support as a Signal

A spike in support requests can be the first signal of an incident. The support process is integrated with incident response.

### 5.1 The Detection Mechanism

The Operations Engineer (Tier 1) monitors the support inbox for:

- **Volume spikes:** a sudden increase in requests (more than 3x the normal volume in a 1-hour window) may indicate an incident
- **Pattern detection:** multiple reports of the same issue may indicate a bug
- **Specific keywords:** reports of "data loss", "can't log in", "vote not counted", "lawyer no-show" trigger an immediate review
- **Time-of-day anomalies:** reports outside normal hours may indicate a user is stuck and frustrated

### 5.2 The Escalation to Incident Response

If a support signal suggests an incident:

- The Operations Engineer (Tier 1) escalates to the on-call engineer (per [Operations.md §3.1](./Operations.md#31-the-pilot-on-call-setup))
- The on-call engineer assesses the severity (P1/P2/P3)
- If it's an incident, the incident response workflow is followed (per [Operations.md §6](./Operations.md#6-incident-response))
- The support ticket is linked to the incident
- The user is informed of the status

### 5.3 The Feedback Loop

Every incident that is detected through support is documented in the support process:

- The support signal that triggered the detection is noted
- The time between the first support report and the incident detection is noted
- The improvement to the detection mechanism is identified (e.g., a new monitoring alert, a new keyword to watch for)
- The post-incident review includes the support signal

This feedback loop ensures that the support process gets better at detecting incidents over time.

---

## 6. The Help Center (Self-Service)

The first goal of the support process is to have the answer in the help center, not in the support inbox. Every support request should result in either a resolution or a help center article.

### 6.1 The Help Center Structure

The help center is organized by user persona and user journey:

**By persona:**
- For citizens (Amara): "How to participate in civic engagement"
- For citizens with disputes (Tunde): "How to use evidence and find a lawyer"
- For lawyers (Ngozi): "How to register and use the platform"
- For moderators (Kemi, internal): "How to moderate content"

**By user journey:**
- J1: "How to verify your identity"
- J2: "How to vote on a policy poll"
- J3: "How to vote on a confidence question"
- J4: "How to find a lawyer"
- J5: "How to register as a lawyer" (lawyer-facing)
- J6: "How to upload evidence"
- J7: "How to publish a poll" (moderator-facing)
- J8: "How to appeal a moderation decision"

**By topic:**
- Account: "How to verify", "How to delete my account", "How to update my profile"
- Privacy: "How we protect your data", "How to request your data", "How to report a privacy issue"
- Legal: "How to read a legal literacy module", "How to find a pro bono lawyer"
- Troubleshooting: "The page won't load", "I can't log in", "The button doesn't work"

### 6.2 The Help Center Content Lifecycle

1. **Identify the gap:** a support ticket reveals a missing or unclear article
2. **Create or update the article:** the Content Lead drafts the article
3. **Review:** the Operations Director and the Engineering Lead review for accuracy
4. **Publish:** the article is published in the help center
5. **Track:** the article is linked to the original support ticket for traceability

### 6.3 The Help Center Metrics

| Metric | Target |
|--------|--------|
| **Help center articles published (pilot)** | ≥ 30 (covering the most common user journeys and topics) |
| **Help center coverage** | ≥ 80% of support requests have a matching help center article |
| **Article helpfulness** | ≥ 70% of users who view an article find it helpful (measured by a "Was this helpful?" widget) |
| **Search success** | ≥ 60% of searches lead to a click on a result |

### 6.4 The Help Center Search

The help center has a search function. The search is powered by a simple full-text search (Postgres `tsvector` in the pilot; a dedicated search service is a Year 2 candidate).

The search results are ranked by relevance. The most popular articles are boosted. The search is monitored for failed searches (queries with no results), which are used to identify content gaps.

---

## 7. The Pilot Cohort Support

The pilot cohort of 500 users has specific support needs. The support is more proactive than the standard support.

### 7.1 The Pilot Onboarding Support

When a pilot user signs up, they receive:

- A welcome email with onboarding instructions (per the communications plan in [Release.md §7.2.3](./Release.md#722-the-t-0-user-facing-announcement))
- An in-app welcome message with links to the help center
- An invitation to a pilot-specific support channel (e.g., a Slack channel, a Telegram group, or an email distribution list) where they can ask questions and provide feedback

The pilot cohort is encouraged to provide feedback through the in-app feedback mechanism, the support email, and the pilot-specific channel.

### 7.2 The Pilot Feedback Mechanism

The pilot feedback is collected through:

- **In-app feedback widget:** a "Send feedback" button in the user menu
- **Pilot-specific email:** pilot@najiacommunitybridge.com (a separate inbox from support@)
- **Pilot-specific channel:** the Slack/Telegram group (or equivalent)
- **Weekly check-in email:** a short survey sent weekly to the pilot cohort

The feedback is reviewed weekly by the Product Lead and the Operations Director. The feedback informs the product roadmap and the support process.

### 7.3 The Pilot Metrics Review

The pilot metrics are reviewed weekly:

| Metric | Target | Source |
|--------|--------|--------|
| **Support tickets per user (per week)** | < 0.5 | Support tool |
| **Average response time** | < 1 business day | Support tool |
| **Average resolution time** | < 3 business days | Support tool |
| **Help center article helpfulness** | ≥ 70% | Help center |
| **Pilot satisfaction (weekly survey)** | ≥ 4.0 / 5 | Weekly survey |
| **Pilot retention (weekly active users)** | ≥ 80% | Analytics |

The metrics are reviewed at the weekly operations review. Any metric below the target triggers an investigation and a plan for improvement.

### 7.4 The Pilot Support Hours

The pilot support is available during business hours (9:00–17:00 Lagos time, Monday–Friday). After-hours support is best-effort (the on-call engineer responds to P1 issues, but general support is not staffed after hours).

The support hours are communicated in the welcome email and in the help center. The support hours may be expanded in Phase 2.

---

## 8. The Support Team

### 8.1 The Pilot Support Team

In the pilot, the support team is small:

| Role | Person | Responsibility |
|------|--------|----------------|
| **Tier 1** | Operations Engineer (part-time) | Initial response, triage, general troubleshooting |
| **Tier 2** | Engineering Lead | Technical issues, suspected bugs |
| **Tier 3** | Engineering team | Confirmed bugs, code changes |
| **Escalation** | Operations Director | Sensitive issues, moderation appeals, lawyer-related issues |
| **Legal** | Legal Director | NDPR issues, Bar Association issues, press inquiries |
| **Communications** | Project Sponsor | Press, donors, public statements |

### 8.2 The Support Team Growth

| Phase | Support team size | Notes |
|-------|-------------------|-------|
| Pilot | 1 part-time Operations Engineer + Engineering Lead | The team is small; everyone wears multiple hats |
| Phase 2 | 1 full-time Operations Engineer + Engineering Lead + 1 support contractor | The support contractor handles Tier 1; the Operations Engineer handles Tier 2 and operations |
| Year 2 | 2 support staff + 1 support lead + Engineering Lead | 24/7 support may be necessary |

### 8.3 The Support Training

Every team member who handles support is trained on:

- The user personas (per [../product/Personas.md](../product/Personas.md))
- The user journeys (per [../product/User Journeys.md](../product/User%20Journeys.md))
- The help center content
- The support process (this document)
- The escalation paths
- The tone and voice (per the support principles)

The training is refreshed annually. New team members are onboarded with the same training.

---

## 9. The Support Metrics and Reporting

### 9.1 The Metrics We Track

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) |
|--------|----------------|------------------|-----------------|
| **Support tickets per user per month** | < 2 | < 1.5 | < 1 |
| **Average first response time** | < 1 business day | < 4 hours | < 1 hour |
| **Average resolution time** | < 5 business days | < 3 business days | < 1 business day |
| **Ticket escalation rate (Tier 1 → Tier 2)** | < 20% | < 15% | < 10% |
| **Ticket escalation rate (Tier 2 → Tier 3)** | < 5% | < 5% | < 5% |
| **Help center article helpfulness** | ≥ 70% | ≥ 75% | ≥ 80% |
| **Help center self-service rate** | ≥ 50% | ≥ 60% | ≥ 70% |
| **User satisfaction (post-resolution survey)** | ≥ 4.0 / 5 | ≥ 4.2 / 5 | ≥ 4.5 / 5 |
| **Support signal to incident detection time** | < 1 hour | < 30 min | < 15 min |

### 9.2 The Reports We Generate

| Report | Frequency | Audience | Owner |
|--------|-----------|----------|-------|
| **Daily support summary** | Daily | Engineering team | Operations Engineer |
| **Weekly support metrics** | Weekly | Project Lead, Operations Director | Operations Engineer |
| **Monthly support review** | Monthly | Project Sponsor, Board | Operations Director |
| **Quarterly support analysis** | Quarterly | Public (in the transparency report) | Operations Director |
| **Annual support review** | Annually | Project Sponsor, Board | Operations Director |

### 9.3 The Quarterly Support Analysis

The quarterly support analysis is part of the quarterly transparency report. It includes:

- Ticket volume and trends
- Average response and resolution times
- Escalation rates
- User satisfaction
- Help center usage
- Support signals that led to incident detection
- Improvements made to the support process
- Improvements made to the help center

The analysis is reviewed by the Operations Director and the Project Sponsor before publication.

---

## 10. The Support Tooling

### 10.1 The Support Tool

The support tool is a shared inbox with labels and automation. In the pilot, the tool is:

- **Gmail with labels:** the support email is a Gmail account with labels for each category
- **Shared access:** the Operations Engineer, the Engineering Lead, and the Project Lead have access
- **Auto-reply:** the auto-reply is configured in Gmail
- **Labels:** each category has a label (Account, Feature, Bug, etc.)
- **SLA tracking:** the SLA is tracked manually (a Y2 improvement is a dedicated support tool)

**For Phase 2**, the support tool is upgraded to a dedicated support tool (Zendesk, Intercom, Help Scout, or similar). The tool is selected based on cost, features, and integration with the rest of the stack.

### 10.2 The Help Center Tool

The help center is a simple Markdown-based site in the pilot:

- **Hosted on the platform:** the help center is a route on the platform
- **Content in MDX:** the content is in MDX (the same format as the blog)
- **Search:** the search is a simple Postgres full-text search
- **Analytics:** the analytics are basic (page views, search queries)

**For Phase 2**, the help center is upgraded to a dedicated tool (Intercom, Help Scout, or similar). The tool is selected based on cost, features, and integration with the rest of the stack.

### 10.3 The Feedback Tool

The feedback is collected through:

- **In-app feedback widget:** a simple form in the user menu
- **Email:** pilot@najiacommunitybridge.com
- **Pilot-specific channel:** the Slack/Telegram group

The feedback is logged in a shared spreadsheet or a simple database. **For Phase 2**, the feedback is integrated with the product analytics tool (PostHog, Amplitude, or similar).

---

## 11. The Support Communication

### 11.1 The Tone and Voice

The support communication is:

- **Empathetic:** "I understand how frustrating this must be..."
- **Clear:** "Here's what's happening and what we're doing about it..."
- **Specific:** "Your NIN is not in the NIMC database. Please try the document verification option instead."
- **Action-oriented:** "Please reply with X, Y, Z so we can help you faster."
- **Honest:** "We don't know yet, but we're investigating. We'll get back to you within [SLA]."

The tone is warm but professional. The voice is consistent across all support channels.

### 11.2 The Response Time Communication

Every response includes the expected response time and the escalation path:
We'll get back to you within [SLA TIME].

If you need to escalate, reply to this email and we'll route your ticket to the appropriate team.

text


### 11.3 The User-Facing Status Page

A public status page is forthcoming. The status page shows:

- Current platform status (operational / degraded / down)
- Recent incidents (with status and resolution)
- Scheduled maintenance
- Subscribe to updates (email or webhook)

The status page is a transparency tool: users can see the platform status without contacting support.

### 11.4 The Press and Public Inquiries

Press and public inquiries are routed to the Project Sponsor. The support team does not respond to press inquiries directly. The Project Sponsor decides whether to respond and what to say.

The response to a press inquiry follows the communications policy:

- The Project Sponsor reviews the inquiry
- The Project Sponsor drafts the response (with input from the Legal Director if needed)
- The response is approved by the Project Sponsor
- The response is sent from the Project Sponsor's email (not the support email)
- The inquiry is documented in the communications log

---

## 12. The Support Documentation

### 12.1 The Support Runbook

The support runbook is a subset of [Runbooks.md](./Runbooks.md) — the operational runbooks. The support-specific runbooks are:

- How to handle a Tier 1 ticket
- How to escalate to Tier 2
- How to escalate to Tier 3
- How to handle a moderation appeal
- How to handle a DSAR request
- How to handle a security incident reported by a user
- How to handle a Bar Association complaint
- How to handle an NDPR complaint
- How to handle a press inquiry
- How to handle a user who is threatening legal action

### 12.2 The Help Center Content

The help center content is the responsibility of the Content Lead and the Operations Director. The content is reviewed quarterly for accuracy and freshness.

### 12.3 The Internal Documentation

The support process is documented in this document. The runbooks are in [Runbooks.md](./Runbooks.md). The help center content is in the help center. The training is in the onboarding materials.

---

## 13. The Support Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the right support tool for Phase 2? (Zendesk, Intercom, Help Scout, or self-hosted?) | Operations Director | Open — depends on cost and features |
| 2 | Should the support be 24/7 in Phase 2? | Operations Director | Open — depends on hiring |
| 3 | How do we handle support for users who don't speak English? (Year 2 with local language support) | Operations Director | Open — Year 2 |
| 4 | What is the right escalation path for lawyer-related complaints? | Legal Director | Open — pending Bar Association engagement |
| 5 | Should we have a public status page in the pilot? | Operations Director | Open — recommend yes in Phase 2 |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the support process require the Operations Director's sign-off.

---

## Appendix A: The Support Ticket Categories (Quick Reference)

| Category | Tier | Default Priority |
|----------|------|------------------|
| Account | 1 | Medium |
| Feature | 1 | Low |
| Bug | 1 → 2 → 3 | Per triage |
| Performance | 1 → 2 | Per triage |
| Integration | 1 → 2 | Per triage |
| Moderation | 1 → 2 | Per triage |
| DSAR | 1 | Medium (30-day SLA per NDPR) |
| Feedback | 1 | Low |
| Security | 1 → 2 → Incident | High (default) |
| Privacy | 1 → 2 → Legal | High (default) |
| Lawyer | 1 → 2 → Bar Association | Per triage |
| Press | 1 → Project Sponsor | Medium |

## Appendix B: The Support Response Templates (Quick Reference)

The full templates are in §4.5. The most common templates are:

- **Account verification issue:** clear next steps based on the specific issue
- **Vote not recorded:** explain why (poll closed, already voted, etc.) and what to do
- **Lawyer match issue:** explain the matching algorithm and the user's options
- **Evidence upload issue:** explain the file size and type limits
- **Moderation decision appeal:** explain the appeal process

## Appendix C: The Support Hours (Pilot)

| Day | Hours | Time zone |
|-----|-------|-----------|
| Monday–Friday | 09:00–17:00 | Africa/Lagos (UTC+1) |
| Saturday–Sunday | Closed (best-effort for P1 only) | — |

After-hours support is best-effort. The on-call engineer responds to P1 issues (per [Operations.md §3.1](./Operations.md#31-the-pilot-on-call-setup)), but general support is not staffed after hours.

## Appendix D: The Support Communication Channels

| Channel | Purpose | Audience |
|---------|---------|----------|
| **support@najiacommunitybridge.com** | Primary support email | All users |
| **pilot@najiacommunitybridge.com** | Pilot cohort feedback | Pilot users |
| **legal@najiacommunitybridge.com** | Legal and NDPR issues | Legal Director |
| **press@ (via Project Sponsor)** | Press inquiries | Project Sponsor |
| **In-app help** | Self-service | All users |
| **In-app feedback widget** | Feedback | All users |
| **Pilot-specific channel** | Pilot cohort communication | Pilot users |
| **Status page (forthcoming)** | Platform status | All users |

## Appendix E: Related Documents
- [Operations.md](./Operations.md) — the operational reference
- [Runbooks.md](./Runbooks.md) — the operational runbooks
- [Release.md](./Release.md) — the release process
- [../product/Personas.md](../product/Personas.md) — the user archetypes
- [../product/User Journeys.md](../product/User%20Journeys.md) — the user flows
- [../business/Market Research.md §4](../business/Market%20Research.md#4-user-research) — the user research
- [../modules/Admin & Operations.md](../modules/Admin%20&%20Operations.md) — the admin module (includes the DSAR process)
- [../business/Decision Log.md](../business/Decision%20Log.md) — business-level decisions

## Appendix F: Support Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Operations Director | Initial set. Establishes the customer support process for the pilot, including the support channels (email primary, in-app help, escalation paths for sensitive issues), the 3-tier system (general, technical, code bugs), the SLAs per tier and per priority, the ticket lifecycle and categories, the support-as-a-signal integration with incident response, the help center approach (self-service first, organized by persona and journey), the pilot cohort support (proactive, feedback mechanism, weekly metrics), the support team (small in the pilot, growing in Phase 2 and Year 2), the support metrics and reporting (including the quarterly support analysis in the transparency report), the support tooling (Gmail in the pilot, dedicated tools in Phase 2), the support communication (tone, response time, status page, press inquiries), and the support documentation. The most important additions are the tier system (§3) and the support-as-a-signal integration (§5). |