# Market Research — Najia Community Bridge

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Project Lead*
*Reviewers: Project Sponsor, Operations Director, Legal Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Sources cited inline with date of figure. All market figures should be re-verified annually and a v1.1.0 published with refreshed data.

> **Note on scope:** This document is the market research (market sizing, competitive landscape, user research, market trends). The strategic rationale for entering this market is in the [Project Charter](./Project%20Charter.md). The business model and revenue projections are in the [Business Case](./Business.md). Product positioning and user personas are in [Personas.md](../product/Personas.md) and [PRD.md](../product/PRD.md) (forthcoming in Phase 2).

> **Data freshness rule:** Market figures in this document have a **12-month shelf life**. Any figure older than 12 months at the time of a major decision (e.g., pricing change, expansion into a new state) must be re-verified before that decision is taken.

---

## 1. Executive Summary

Nigeria is the largest civic-tech market in Africa by population, smartphone penetration, and civic need. The market for a platform that combines citizen engagement, evidence integrity, and lawyer access is real but largely unaddressed by any single competitor. The most direct competitors are point solutions in one of the three pillars; none of them integrate all three with the explicit non-binding framing that is Najia's core differentiator.

| Finding | Implication |
|---------|-------------|
| ~220M population, ~100M internet users, ~50M smartphone users (2026 est.) | Large addressable market at the citizen level |
| ~250,000 active lawyers, concentrated in Lagos, Abuja, Port Harcourt | Real but uneven supply; marketplace is feasible but geographic distribution is a constraint |
| Trust in government is structurally low | High demand for non-binding engagement; high reputational risk if mishandled |
| Existing civic-tech ecosystem is fragmented across election monitoring, legal aid, and document templates | Opportunity for integration; risk of being seen as "yet another platform" |
| NIN coverage has reached meaningful scale | Identity verification via NIMC is feasible |

---

## 2. Market Sizing

### 2.1 Population and Connectivity

| Metric | Value | Year | Source |
|--------|-------|------|--------|
| Nigeria population | ~223M | 2026 est. | UN World Population Prospects |
| Internet users | ~103M | 2025 | NCC / StatCounter (Nigeria) |
| Internet penetration (% of population) | ~46% | 2025 | NCC / StatCounter (Nigeria) |
| Smartphone users | ~50–60M | 2025 est. | GSMA Mobile Economy West Africa |
| Active social media users | ~45M | 2025 | DataReportal / Kemp |
| NIN registrations (cumulative) | ~100M+ | 2025 | NIMC public statements |

**Interpretation:** The addressable citizen base for a smartphone-based civic platform is on the order of 50M, of which we can realistically hope to reach 100K–500K in the first 2–3 years. Even at the lower end, that is enough users to make the lawyer marketplace and the poll features meaningful. At the higher end, it would represent the largest civic-engagement platform in Nigeria by user count.

### 2.2 The "Verified Citizen" Subset

Not all internet users can or will complete NIMC verification. Our addressable market is the intersection of:

- Has a NIN (or can complete Onfido document verification)
- Has a smartphone or regular internet access
- Is of voting age (18+)
- Resides in a state we operate in
- Has the literacy and trust to engage with a civic platform

**TAM → SAM → SOM**

| Level | Definition | Estimate |
|-------|------------|----------|
| **TAM** (Total Addressable Market) | Adult Nigerians with internet access and a NIN | ~40–50M |
| **SAM** (Serviceable Addressable Market) | Adult Nigerians in states we operate in, with smartphone and NIN | ~10–15M (Year 1: Lagos only ~3M) |
| **SOM** (Serviceable Obtainable Market) | Citizens we can realistically acquire in Years 1–3 | 100K (Y1) → 500K (Y3) |

The SOM targets are based on comparable civic-tech platforms in other markets (e.g., Kenya's Huduma, India's MyGov, civic-engagement apps in Latin America), adjusted downward for Nigeria's lower smartphone penetration and trust levels. They are deliberately conservative.

### 2.3 Lawyer Supply

