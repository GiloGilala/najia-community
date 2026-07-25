# Personas — Najia Community Bridge

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Product Lead*
*Reviewers: Design Lead, Operations Director, Project Lead*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Four primary personas (Amara, Tunde, Ngozi, Kemi) for the Lagos pilot. Secondary personas deferred to v1.1 once pre-pilot research (PRD §10, Open Question #5) is complete.

> **How to read this document:** Personas are **composite archetypes** built from real user research, not real individuals. They are a tool for product decisions, not a substitute for talking to actual users. When a persona and a real user disagree, the real user wins — and the persona gets updated.

> **Related documents:**
> - [PRD.md §3 — Users](./PRD.md#3-users) — the pilot user model
> - [User Journeys.md](./User%20Journeys.md) — the flows these personas move through
> - [Market Research §4 — User Research](../business/Market%20Research.md#4-user-research) — the underlying interviews
> - [Project Charter §7 — Stakeholder Analysis](../business/Project%20Charter.md#7-stakeholder-analysis) — the broader stakeholder map

---

## 1. Persona Summary

| # | Persona | Role | Pilot priority | Most important feature |
|---|---------|------|----------------|------------------------|
| 1 | Amara — The Engaged Citizen | Primary user; provides the MAU base | High | Policy polls and confidence votes |
| 2 | Tunde — The Dispute-Haver | Primary user; drives evidence volume | High | Evidence integrity and lawyer matching |
| 3 | Ngozi — The Verified Lawyer | Marketplace supply | High | Lawyer profile and matching |
| 4 | Kemi — The Moderator | Internal staff; ensures content quality | High | Moderation queue and review tools |
| 5 | Bola — The Casual Observer | Secondary user; grows the funnel | Medium | Read-only access to poll results and blog |
| 6 | Femi — The Journalist | Secondary user; amplifies reach | Medium | Transparent reports and public data |
| 7 | Hadiza — The Diaspora Supporter | Secondary user; can refer others | Low | Mobile app, share-to-social flows |

The first four are pilot-blocking. The last three are not — they will be developed into full personas after the pilot, when we have data to ground them.

---

## 2. Persona Development Method

Each persona was built from:

- **Market Research §4 user interviews** (12 citizens, 5 lawyers, 4 funders)
- **Project Charter §7 stakeholder analysis**
- **PRD §3 pilot user model**
- **Composite characterization** (where one persona represents a pattern observed across multiple interviews, not a single individual)

Each persona includes:

- **Snapshot** — a one-paragraph picture
- **Demographics** — age, location, occupation, income, education, language
- **Goals** — what they're trying to accomplish
- **Frustrations** — what's stopping them today
- **Behaviors** — how they currently solve their problem
- **Tech profile** — devices, connectivity, app literacy
- **Trust baseline** — how much they trust institutions (this is a binding constraint for our product)
- **Quote** — a synthesized voice line from the interviews
- **What we are building for them** — the features that matter most
- **What we are NOT building for them** — the features they would love but that aren't pilot scope

The "what we are NOT building" line is important — it sets expectations for product decisions and pre-empts scope creep.

---

## 3. Primary Personas (Pilot)

### 3.1 Amara — The Engaged Citizen

#### Snapshot

Amara is a 28-year-old civil servant in Lagos. She has a university degree, a smartphone she's had for two years, and a strong view that the government's decisions don't reflect what regular people want. She votes in national elections but feels that the time between elections is when decisions that affect her life are actually made, and she has no say. She's skeptical of any platform that asks for her data or her NIN, but she would use one if it could clearly demonstrate that her participation matters and is safe.

#### Demographics

| Field | Value |
|-------|-------|
| Age | 25–35 |
| Location | Lagos (mainland: Yaba, Surulere, Ikeja) |
| Occupation | Civil servant, junior bank officer, teacher, or NGO program officer |
| Income | ₦150,000–₦400,000/month |
| Education | University degree |
| Language | English fluent; Yoruba or Pidgin conversational |
| Family | Single or married, no children or young children |

#### Goals

- Feel that her views are heard between elections
- Hold elected officials accountable for their actions in office
- Connect with other engaged citizens
- Build a record of her civic participation

#### Frustrations

- "Politicians only show up during election season."
- "By the time I find out about a policy, it's already a law."
- "I don't trust Twitter polls because anyone can stuff the ballot."
- "I don't have time to attend town halls."

#### Behaviors today

- Follows political news on Twitter/X and WhatsApp groups
- Occasionally signs online petitions
- Discusses politics with friends and family
- Has not used a civic-tech platform before; the most analogous experience is signing a Change.org petition

#### Tech profile

| Field | Value |
|-------|-------|
| Primary device | Android smartphone (mid-range) |
| Connectivity | 4G with intermittent home Wi-Fi |
| App literacy | High; uses multiple apps daily |
| NIN | Yes; verified through a past SIM registration |
| Comfort with NIMC API | Low; doesn't know what NIN sharing entails |

#### Trust baseline

- Trusts: close friends, family, named NGOs, university professors
- Skeptical of: federal government, anonymous platforms, anything that "feels political"
- Specifically fears: that her NIN will be misused, that her vote will be tracked back to her, that her participation will have consequences

**This last point is critical.** Amara is the most important persona for the platform's civic engagement pillar, and her biggest risk is fear of identification. The non-binding framing, the anonymized vote storage, and the prominent disclaimers are not just compliance features — they are *adoption* features. If we get them wrong, Amara does not register.

#### Quote (synthesized from interviews)

> "If I vote on a poll, will the government see my name? Because if they do, I won't vote."

#### What we are building for Amara

- A non-binding policy poll that takes ≤ 2 minutes to complete
- A confidence vote for her local and state officials, every quarter
- A clear, repeated, prominent "this is not binding" message at every poll interaction
- Anonymous vote storage with no link back to her identity beyond the eligibility check
- A way to see how others in her LGA voted (with statistical safeguards)

#### What we are NOT building for Amara (pilot)

- Local language UI (English only in pilot)
- USSD access (Year 2)
- A social feed of other citizens' votes (this would re-identify her; out of scope)
- Public profile pages for citizens (same reason)

---

### 3.2 Tunde — The Dispute-Haver

#### Snapshot

Tunde is a 34-year-old small business owner (phone accessories, Surulere). He had a landlord dispute last year where he had a series of WhatsApp screenshots and bank transfer receipts that proved the landlord had received payments, but the case dragged on because his evidence was challenged as "possibly edited." He has never hired a lawyer and doesn't know any personally. He'd pay for a lawyer if he could find one he trusted, but the uncertainty of cost and the fear of being overcharged keep him from engaging.

#### Demographics

| Field | Value |
|-------|-------|
| Age | 30–45 |
| Location | Lagos (mainland and island) |
| Occupation | Trader, small business owner, ride-hailing driver, junior professional |
| Income | ₦100,000–₦500,000/month (variable) |
| Education | SSCE or diploma; some university |
| Language | English functional; Yoruba, Hausa, Igbo, or Pidgin fluent |
| Family | Often married with dependents |

#### Goals

- Resolve a specific civil dispute (landlord, employer, consumer, family)
- Find a lawyer he can trust without paying a large upfront fee
- Have evidence that cannot be challenged as fabricated
- Avoid the cost and time of going to court

#### Frustrations

- "I have the proof but no one believes it because they say I could have edited it."
- "Lawyers are expensive and I don't know which ones are good."
- "Small claims court is supposed to be cheap but it takes forever."
- "I don't know my rights well enough to know if I even have a case."

#### Behaviors today

- Collects evidence on his phone: screenshots, photos, voice notes, bank transfer screenshots
- Asks family and friends for lawyer recommendations
- Posts disputes on Twitter/X hoping for visibility (low success rate, high exposure)
- Uses generic cloud storage (Google Photos, WhatsApp backups) for evidence

#### Tech profile

| Field | Value |
|-------|-------|
| Primary device | Android smartphone (mid-range, often 2+ years old) |
| Connectivity | 4G with mobile data limits |
| App literacy | Medium; uses 5–10 apps regularly |
| NIN | Yes (most adults have one after SIM registration drives) |
| File handling | Comfortable with photos, less comfortable with documents |

#### Trust baseline

- Trusts: family, close friends, religious leaders, named businesses
- Skeptical of: government agencies, formal legal system, anything that requires him to travel
- Specifically fears: being scammed by a fake lawyer, paying for a consultation that goes nowhere, evidence being misused

#### Quote (synthesized from interviews)

> "I would use a platform that proves my screenshot is real. That's the main thing. The rest — finding a lawyer — I can do if I know the platform is real."

#### What we are building for Tunde

- A SHA-256 hash on every upload, with a verified badge that proves the file is unchanged from upload time
- AI-assisted detection that flags (probabilistically) when an image or video has been manipulated
- A 3–5 lawyer matching flow based on case type, jurisdiction, and budget
- A free 15-minute consultation with a matched lawyer
- Transparent lawyer reviews from verified clients
- A clear separation between platform services and lawyer services (no confusion about who he's paying)

#### What we are NOT building for Tunde (pilot)

- Mediation or arbitration services (we are not a court)
- An in-app messaging system with the lawyer (uses platform tools during consultation, then communicates outside)
- Document drafting or template library (Year 2 candidate)
- Legal aid clinic integration (Year 2 candidate)

---

### 3.3 Ngozi — The Verified Lawyer

#### Snapshot

Ngozi is a 32-year-old lawyer with 6 years of practice at a mid-sized Lagos firm. She specializes in landlord-tenant and consumer disputes — exactly the cases the platform targets. She's interested in growing her practice beyond the firm's existing client base but skeptical of platforms that promise leads and deliver time-wasters. She charges ₦75,000/hour and takes a limited number of pro bono cases per year. She would list on the platform if it brought her qualified clients and didn't make her compete on price.

#### Demographics

| Field | Value |
|-------|-------|
| Age | 28–45 |
| Location | Lagos (Victoria Island, Lekki, Ikeja — where most mid-tier firms are based) |
| Occupation | Practicing lawyer (associate, senior associate, or partner) |
| Income | ₦300,000–₦2,000,000+/month (varies widely) |
| Education | LL.B + B.L. (Nigerian Bar) |
| Language | English fluent; often a second Nigerian language |
| Family | Varies |

#### Goals

- Find qualified clients without spending all her time on marketing
- Build a public professional profile she controls
- Receive client reviews that reflect her actual work
- Take a meaningful number of pro bono cases without losing billable hours

#### Frustrations

- "Lead-gen platforms always send me the wrong kind of client."
- "I don't want to be the cheapest lawyer in the directory."
- "I don't want a platform taking 20% of my fees."
- "I don't have time to manage another login and dashboard."

#### Behaviors today

- Receives clients through firm referrals and word-of-mouth
- Has a LinkedIn profile and possibly a personal website
- Does not advertise; advertising to the public is restricted for lawyers in Nigeria
- May be on a legal directory (LawyerInc, etc.) but rarely active there

#### Tech profile

| Field | Value |
|-------|-------|
| Primary device | iPhone or high-end Android |
| Connectivity | Reliable 4G/5G; office Wi-Fi |
| App literacy | High; uses many professional tools |
| NIN | Yes |
| Bar verification | Active, good standing with NBA |

#### Trust baseline

- Trusts: established law firms, the NBA (mostly), professional networks
- Skeptical of: anything that "feels like a tech bro disruption of law"
- Specifically fears: Bar Association action against her for participating in a non-compliant platform, being scammed by a platform that takes her fee and disappears

#### Quote (synthesized from interviews)

> "I would list on a platform if it brings me clients I wouldn't otherwise find, doesn't take a cut of my fees, and the Bar Association doesn't object."

#### What we are building for Ngozi

- Bar-verified registration (we do the verification; she doesn't)
- A profile she controls, with practice areas, fees, languages, and reviews
- A matching algorithm that weights practice area and jurisdiction, **not** price
- A free 15-minute consultation funded by the platform (not by her)
- A review system that is verified-client-only, moderated, and respectful
- A clear, written commitment that the platform takes a flat listing fee, not a percentage of legal fees
- A "pro bono" filter that lets her opt-in per case

#### What we are NOT building for Ngozi (pilot)

- An in-app case management system (she has her own)
- An in-app messaging system with the client
- Document automation or template library
- A dashboard of analytics beyond basic profile views and match notifications

---

### 3.4 Kemi — The Moderator

#### Snapshot

Kemi is a 26-year-old content moderator on the platform's small staff team. She has a degree in communications and a year of experience moderating a Nigerian social media platform. Her job is to keep the platform safe, neutral, and trustworthy. She works from a co-working space in Lagos, has set hours, and reports to the Moderation Lead. She is the operational embodiment of the platform's promise that the polls are non-binding, the content is safe, and the lawyers are verified.

#### Demographics

| Field | Value |
|-------|-------|
| Age | 23–35 |
| Location | Lagos (could be remote in Year 2+) |
| Occupation | Full-time content moderator (on staff) |
| Income | ₦150,000–₦300,000/month |
| Education | University degree |
| Language | English fluent |

#### Goals

- Keep the platform safe and on-brand
- Catch problems before they become incidents
- Apply the moderation policy consistently and fairly
- Reduce her own workload through better tools (without losing judgment)

#### Frustrations

- "I have to context-switch between 5 different dashboards."
- "The AI detection flags too much false-positive stuff."
- "I don't always know if I'm being consistent with the other moderators."
- "When something blows up, I find out from Twitter, not the system."

#### Behaviors today

- Reviews flagged content in a queue
- Communicates with users via the platform's messaging
- Escalates to senior moderators for ambiguous cases
- Maintains notes in a personal document for consistency

#### Tech profile

| Field | Value |
|-------|-------|
| Primary device | Laptop (primary) + Android phone (secondary) |
| Connectivity | Reliable Wi-Fi at office |
| App literacy | High; uses multiple internal tools |
| NIN | Yes |

#### Trust baseline

- Trusts: her manager, internal tools, the moderation policy document
- Skeptical of: user appeals that are attempts to game the system

#### Quote (synthesized from interviews)

> "If the AI gives me a clear 'this is likely manipulated' with a confidence score, I can decide in 30 seconds. If it just says 'suspicious,' I'm spending 10 minutes on it."

#### What we are building for Kemi

- A unified moderation queue (no context-switching)
- AI-assisted flags with confidence scores, model version, and "applicability" (so she knows when the AI didn't even try)
- A moderation policy that's one click away from the queue item
- A direct escalation path to senior moderators
- An audit log of her own decisions (for her own review and for accountability)
- Clear, consistent UI for approve/remove/warn/suspend actions
- User appeals visible in the same queue

#### What we are NOT building for Kemi (pilot)

- A full content management system for the blog (that's the Blog Editor)
- An AI training interface (we don't retrain the AI; the Engineering team does)
- A moderator-facing analytics dashboard (the Admin Dashboard is a separate persona)

---

## 4. Secondary Personas (Post-Pilot)

These personas are not pilot-blocking. They are sketched here to keep the team oriented, and will be developed into full personas in v1.1 once we have post-pilot data.

### 4.1 Bola — The Casual Observer

| Field | Value |
|-------|-------|
| Age | 20–30 |
| Location | Lagos |
| Occupation | Student or early-career |
| Behavior | Reads poll results, reads blog, doesn't vote or upload |
| Value to platform | Top-of-funnel; converts to Amara or Tunde over time |
| Pilot needs | None blocking; just needs the platform to be public and fast |

### 4.2 Femi — The Journalist

| Field | Value |
|-------|-------|
| Age | 30–50 |
| Location | Lagos (or pan-Nigeria in Year 2) |
| Occupation | Reporter at a national newspaper or online outlet |
| Behavior | Looks for story leads, references our data, occasionally contacts us |
| Value to platform | Amplifies reach; shapes public perception |
| Pilot needs | Public quarterly transparency report; a designated press contact; timely responses |

### 4.3 Hadiza — The Diaspora Supporter

| Field | Value |
|-------|-------|
| Age | 30–50 |
| Location | London, New York, Dubai (with family in Nigeria) |
| Occupation | Professional, often tech or finance |
| Behavior | Follows Nigerian news, sometimes donates to civic causes, refers family to services |
| Value to platform | Donor pipeline; word-of-mouth; eventual remittance-related features |
| Pilot needs | None; deferred to Year 2+ |

---

## 5. Persona-to-Feature Map

This table is the operational view of how the personas map to features. It is the artifact the design and engineering teams should reference when making tradeoffs.

| Feature | Amara | Tunde | Ngozi | Kemi | Priority |
|---------|-------|-------|-------|------|----------|
| Identity verification | Critical | Critical | Critical | Required (staff) | Must |
| Policy polls | Critical | Secondary | None | Required (publishes) | Must |
| Confidence votes | Critical | Secondary | None | Required (publishes) | Must |
| Evidence integrity | Secondary | Critical | Uses (in cases) | Required (reviews) | Must |
| Lawyer marketplace | None | Critical | Critical | None | Must |
| Blog and legal literacy | Secondary | Secondary | None | Required (publishes) | Must |
| Moderation tools | None | None | None | Critical | Must |
| Admin dashboard | None | None | None | Secondary | Must |
| Mobile app | Critical | Critical | Critical | Secondary | Must |
| USSD | Defer | Defer | Defer | N/A | Won't (Year 2) |
| Local language UI | Defer | Defer | Defer | N/A | Won't (Year 2) |
| Sponsored content | None | None | None | None | Won't (Year 1) |

**"Critical"** = the persona's primary value comes from this feature.
**"Secondary"** = the persona uses the feature but it is not their primary need.
**"None"** = the persona does not interact with this feature in the pilot.
**"Required"** = the persona is internal staff and must use the feature for the platform to function.
**"Defer"** = the persona would benefit, but it is not in pilot scope.

---

## 6. Personas and Risk

Personas are not a substitute for risk management, but they are a useful way to stress-test risks. A feature that is "Critical" for a persona is also a feature that, if it fails, will lose that persona permanently.

| Persona | If we lose them... | The most likely cause of loss |
|---------|---------------------|-------------------------------|
| Amara | The civic engagement pillar is dead | She feels her vote was identified and exposed |
| Tunde | The evidence and marketplace pillars are dead | He gets scammed by a fake lawyer or his evidence is rejected as fake |
| Ngozi | The lawyer marketplace is dead | The NBA objects to the fee model, or she gets bad matches and churns |
| Kemi | The platform is unsafe | The moderation tools are too slow, or she's overloaded and quality drops |

These are the persona-level risks that should be tested in the pilot.

---

## 7. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the actual NIN coverage among Lagos users? | Product Lead | Open — pre-pilot survey |
| 2 | What is the actual willingness-to-pay among Lagos lawyers for a basic listing? | Operations | Open — pre-pilot research |
| 3 | What is the actual trust baseline for the non-binding framing among Lagos citizens? | Product Lead | Open — pre-pilot survey |
| 4 | What is the actual volume of evidence uploads we should expect? | Engineering | Open — pre-pilot estimate |
| 5 | Should we add a "Press" persona before launch? | Project Lead | Open — recommend yes |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). New decisions made based on persona insights also go there.

---

## 8. Persona Update Process

Personas are living documents. They get updated:

- **Quarterly** based on user research and product analytics
- **After any major user research milestone** (e.g., the pre-pilot survey, the post-pilot review)
- **When a new pilot feature is added** that introduces a new user role
- **When a new secondary persona is developed** from a full interview round

The version number increments with each material update. A v1.1.0 is expected within 3 months of pilot launch.

---

## Appendix A: Glossary
- **CAC** — Customer Acquisition Cost
- **LGA** — Local Government Area
- **NBA** — Nigerian Bar Association
- **NIN** — National Identification Number
- **NVS** — National Verification Service (NIMC)

## Appendix B: References
- [PRD.md §3 — Users](./PRD.md#3-users)
- [User Journeys.md](./User%20Journeys.md)
- [Market Research §4 — User Research](../business/Market%20Research.md#4-user-research)
- [Project Charter §7 — Stakeholder Analysis](../business/Project%20Charter.md#7-stakeholder-analysis)

## Appendix C: Personas Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Product Lead | Initial draft. Four primary personas for the Lagos pilot (Amara, Tunde, Ngozi, Kemi). Three secondary personas sketched (Bola, Femi, Hadiza). |