# Analytics and Experiments

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active (Pilot)*
*Owner: Operations Director + Product Lead*

> **About this document:** This is the official framework for analytics and experiments on the Najia Community Bridge. It defines the metrics we track, the experiments we run, the tools we use, and the ethical boundaries we observe. All analytics and experiment work should be consistent with this framework.

> **How to read this document:** Start with §1 (the philosophy) and §2 (the metrics). §3 (the experiment framework) is operational reference for anyone proposing or running experiments. §4 (the growth process) is strategic reference. §5 (the ethics and privacy) is the binding constraint.

> **Related documents:**
> - [../product/Roadmap.md §12](../product/Roadmap.md#12-success-metrics) — the pilot success metrics
> - [../business/Business.md](../business/Business.md) — the financial model (for cost-per-acquisition, lifetime value, etc.)
> - [../business/Market Research.md §4](../business/Market%20Research.md#4-user-research) — the user research that informs the metrics
> - [../operations/Operations.md §9](../operations/Operations.md#9-operational-metrics-and-reporting) — the operational metrics
> - [../customer/Marketing.md §9](../customer/Marketing.md#9-the-marketing-metrics) — the marketing metrics
> - [../technical/Security.md §9](../technical/Security.md#9-compliance) — the NDPR compliance posture

---

## 1. Philosophy

### 1.1 The Mission, Revisited

**"To empower Nigerian citizens with tools for informed civic participation, verified evidence management, and access to legal representation — while maintaining the highest standards of integrity, transparency, and legal compliance."**

Every metric, every experiment, and every growth initiative should support this mission. If a metric doesn't help us understand whether we're achieving the mission, we don't track it. If an experiment doesn't help us serve users better, we don't run it. If a growth initiative doesn't expand impact without compromising integrity, we don't pursue it.

### 1.2 The Principles

The analytics and experiments function is guided by these principles.

| Principle | Application |
|-----------|-------------|
| **Mission-aligned** | Every metric supports a mission pillar (Voice, Evidence, Access) or an operational principle (Independence, Transparency, Privacy) |
| **Privacy-respecting** | We never track behavior across other websites or apps; we never sell data; we never use data for advertising |
| **User-transparent** | Users can see what we track and why; users can opt out of non-essential tracking |
| **Ethically-bounded** | We never run experiments that could harm users, especially vulnerable users |
| **Honestly-measured** | We don't cherry-pick metrics, we don't hide negative results, we don't manipulate statistics |
| **Independently-audited** | Our analytics are auditable; our methodology is public; our results are reported in the quarterly transparency reports |

### 1.3 What We Don't Do

The analytics and experiments function has clear boundaries.

| Don't | Why |
|-------|-----|
| **Don't track users across other websites or apps** | Privacy; we don't use third-party advertising or analytics trackers |
| **Don't sell user data to third parties** | The platform is not a data business; we're funded by grants and subscriptions |
| **Don't use data for targeted advertising** | We're not an advertising platform; advertising is a prohibited revenue stream |
| **Don't run experiments without user consent** | Users must be informed of experiments; users can opt out of non-essential experiments |
| **Don't run experiments on vulnerable users** | No experiments on users in crisis (e.g., users in the middle of a legal dispute); no experiments that could disadvantage any group |
| **Don't hide negative results** | Every experiment is reported, including the null and negative results |
| **Don't use dark patterns** | No misleading UX; no hidden options; no deceptive consent flows |
| **Don't optimize for engagement at the expense of well-being** | We don't optimize for time-on-platform or click-through-rate if it conflicts with the user's interests |

### 1.4 The Ethical Review

Some experiments and analytics activities require ethical review before proceeding. The review is performed by:
- **The Product Lead** (for product experiments)
- **The Operations Director** (for operational changes)
- **The Legal Director** (for any experiment or analytics activity that involves PII, cross-user comparisons, or potential harm)
- **The Project Sponsor** (for any high-stakes decision)

The ethical review checklist is in §5.4.

---

## 2. Metrics

The metrics are organized by category. Each metric is tied to a mission pillar or operational principle.

### 2.1 The Three Layers of Metrics

The metrics are organized in three layers, following the standard analytics hierarchy:

1. **Platform health metrics** — are the platform and the features working?
2. **User behavior metrics** — are users using the platform as intended?
3. **Impact metrics** — is the platform achieving its mission?

This hierarchy matters because each layer answers a different question. If a layer-1 metric is bad (e.g., error rate is high), we fix the platform. If a layer-2 metric is bad, we improve the user experience. If a layer-3 metric is bad, we rethink the strategy.

### 2.2 Layer 1: Platform Health Metrics

These metrics answer the question: "Is the platform working?"

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Uptime** | ≥ 99.5% | ≥ 99.5% | ≥ 99.9% | Monitoring |
| **Error rate** | < 1% | < 1% | < 0.5% | Application logs |
| **P95 response time** | < 500ms | < 300ms | < 200ms | Application logs |
| **P99 response time** | < 1s | < 500ms | < 300ms | Application logs |
| **Active alerts (unacknowledged)** | 0 | 0 | 0 | Monitoring |
| **Backup success rate** | 100% | 100% | 100% | Operations |
| **NDPR compliance status** | Compliant | Compliant | Compliant | Legal |

These metrics are operational and are tracked in [../operations/Operations.md §9](../operations/Operations.md#9-operational-metrics-and-reporting). They are included here for completeness.

### 2.3 Layer 2: User Behavior Metrics

These metrics answer the question: "Are users using the platform as intended?"

#### 2.3.1 Acquisition Metrics

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Website unique visitors** | 5,000/month | 20,000/month | 100,000/month | Analytics |
| **Registration → account creation** | 500 (target cohort size) | 5,000 | 50,000 | Application DB |
| **Account creation → verification start** | ≥ 80% | ≥ 80% | ≥ 80% | Application DB |
| **Verification start → verification complete** | ≥ 70% | ≥ 75% | ≥ 80% | Application DB |
| **Cost per verified user** | < ₦2,000 | < ₦1,500 | < ₦1,000 | Marketing + Application DB |

#### 2.3.2 Activation Metrics

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Verified users who vote in their first poll within 30 days** | ≥ 60% | ≥ 65% | ≥ 70% | Application DB |
| **Verified users who complete a legal literacy module within 30 days** | ≥ 30% | ≥ 35% | ≥ 40% | Application DB |
| **Verified users who upload their first evidence within 90 days** | ≥ 20% | ≥ 25% | ≥ 30% | Application DB |
| **Verified users who view a lawyer profile within 90 days** | ≥ 15% | ≥ 20% | ≥ 25% | Application DB |
| **Verified users who schedule a free consultation within 90 days** | ≥ 5% | ≥ 8% | ≥ 10% | Application DB |

#### 2.3.3 Engagement Metrics

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **DAU / MAU ratio** (stickiness) | ≥ 20% | ≥ 25% | ≥ 30% | Application DB |
| **Average polls voted per active user per month** | ≥ 0.5 | ≥ 0.7 | ≥ 1.0 | Application DB |
| **Average evidence uploads per active user per month** | ≥ 0.2 | ≥ 0.3 | ≥ 0.4 | Application DB |
| **Average legal literacy module completions per active user per quarter** | ≥ 0.3 | ≥ 0.4 | ≥ 0.5 | Application DB |
| **Blog post read-through rate** (read > 50%) | ≥ 30% | ≥ 35% | ≥ 40% | Analytics |
| **Newsletter open rate** | ≥ 30% | ≥ 30% | ≥ 30% | Email service |
| **Newsletter click-through rate** | ≥ 5% | ≥ 5% | ≥ 5% | Email service |

#### 2.3.4 Retention Metrics

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **D7 retention** (active 7 days after registration) | ≥ 40% | ≥ 45% | ≥ 50% | Application DB |
| **D30 retention** | ≥ 25% | ≥ 30% | ≥ 35% | Application DB |
| **D90 retention** | ≥ 15% | ≥ 20% | ≥ 25% | Application DB |
| **Pilot cohort retention at end of pilot** | ≥ 70% | N/A | N/A | Application DB |

#### 2.3.5 Lawyer Marketplace Metrics

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Active lawyers (active subscription)** | 5–10 | 50+ | 100+ | Application DB |
| **Match → consultation conversion** | ≥ 60% | ≥ 65% | ≥ 70% | Application DB |
| **Consultation → engagement conversion** | ≥ 40% | ≥ 45% | ≥ 50% | Application DB |
| **Lawyer rating (average)** | ≥ 4.0 | ≥ 4.2 | ≥ 4.5 | Application DB |
| **Lawyer no-show rate** | < 10% | < 8% | < 5% | Application DB |
| **Subscription renewal rate** | ≥ 80% (after first month) | ≥ 85% | ≥ 90% | Paystack |

### 2.4 Layer 3: Impact Metrics

These metrics answer the question: "Is the platform achieving its mission?"

#### 2.4.1 Voice Pillar (Civic Engagement)

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Total votes cast** | 1,000 | 50,000 | 500,000 | Application DB |
| **Total polls conducted** | 12 | 50 | 200+ | Application DB |
| **Total confidence votes** | 4 | 12+ | 50+ | Application DB |
| **Pilot cohort trust baseline** ("polls are non-binding" correct) | ≥ 80% | ≥ 85% | ≥ 90% | Survey |
| **Survey: "Do you feel your voice matters on the platform?"** | ≥ 60% agree | ≥ 65% | ≥ 70% | Survey |

#### 2.4.2 Evidence Pillar

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Total evidence uploads** | 500 | 5,000 | 50,000 | Application DB |
| **Evidence integrity verification rate** | ≥ 90% (file matches original) | ≥ 95% | ≥ 98% | Application DB |
| **Cases created** | 20 | 500+ | 5,000+ | Application DB |
| **Survey: "Do you feel your evidence is protected on the platform?"** | ≥ 70% agree | ≥ 75% | ≥ 80% | Survey |

#### 2.4.3 Access Pillar (Lawyer Marketplace)

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Free consultations completed** | 50 | 1,000+ | 10,000+ | Application DB |
| **Engagements resulting from consultations** | ≥ 40% of consultations | ≥ 45% | ≥ 50% | Survey + Application DB |
| **Survey: "Did the free consultation help you?"** | ≥ 80% agree | ≥ 85% | ≥ 90% | Survey |
| **Survey: "Did you engage the lawyer after the consultation?"** | (tracked) | (tracked) | (tracked) | Survey |
| **Survey: "Was the legal help accessible?"** | ≥ 75% agree | ≥ 80% | ≥ 85% | Survey |

#### 2.4.4 Educational Pillar (Legal Literacy)

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Modules published** | 8 (all planned) | 16+ | 30+ | Content DB |
| **Module enrollments** | 500 | 10,000+ | 100,000+ | Application DB |
| **Module completions** | ≥ 40% of enrollments | ≥ 45% | ≥ 50% | Application DB |
| **Average quiz score** | ≥ 70% | ≥ 75% | ≥ 80% | Application DB |
| **Survey: "Did the module help you understand your rights?"** | ≥ 75% agree | ≥ 80% | ≥ 85% | Survey |

#### 2.4.5 Independence and Trust Pillar

| Metric | Target (Pilot) | Target (Phase 2) | Target (Year 2) | Source |
|--------|----------------|------------------|-----------------|--------|
| **Pilot cohort trust** (annual survey) | ≥ 4.0 / 5 | ≥ 4.2 | ≥ 4.5 | Survey |
| **Press sentiment** (positive vs. negative) | ≥ 80% positive | ≥ 85% | ≥ 90% | Media monitoring |
| **Transparency report download/read rate** | (tracked) | (tracked) | (tracked) | Analytics |
| **No government or political party funding** | 100% | 100% | 100% | Financial records |

### 2.5 The Metric Review Process

The metrics are reviewed:

- **Weekly** — the operational metrics (Layer 1) and key user behavior metrics (Layer 2)
- **Monthly** — the full set of user behavior metrics (Layer 2)
- **Quarterly** — the full set of impact metrics (Layer 3), reported in the transparency report
- **Annually** — a comprehensive review; the metrics may be revised based on what we've learned

The review is led by the Product Lead (for user behavior and impact) and the Operations Director (for platform health).

### 2.6 The Metric Anti-Patterns

These are the ways the metrics can mislead. We avoid them.

| Anti-pattern | Why it's misleading | What we do instead |
|--------------|---------------------|---------------------|
| **Vanity metrics** (e.g., total registered users) | They don't measure impact; they just measure growth | We focus on verified users and engagement metrics |
| **Survivorship bias** (e.g., only counting active users) | It ignores the users who left | We track retention and churn, not just active users |
| **Selection bias** (e.g., only surveying happy users) | It overstates satisfaction | We survey a representative sample, including users who left |
| **Correlation as causation** (e.g., polls cause trust) | It conflates association with mechanism | We run experiments to test causation; we don't claim causation from correlation |
| **Survivor metrics** (e.g., "100% of surveyed users are satisfied") | It ignores the people who didn't respond | We track survey response rates and adjust for non-response |
| **Manipulated statistics** (e.g., choosing the metric that makes us look good) | It's dishonest | We report the full set of metrics, not just the favorable ones |

---

## 3. The Experiment Framework

The experiment framework is for changes where we need to learn something. Not every change is an experiment; bug fixes, operational improvements, and routine updates are not experiments. The experiment framework is for changes where the outcome is uncertain and we need data to decide.

### 3.1 What Is an Experiment?

An experiment is a deliberate change to the platform, made with a hypothesis, measured against a control, and analyzed for statistical significance.

**Experiments are not:**
- A/B tests run without a hypothesis
- Changes that are deployed without measurement
- Changes that affect user privacy or security (these require separate review)
- Changes that are mandated by law or regulation (these are compliance, not experiments)

### 3.2 The Experiment Lifecycle

The experiment lifecycle has six phases.

#### 3.2.1 Phase 1: Proposal

The experiment is documented in a proposal. The proposal includes:

- **Hypothesis:** what we expect to happen (e.g., "Changing the CTA from 'Sign Up' to 'Get Started' will increase registration by 10%")
- **Rationale:** why we expect this (user research, best practices, etc.)
- **Metric:** the primary metric (e.g., registration conversion rate)
- **Secondary metrics:** the metrics we want to monitor for unintended consequences (e.g., support tickets, bounce rate)
- **Population:** who is in the experiment (all users, new users, Lagos users, etc.)
- **Duration:** how long the experiment will run (minimum 1 week, maximum 4 weeks for most experiments)
- **Sample size:** the minimum sample size needed for statistical significance
- **Ethical review:** whether the experiment requires ethical review (per §5.4)

The proposal is reviewed by the Product Lead (for product experiments) or the Operations Director (for operational changes).

#### 3.2.2 Phase 2: Design

The experiment is designed in detail:

- **Variant:** the change being tested (e.g., new CTA text)
- **Control:** the existing behavior (e.g., current CTA text)
- **Randomization:** how users are assigned to variant or control (typically 50/50 for two-variant experiments)
- **Exclusion criteria:** users who are excluded (e.g., admins, test accounts)
- **Success criteria:** what result would lead us to adopt the variant (e.g., ≥ 10% improvement with p < 0.05)
- **Failure criteria:** what result would lead us to reject the variant
- **Inconclusive criteria:** what result would lead us to extend the experiment or re-run it

#### 3.2.3 Phase 3: Implementation

The experiment is implemented:

- The variant is deployed behind a feature flag (default: off)
- The feature flag is configured to split traffic between control and variant
- The metrics are verified to be tracking correctly
- The experiment is monitored for any immediate issues

#### 3.2.4 Phase 4: Execution

The experiment runs:

- The feature flag is enabled for the experiment population
- The metrics are collected
- The experiment is monitored for anomalies
- If a critical issue is detected, the experiment is stopped immediately (the feature flag is turned off for everyone)

#### 3.2.5 Phase 5: Analysis

The experiment results are analyzed:

- The primary metric is compared between control and variant
- The secondary metrics are checked for unintended consequences
- The statistical significance is calculated
- The results are documented in an experiment report
- The report includes both positive and negative findings

The analysis is performed by the Product Lead (or a designated analyst) and reviewed by the Operations Director.

#### 3.2.6 Phase 6: Decision

The decision is made and documented:

- **Adopt:** the variant is deployed to all users (the feature flag is removed or set to 100%)
- **Reject:** the variant is rolled back (the feature flag is removed)
- **Extend:** the experiment runs longer (only with new hypothesis or new data)
- **Re-run:** the experiment is redesigned and re-run (with a new hypothesis or new variant)

The decision is documented in the experiment report and shared with the team.

### 3.3 The Experiment Examples

These are the kinds of experiments we expect to run.

#### 3.3.1 Onboarding Experiments

- **Hypothesis:** Simplifying the registration form (fewer fields) will increase registration completion by 15%
- **Hypothesis:** Adding a "Why we ask for this" tooltip on the NIN field will increase verification completion by 10%
- **Hypothesis:** Showing a welcome video after registration will increase D7 retention by 5%

#### 3.3.2 Civic Engagement Experiments

- **Hypothesis:** Showing a "Your voice matters" message before the poll disclaimer will increase poll completion by 5%
- **Hypothesis:** Adding a "Share your view" button to poll results will increase newsletter signups by 10%
- **Hypothesis:** Showing quarter-over-quarter trend in confidence vote results will increase confidence vote participation by 8%

#### 3.3.3 Lawyer Marketplace Experiments

- **Hypothesis:** Adding a "Why this lawyer was matched" link in the match results will increase consultation scheduling by 10%
- **Hypothesis:** Sending a reminder 1 hour before a consultation will reduce lawyer no-show rate by 50%
- **Hypothesis:** Offering a "Schedule a follow-up" option after a consultation will increase engagement rate by 15%

### 3.4 The Experiment Anti-Patterns

These are the ways experiments can go wrong. We avoid them.

| Anti-pattern | Why it's wrong | What we do instead |
|--------------|----------------|---------------------|
| **Peeking** (checking results before the experiment is complete) | It inflates the false positive rate | We commit to the duration before the experiment starts |
| **P-hacking** (running multiple analyses until p < 0.05) | It inflates the false positive rate | We pre-register the analysis plan |
| **Stopping early** (stopping when the result is significant) | It inflates the false positive rate | We run the experiment for the full duration, except for critical issues |
| **Cherry-picking** (reporting only the favorable results) | It's dishonest | We report all results, including null and negative |
| **HARKing** (presenting post-hoc hypotheses as a priori) | It's intellectually dishonest | We document the hypothesis before the experiment starts |
| **Small samples** (running experiments with too few users) | The results are unreliable | We calculate the minimum sample size before starting |
| **Multiple comparisons** (testing many metrics without correction) | It inflates the false positive rate | We use Bonferroni or similar correction, or limit the number of metrics |
| **Conflict of interest** (running experiments to support a pre-determined conclusion) | It's dishonest | We have independent review of experiment design and analysis |

### 3.5 The Experiment Log

Every experiment is logged in the experiment log:

| Experiment | Status | Date | Result | Decision |
|------------|--------|------|--------|----------|
| [Name] | Proposed / Running / Complete / Stopped | [Date] | [Result] | Adopt / Reject / Extend / Re-run |

The log is public (in the transparency report) so users and stakeholders can see what experiments we're running and what we've learned.

---

## 4. The Growth Process

Growth is a means to impact, not an end in itself. We grow the platform to expand our impact on civic engagement, evidence integrity, and access to justice.

### 4.1 The Growth Philosophy

| Principle | Application |
|-----------|-------------|
| **Impact over growth** | We grow to expand impact, not for its own sake |
| **Quality over speed** | We grow sustainably, not at the expense of user experience |
| **Trust over reach** | We grow in ways that maintain user trust, not at the expense of it |
| **Independence over scale** | We grow in ways that maintain our independence, not at the expense of it |

### 4.2 The Growth Funnel

The growth funnel tracks users from awareness to active engagement.
Awareness (know the platform exists)
↓
Interest (visit the website, read about the platform)
↓
Registration (create an account)
↓
Verification (complete identity verification)
↓
Activation (vote, upload evidence, or find a lawyer in first 30 days)
↓
Engagement (regular use over time)
↓
Advocacy (refer others, share on social media)

text


Each stage has metrics (per §2.3) and initiatives to improve conversion.

### 4.3 The Growth Initiatives

The growth initiatives are organized by funnel stage.

#### 4.3.1 Awareness Initiatives

- **Content marketing:** blog posts, social media, newsletters
- **Public relations:** press releases, media outreach, press kit
- **Partnerships:** with civil society organizations, NGOs, community groups
- **Word of mouth:** referral incentives (non-monetary), user stories
- **SEO:** search-optimized content, backlinks
- **Events:** civic technology conferences, legal aid events, community gatherings

#### 4.3.2 Interest Initiatives

- **Landing page optimization:** clear value proposition, social proof, easy registration
- **Testimonials:** user stories (with consent), pilot cohort testimonials
- **Transparency:** the quarterly transparency reports are public and discoverable
- **FAQ:** the FAQ is searchable and discoverable

#### 4.3.3 Registration Initiatives

- **Simplified registration:** minimal fields, clear value proposition
- **Social proof:** "Join 500 citizens in Lagos" or similar (when available)
- **Clear next steps:** after registration, the next step (verification) is clear
- **Reduce friction:** password requirements that are secure but not onerous

#### 4.3.4 Verification Initiatives

- **Multiple paths:** NIN and document verification
- **Clear instructions:** the verification process is well-documented and well-supported
- **Quick resolution:** failed verifications are quickly resolved through the appeal process
- **Helpful errors:** error messages are specific and actionable (per [Troubleshooting.md](../customer/Troubleshooting.md))

#### 4.3.5 Activation Initiatives

- **Welcome experience:** the first session after verification is curated to drive engagement
- **Suggested actions:** the platform suggests the most relevant first action (vote, upload evidence, find a lawyer, or take a module)
- **In-app guidance:** tooltips, walkthroughs, and help center links
- **Email follow-up:** a series of emails in the first 30 days that introduce features and encourage engagement

#### 4.3.6 Engagement Initiatives

- **New polls:** regular polls on timely topics
- **New content:** new blog posts, new legal literacy modules
- **Personalized recommendations:** suggestions based on the user's activity (e.g., "You might also want to vote on this related poll")
- **Community features:** comments on blog posts, community stories (with consent)

#### 4.3.7 Advocacy Initiatives

- **Referral program:** users can refer friends and family; the referrer is recognized (non-monetary)
- **Social sharing:** easy sharing of polls, results, and content
- **Community stories:** user stories (with consent) are featured in the newsletter and blog
- **Testimonials:** user testimonials are featured on the website and in press materials

### 4.4 The Growth Anti-Patterns

These are the ways growth can go wrong. We avoid them.

| Anti-pattern | Why it's wrong | What we do instead |
|--------------|----------------|---------------------|
| **Growth at all costs** | It compromises quality, trust, and sustainability | We prioritize impact over growth |
| **Dark patterns** (e.g., hidden opt-outs, misleading consent) | It's unethical and erodes trust | We use clear, honest consent flows |
| **Spam** (e.g., unsolicited emails, push notifications) | It's annoying and erodes trust | We respect user preferences |
| **Engagement bait** (e.g., "You'll never believe what happened next") | It's misleading and erodes trust | We use honest, informative headlines |
| **Referral abuse** (e.g., fake referrals, incentive manipulation) | It compromises the integrity of the platform | We use non-monetary referrals with verification |
| **Paid growth that compromises independence** (e.g., political advertising) | It compromises the platform's independence | We accept only grants and donations |
| **Growth into markets where we can't maintain quality** (e.g., expansion without local language support) | It degrades the user experience | We expand when we're ready, not when we can |

### 4.5 The Growth Reviews

The growth initiatives are reviewed:

- **Monthly** — the funnel metrics (§4.2) and the initiative effectiveness
- **Quarterly** — the growth strategy and the priority of initiatives
- **Annually** — a comprehensive review; the growth strategy may be revised

The review is led by the Product Lead (for the funnel and initiatives) and the Project Sponsor (for the growth strategy).

---

## 5. Ethics and Privacy

The analytics and experiments function is bound by ethical and privacy constraints. These are not aspirational; they are enforced by the architecture, the policy, and the review process.

### 5.1 The Privacy Constraints

The platform is NDPR-compliant. The analytics and experiments function operates within the following constraints:

- **No tracking across other websites or apps:** we do not use third-party advertising or analytics trackers (no Facebook Pixel, no Google Analytics cross-site tracking, etc.)
- **No data sales:** we never sell user data to third parties
- **No advertising:** we never use data for targeted advertising
- **Minimal data collection:** we collect only the data we need for the specific purpose; we don't collect "just in case"
- **Data minimization:** we delete data when it's no longer needed (per the retention policy in [../technical/Security.md §8.3](../technical/Security.md#83-retention))
- **User access:** users can access their data via DSAR; users can correct and delete their data
- **User transparency:** users can see what we track and why (in the Privacy Policy)

### 5.2 The Ethical Constraints

The experiments function operates within the following ethical constraints:

- **No experiments on vulnerable users:** no experiments on users in crisis (e.g., users in the middle of a legal dispute); no experiments that could disadvantage any group (by age, gender, income, disability, etc.)
- **No experiments without user consent:** users must be informed of experiments; users can opt out of non-essential experiments
- **No experiments that could harm:** no experiments that could cause physical, emotional, or financial harm
- **No experiments that compromise privacy:** no experiments that involve PII without explicit consent
- **No experiments that compromise trust:** no experiments that could damage user trust in the platform

### 5.3 The Analytics Tooling

The analytics tooling is selected based on these criteria:

- **Privacy:** the tool must not compromise user privacy
- **Self-hosting:** the tool must be self-hostable (or be a privacy-respecting SaaS)
- **Transparency:** the tool's data collection and processing must be transparent
- **Cost:** the tool must be affordable within the operating cost budget
- **Open source:** preference for open-source tools

**Recommended tools (subject to Phase 5 evaluation):**
- **Analytics:** PostHog (self-hosted) or Plausible (privacy-respecting SaaS)
- **A/B testing:** PostHog (built-in) or GrowthBook (open-source)
- **Session recording:** only if privacy-respecting; preference for not using session recording at all
- **Heatmaps:** only if privacy-respecting; preference for not using heatmaps at all
- **Email:** Resend, Postmark, or similar (privacy-respecting)
- **Surveys:** PostHog surveys, Tally, or similar (privacy-respecting)
- **Error tracking:** Sentry (self-hosted) or similar
- **Uptime monitoring:** Better Uptime, UptimeRobot, or similar (self-hosted option)

The specific tools are determined in Phase 5 (Build) and documented in the deployment configuration.

### 5.4 The Ethical Review Checklist

Some analytics and experiment activities require ethical review before proceeding. The review is performed by the Product Lead (for product experiments), the Operations Director (for operational changes), and the Legal Director (for any activity involving PII, cross-user comparisons, or potential harm). The checklist:

- [ ] **Purpose:** is the activity aligned with the mission? Is it necessary to achieve the mission?
- [ ] **Privacy:** does the activity respect user privacy? Does it require user consent?
- [ ] **Harm:** could the activity cause harm to users? Could it disadvantage any group?
- [ ] **Transparency:** can users understand what we're doing? Can they opt out?
- [ ] **Data:** what data is collected? How is it stored? How is it deleted?
- [ ] **Compliance:** is the activity compliant with NDPR? With other applicable laws?
- [ ] **Alternatives:** are there less invasive alternatives? Why are they insufficient?
- [ ] **Reversibility:** if the activity has unintended consequences, can it be reversed?
- [ ] **Documentation:** is the activity documented in the experiment log or analytics documentation?
- [ ] **Reviewer:** has the appropriate reviewer (Product Lead, Operations Director, Legal Director, Project Sponsor) signed off?

If any answer is "no" or uncertain, the activity does not proceed without further review.

### 5.5 The Incident Response for Analytics and Experiments

If an analytics or experiment activity has unintended consequences:

1. **Stop the activity immediately:** the feature flag is turned off, the experiment is halted, the data collection is stopped
2. **Assess the impact:** what was affected? Who was affected? How were they affected?
3. **Notify stakeholders:** the team, the Legal Director (if privacy is affected), the Project Sponsor (if the impact is significant)
4. **Notify users:** if users were affected (e.g., their data was collected inappropriately), they are notified
5. **Remediate:** the issue is fixed; the data is deleted if necessary; the users are given recourse
6. **Post-mortem:** a blameless post-mortem is written; the framework is updated if needed
7. **NDPC notification:** if NDPR data was affected, the NDPC is notified within 72 hours (per [../technical/Security.md §10.3](../technical/Security.md#103-security-incident-specifics))

---

## 6. The Reporting

The analytics and experiments function is reported in the quarterly transparency report. The report includes:

- **The metrics** (per §2): the full set, with trends over time
- **The experiments** (per §3): the experiment log, the results, the decisions
- **The growth initiatives** (per §4): the funnel, the initiatives, the outcomes
- **The ethics and privacy** (per §5): any review decisions, any incidents, any changes to the framework

The report is reviewed by the Project Sponsor and the Legal Director before publication. The report is public.

---

## 7. The Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the right analytics tool for the pilot? (PostHog, Plausible, or self-hosted) | Engineering Lead | Open — Phase 5 decision |
| 2 | What is the right A/B testing tool? (PostHog, GrowthBook, or built-in feature flags) | Engineering Lead | Open — Phase 5 decision |
| 3 | Should we use session recording? (Probably no, for privacy) | Product Lead + Legal Director | Open — Phase 5 decision |
| 4 | How do we measure the impact of civic engagement on actual policy? | Project Lead | Open — challenging to measure |
| 5 | What is the right survey frequency for the user satisfaction surveys? | Product Lead | Open — recommend quarterly in the pilot, semi-annually in Phase 2 |
| 6 | How do we handle experiments that require access to anonymized vote data? (The data is anonymized, but experiments may need to correlate across features) | Product Lead + Legal Director | Open — ethical review needed |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the analytics and experiments framework require the Project Sponsor's sign-off.

---

## Appendix A: The Metrics Quick Reference

### A.1 Layer 1: Platform Health (5 metrics)

Uptime, error rate, P95/P99 response time, active alerts, backup success rate.

### A.2 Layer 2: User Behavior (15 metrics)

Acquisition (5): visitors, registrations, verification start, verification complete, cost per verified user.

Activation (5): first poll vote, first module completion, first evidence upload, first lawyer view, first consultation.

Engagement (7): DAU/MAU, polls per user, evidence per user, modules per user, blog read-through, newsletter open, newsletter CTR.

Retention (4): D7, D30, D90, pilot cohort.

Lawyer Marketplace (6): active lawyers, match-to-consultation, consultation-to-engagement, lawyer rating, no-show rate, renewal rate.

### A.3 Layer 3: Impact (5 pillars × 3–5 metrics each)

Voice (5): total votes, polls conducted, confidence votes, trust baseline, "voice matters" survey.

Evidence (4): total uploads, integrity rate, cases created, "evidence protected" survey.

Access (5): consultations completed, engagement rate, "consultation helped" survey, engagement survey, "accessible" survey.

Educational (5): modules published, enrollments, completions, quiz score, "module helped" survey.

Independence and Trust (4): pilot trust, press sentiment, transparency report engagement, no political funding.

**Total: ~45 metrics** across the three layers.

### A.4 The Core 10

If we had to pick the 10 most important metrics, they would be:

1. **Uptime** (Layer 1)
2. **Verified users** (Layer 2, acquisition)
3. **D30 retention** (Layer 2, retention)
4. **Total votes cast** (Layer 3, Voice)
5. **Evidence integrity verification rate** (Layer 3, Evidence)
6. **Free consultations completed** (Layer 3, Access)
7. **Module completion rate** (Layer 3, Educational)
8. **Pilot cohort trust** (Layer 3, Independence)
9. **Match-to-consultation conversion** (Layer 2, Lawyer)
10. **Cost per verified user** (Layer 2, acquisition)

## Appendix B: The Experiment Anti-Patterns (Quick Reference)

| Anti-pattern | Avoid by |
|--------------|----------|
| Peeking | Commit to the duration before starting |
| P-hacking | Pre-register the analysis plan |
| Stopping early | Run for the full duration, except for critical issues |
| Cherry-picking | Report all results, including null and negative |
| HARKing | Document the hypothesis before starting |
| Small samples | Calculate the minimum sample size before starting |
| Multiple comparisons | Use Bonferroni correction or limit metrics |
| Conflict of interest | Independent review of design and analysis |

## Appendix C: The Growth Anti-Patterns (Quick Reference)

| Anti-pattern | Avoid by |
|--------------|----------|
| Growth at all costs | Prioritize impact over growth |
| Dark patterns | Use clear, honest consent flows |
| Spam | Respect user preferences |
| Engagement bait | Use honest, informative headlines |
| Referral abuse | Use non-monetary referrals with verification |
| Paid growth that compromises independence | Accept only grants and donations |
| Growth into markets without quality | Expand when ready, not when we can |

## Appendix D: The Ethical Review Checklist (Quick Reference)

- [ ] Purpose: aligned with mission? necessary?
- [ ] Privacy: respects user privacy? requires consent?
- [ ] Harm: could cause harm? disadvantage any group?
- [ ] Transparency: users understand? can opt out?
- [ ] Data: what is collected? how stored? how deleted?
- [ ] Compliance: NDPR? other laws?
- [ ] Alternatives: less invasive alternatives? why insufficient?
- [ ] Reversibility: can it be reversed if needed?
- [ ] Documentation: in the experiment log?
- [ ] Reviewer: appropriate reviewer signed off?

## Appendix E: Related Documents
- [../product/Roadmap.md §12](../product/Roadmap.md#12-success-metrics) — the pilot success metrics
- [../business/Business.md](../business/Business.md) — the financial model
- [../business/Market Research.md §4](../business/Market%20Research.md#4-user-research) — the user research
- [../operations/Operations.md §9](../operations/Operations.md#9-operational-metrics-and-reporting) — the operational metrics
- [../customer/Marketing.md §9](../customer/Marketing.md#9-the-marketing-metrics) — the marketing metrics
- [../technical/Security.md §9](../technical/Security.md#9-compliance) — the NDPR compliance posture
- [../customer/User Guide.md](../customer/User%20Guide.md) — the user-facing documentation
- [Decision Log](../business/Decision%20Log.md) — business-level decisions

## Appendix F: Analytics and Experiments Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Operations Director + Product Lead | Initial framework for analytics and experiments on the Najia Community Bridge. Establishes the philosophy (mission-aligned, privacy-respecting, user-transparent, ethically-bounded, honestly-measured, independently-audited), the three layers of metrics (platform health, user behavior, impact), the experiment framework (6-phase lifecycle, anti-patterns, examples), the growth process (7-stage funnel, initiatives per stage, anti-patterns), the ethics and privacy constraints (NDPR-compliant, no tracking across other sites, no data sales, no advertising, no experiments on vulnerable users), the analytics tooling recommendations, the ethical review checklist, the incident response procedure, and the quarterly reporting. The most important contributions are the anti-patterns (§2.6, §3.4, §4.4) — the ways the metrics, experiments, and growth can go wrong, and how to avoid them. |