| Metric | Value | Year | Source |
|--------|-------|------|--------|
| Lawyers called to the Nigerian Bar (cumulative, est.) | ~300,000+ | 2025 | NBA + Body of Benchers public data |
| Practicing lawyers (active, est.) | ~200,000–250,000 | 2025 est. | NBA + survey data |
| Lawyers with active digital presence | ~10–20% (est.) | 2025 | Industry estimate, no authoritative source |
| Geographic concentration | ~60% in Lagos, Abuja, Port Harcourt | — | NBA + Body of Benchers data |

**Implication for the lawyer marketplace:**

- Supply is large in absolute terms, but most lawyers are not digitally active and will not sign up to a platform without active outreach.
- The Year 1 target of 10 lawyers (in [Business.md §3.2.1](./Business.md#321-lawyer-listings-primary-revenue-stream-from-year-2)) is small enough to be achievable through direct relationship-building; it is not a market-validated number.
- The Year 3 target of 200 lawyers is a more meaningful test of marketplace liquidity. If we cannot reach 200 active listings by end of Year 3, the marketplace is not working as a business and we should reconsider the model.
- Geographic concentration is a feature (start where the lawyers are) and a bug (under-served states will remain under-served). The platform needs an explicit strategy for the long tail — likely pro bono partnerships and Bar Association chapter engagement.

### 2.4 Grant Funding Market

The civic-tech grant funding market in Nigeria (and pan-Africa) is meaningful but finite.

| Funder type | Typical grant size | Probability of fit |
|-------------|---------------------|-------------------|
| International civic-tech (e.g., Luminate, Open Society, Ford, Omidyar) | ₦50M–₦500M (USD $35K–$350K) over 1–3 years | High for the Year 1 anchor grant |
| Nigerian philanthropic foundations (e.g., MacArthur Nigeria, TY Danjuma) | ₦10M–₦100M | Medium; higher friction, higher reputational value |
| Multilateral development institutions (e.g., World Bank, AfDB) | ₦100M+ but slow, complex | Low for Year 1; possible for Year 2 scale-up |
| Government grants (e.g., CBN tech fund, NITDA) | Variable | Low; conflict-of-interest concerns for a civic platform |
| Corporate CSR | ₦5M–₦20M | Medium for specific features (legal literacy, AI detection) |

**Implication:** The Year 1 grant target of ₦20M is achievable with 1–2 anchor international funders, and is the realistic ceiling for Nigerian philanthropic foundations in a single year. The diversification rule (no single funder >40%) is binding at this scale and limits the size of any single grant we can accept.

---

## 3. Competitive Landscape

### 3.1 Direct Competitors

**There are no direct competitors that integrate all three pillars (civic engagement + evidence integrity + lawyer access) with a non-binding framing.** The competitive landscape is best understood as point solutions in each pillar, with overlap in adjacent spaces.

### 3.2 Civic Engagement

| Player | Description | Overlap with Najia | Key differentiator |
|--------|-------------|-------------------|---------------------|
| **BudgIT** | Nigerian civic organization focused on public budget transparency | Partial — both work on citizen engagement, but BudgIT is a non-profit advocacy org, not a platform | BudgIT is more advocacy-focused; Najia is more platform-and-tools focused |
| **Enough is Enough (EiE)** | Youth-focused civic engagement, election monitoring | Partial — strong in election periods; weak in between | EiE is event-driven (elections); Najia is continuous |
| **Civil Society Legislative Advocacy Centre (CISLAC)** | Policy advocacy and legislative monitoring | Low | CISLAC works directly with legislators; Najia is citizen-facing |
| **MyGov India (analogue)** | Government-run civic engagement platform | Reference only | Different model: government-run vs. independent; not directly comparable |

**Our position:** None of the above is a direct competitor. The closest analogue is EiE, but their focus is on election integrity, not continuous non-binding engagement. The market is open.

### 3.3 Evidence Integrity / Deepfake Detection

| Player | Description | Overlap | Notes |
|--------|-------------|---------|-------|
| **Truecaller (Nigeria)** | Caller ID and spam detection | Low — not in evidence space | |
| **International deepfake detection vendors** (Sensity, Hive, etc.) | Deepfake detection APIs | High technically, but no Nigerian market presence | We may use them as suppliers, not competitors |
| **Nigerian fact-checkers** (Dubawa, Africa Check) | Manual fact-checking of news and media claims | High conceptually | Fact-checkers work on public information, not on private disputes; the use case is different |
| **Generic cloud storage** (Google Drive, etc.) | File storage with version history | Low | Storage, not integrity verification |

**Our position:** The "evidence integrity for civil disputes" use case is largely unserved. Generic cloud storage doesn't verify integrity against upload-time state, and deepfake detection vendors don't offer the integrated "upload + hash + AI detect" pipeline that Najia offers. The closest analogue is manual fact-checking, but that's a different product and a different user.

### 3.4 Lawyer Marketplaces

| Player | Description | Overlap | Notes |
|--------|-------------|---------|-------|
| **LegalMatch (US)** | Lawyer–client matching | Conceptual analogue, not a Nigerian competitor | We can learn from their matching algorithm and review system |
| **LawPadi** | Nigerian legal tech startup | High | LawPadi is the most direct competitor in the lawyer marketplace space; they focus on SME legal services and contracts |
| **LawyerInc** | Nigerian legal directory | High — directory rather than marketplace | Less of a marketplace, more of a listings page |
| **Legal Aid Council of Nigeria** | Government legal aid | High in concept, different in operation | Government-funded; we complement, do not replace |
| **Traditional law firm websites** | Each firm markets its own services | Low | Not a platform, but a substitute at the marketing layer |

**Our position:** LawPadi is the most credible direct competitor in the lawyer marketplace pillar. Key differences:

- **LawPadi focus:** B2B / SME contracts. Their primary user is a small business owner needing contract templates and review.
- **Najia focus:** B2C / individual civil disputes. Our primary user is a citizen dealing with a landlord, employer, consumer issue, or family matter.
- **Najia advantage:** The evidence integrity pillar means we can offer something LawPadi cannot — verified evidence as part of the case.
- **Najia disadvantage:** We are starting later, with less lawyer supply, and with a smaller brand.

**Strategy:** Avoid direct competition in LawPadi's SME segment. Position as complementary. Differentiate on evidence integrity and the civic engagement pillars (which LawPadi does not have).

### 3.5 Adjacent and Substitute Products

| Category | Examples | Why they're substitutes |
|----------|----------|------------------------|
| Social media (whistleblowing) | Twitter/X, Facebook, WhatsApp | Citizens post disputes publicly; this is the de facto substitute for "evidence" in many cases |
| Generic video calls (for legal consultation) | Zoom, Google Meet | Citizens schedule lawyer calls directly without a platform |
| Word of mouth / referrals | — | The dominant channel for finding a lawyer in Nigeria today |
| In-person legal aid clinics | LADC, NBA pro bono programs | The dominant channel for low-income legal access |
| Government complaint channels | Consumer Protection Council, Public Complaints Commission | Citizens go to government for some of the same problems |

**Implication:** Our biggest competition is not a startup — it's the *absence* of a platform. The risk is that users continue with the current behavior (whistleblow on Twitter, find a lawyer through a cousin, go to the CPC) and never adopt the platform. The marketing strategy must address this directly: not "use us instead of X" but "use us *and* X, and get more out of both."

---

## 4. User Research

### 4.1 Research Conducted

This section will be updated as primary research is completed. As of v1.0.0, the following has been done:

| Method | Sample | Date | Key findings |
|--------|--------|------|--------------|
| Informal interviews (founders' networks) | 12 citizens across Lagos, Abuja, Port Harcourt | 2025–2026 | Demand for verified evidence is high; trust in existing platforms is low; legal access is perceived as expensive and slow |
| Lawyer outreach (informal) | 5 lawyers, mixed experience levels | 2025–2026 | Lawyers are interested in client acquisition but skeptical of platform fees; pro bono interest is mixed |
| Funder conversations | 4 international funders | 2025–2026 | All 4 expressed interest in the model; 2 indicated willingness to lead a grant; 1 explicitly requested the non-binding framing as a precondition |

### 4.2 Key User Insights

**Citizens:**

- "I would use a platform that proves the screenshot I'm uploading wasn't edited." (Demand for evidence integrity is intuitive and immediate.)
- "I don't trust that my vote won't be used against me." (Trust is the binding constraint, not feature set.)
- "I already have a lawyer through my family. But my neighbors don't." (Word-of-mouth is the dominant lawyer-discovery channel; a platform adds value mainly for the unconnected.)
- "If the government sees my vote, will I be punished?" (This fear is real and must be addressed in the product and the marketing.)

**Lawyers:**

- "I would list on a platform if it brings me clients I wouldn't otherwise find." (ROI is the question, not feature set.)
- "I don't want to compete on price with the lawyer down the street." (Matching algorithm must not be a race to the bottom.)
- "Pro bono is meaningful to me, but I can't do it full-time." (Pro bono needs to be opt-in per case, not a quota.)

**Funders:**

- "We will not fund a platform that is seen as a court or jury." (Non-binding framing is a precondition, not a feature.)
- "Show us the path to sustainability, not just the grant ask." (Sustainability is the bar, not impact alone.)
- "How do you prevent government retaliation?" (Operational independence is a key concern.)

### 4.3 Open Research Questions

The following require primary research before the Lagos pilot:

| # | Question | Method | Owner | Target date |
|---|----------|--------|-------|-------------|
| 1 | What is the willingness-to-pay for a basic lawyer listing among active Nigerian lawyers? | Survey of 50+ lawyers | Operations | Pre-launch (Month 3) |
| 2 | What is the NIN coverage among likely platform users in Lagos? | NIMC data + sample survey | Engineering | Pre-launch (Month 3) |
| 3 | What is the trust baseline for civic platforms among Lagos citizens? | Survey of 200+ citizens | Product | Pre-launch (Month 3) |
| 4 | How do citizens currently resolve the disputes we are targeting? | Qualitative interviews, 15+ citizens | Product | Pre-launch (Month 3) |
| 5 | What is the Bar Association's posture on lawyer listing fees? | Direct engagement with NBA | Legal | Pre-launch (Month 3) |

These are blocking research items for the pilot. None of them has a confident answer today.

---

## 5. Market Trends

### 5.1 Tailwinds (favorable trends)

| Trend | Why it helps Najia |
|-------|---------------------|
| NIN coverage continues to expand | Identity verification is the gate to voting and other features; expansion lowers the barrier |
| Smartphone penetration growing ~5–10% annually | Larger addressable market each year |
| AI-generated media is becoming more prevalent | Demand for deepfake detection grows over time; we are early |
| Nigerian civic space is opening after the 2023 elections | Reduced regulatory hostility to civic-tech (relative to election years) |
| Legal tech is a growing category globally | Lawyer recruitment is easier; funder interest is higher |
| Remote consultation normalized post-COVID | Lawyer marketplace is more culturally acceptable than in 2019 |

### 5.2 Headwinds (unfavorable trends)

| Trend | Why it hurts Najia |
|-------|---------------------|
| Inflation and naira devaluation | Operating costs in USD-equivalent terms (cloud APIs, mobile data) are rising; naira revenue is flat |
| Trust in institutions is structurally low in Nigeria | Harder to acquire users who don't trust *any* institution, including us |
| Government can change posture quickly | A new administration could view the platform as adversarial; the non-binding framing is the only durable defense |
| 2027 election cycle begins in late 2026 | Increased scrutiny of anything that could be perceived as election-related; we must police this carefully |
| AI detection is a moving target | Generative AI models improve faster than detectors; the detection pipeline must be continuously updated |

### 5.3 Timing Assessment

**Verdict:** The market is ready for a platform like this, with two important caveats:

1. **Election cycle:** Avoid any feature launches or major marketing pushes in the 6 months before the 2027 election. The non-binding framing will not protect us from being dragged into the political conversation.
2. **Naira stability:** The financial projections are in naira. If naira devaluation accelerates, USD-denominated costs (NIMC API in USD, Onfido, AI APIs) will grow faster than projected. This is a material risk and is reflected in the [Business Case §9](./Business.md#9-key-financial-risks).

---

## 6. Risks to Market Entry

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Government retaliation in the 2027 election cycle | High | Medium | Non-binding framing; quiet period; legal counsel pre-clearance for all poll topics |
| Funders withdraw due to political pressure | High | Low–Medium | Diversified funder base; transparent reporting; explicit non-partisanship |
| NIMC NVS API access is restricted or denied | High | Low | Onfido already integrated as fallback; manual review as last resort |
| A well-funded competitor (e.g., a LawPadi expansion) enters the integrated space | Medium | Low | Speed to market; first-mover advantage in the integrated model |
| Public misperception of binding effect (poll = vote) | High | Medium | Repeated disclaimers; onboarding education; advisory board review of poll questions |
| Naira devaluation makes USD-denominated costs unsustainable | High | Medium | Multi-currency budgeting; USD-grant preference; cost optimization levers (open-source AI) |

---

## 7. Strategic Implications

Based on the research above, three strategic implications for the platform:

### 7.1 The Non-Binding Framing is a Feature, Not Just a Compliance Note

Every funder conversation and every user interview confirms that the non-binding framing is the single most important thing that distinguishes Najia from anything a regulator could perceive as a court or election tool. The product, the marketing, the user onboarding, and the public communications must all reinforce this. It is not a disclaimer buried in the footer.

### 7.2 Evidence Integrity is the Standout Differentiator

Across all the research, evidence integrity is the feature citizens intuitively understand and value. It is the most "wow" moment in the user journey and the most defensible technical differentiator. The product, engineering, and marketing should treat it as such.

### 7.3 The Lawyer Marketplace is the Risk, Not the Opportunity

The lawyer marketplace is the most monetizable pillar but also the one with the most competitors and the most regulatory exposure (Bar Association rules). It is not the wedge product. The wedge is the evidence integrity feature; the marketplace rides on top of it. The pilot should validate the marketplace as a *secondary* outcome, not the *primary* success metric.

---

## 8. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Can we get NIMC NVS API access confirmed before Month 3? | Engineering Lead | Open — engagement in progress |
| 2 | What is the realistic Lagos MAU ceiling for a civic-tech app in the first 12 months? | Product Lead | Open — needs primary research |
| 3 | Is LawPadi planning an evidence-integrity feature? (Could change competitive dynamics.) | Project Lead | Open — informal channel only |
| 4 | What is the NBA's current posture on third-party lawyer listing platforms? | Legal Director | Open — engagement planned |
| 5 | Will the 2027 election cycle accelerate or delay our national expansion? | Project Lead | Open — depends on political climate |

Resolved questions move to the [Decision Log](./Decision%20Log.md).

---

## Appendix A: Glossary
- **NBA** — Nigerian Bar Association
- **NDPR** — Nigeria Data Protection Regulation
- **NIN** — National Identification Number
- **SAM** — Serviceable Addressable Market
- **SOM** — Serviceable Obtainable Market
- **TAM** — Total Addressable Market

## Appendix B: Sources
- UN World Population Prospects (Nigeria)
- Nigerian Communications Commission (NCC) — internet penetration data
- StatCounter Global Stats — Nigeria
- GSMA Mobile Economy West Africa reports
- DataReportal Digital Nigeria reports
- NIMC public statements on NIN registrations
- Nigerian Bar Association + Body of Benchers public data
- Luminate, Open Society, Ford Foundation public grant databases (for funder landscape)
- Internal user interviews (2025–2026), summarized in §4

## Appendix C: Re-Verification Schedule

| Section | Re-verify by | Owner |
|---------|--------------|-------|
| §2 Market sizing | Annual | Project Lead |
| §3 Competitive landscape | Bi-annual | Project Lead |
| §4 User research | Pre-pilot + post-pilot | Product Lead |
| §5 Market trends | Quarterly review | Project Lead |
| §7 Strategic implications | Annual | Project Sponsor |

## Appendix D: Market Research Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Project Lead | Initial draft. Used internal interviews and public data; primary research listed as blocking items. |