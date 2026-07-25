# User Journeys — Najia Community Bridge

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Product Lead*
*Reviewers: Design Lead, Engineering Lead, QA Lead, Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Five pilot-critical journeys covering the three pillars + lawyer registration + first-time onboarding. Each journey follows the standard format (Trigger, Pre-conditions, Steps, Decision Points, Failure Modes, Success Criteria, Post-conditions).

> **How to read this document:** A user journey is the **end-to-end experience** a persona has with the platform to accomplish a specific goal. It is not a screen flow (that's UX & Design) and not a technical flow (that's the module spec). It is the human-readable contract that the three artifacts agree on. If a journey and a module spec disagree, the journey wins for "what the user sees" and the module spec wins for "what the system does" — and both get updated.

> **Related documents:**
> - [PRD.md §6.1 — Key User Flows](./PRD.md#61-key-user-flows) — the five pilot-critical journeys
> - [Personas.md](./Personas.md) — Amara, Tunde, Ngozi, Kemi
> - [UX & Design.md](./UX%20%26%20Design.md) — screen flows, wireframes, design principles
> - [PLATFORM.md](../PLATFORM.md) — feature policy and product context

---

## 1. Journey Map

| # | Journey | Primary persona | Pillar | Pilot priority |
|---|---------|-----------------|--------|----------------|
| J1 | First-time user becomes a verified citizen | Amara (also Tunde, Ngozi) | 0 — Identity | Must |
| J2 | Verified citizen votes on a policy poll | Amara | 1 — Civic engagement | Must |
| J3 | Verified citizen votes on a confidence question | Amara | 1 — Civic engagement | Must |
| J4 | Citizen with a dispute gets matched to a lawyer | Tunde | 2 + 3 — Evidence + Lawyer | Must |
| J5 | Lawyer registers and gets the first match | Ngozi | 3 — Lawyer | Must |
| J6 | Citizen uploads evidence and verifies it | Tunde | 2 — Evidence | Must (referenced from J4) |
| J7 | Moderator publishes a poll | Kemi | 1 — Civic engagement | Must |
| J8 | User appeals a moderation decision | Tunde / Amara | Cross-cutting | Should |

J1–J5 are the five pilot-critical journeys the PRD calls out. J6 is broken out separately because it's a sub-journey that J4 depends on and is large enough to warrant its own walkthrough. J7 and J8 are shorter and bundled in because they support the pilot's operational viability.

---

## 2. Standard Journey Format

Every journey below uses the same structure:

| Section | What it contains |
|---------|------------------|
| **Trigger** | What makes the user start this journey |
| **Pre-conditions** | What must be true before the journey can start |
| **Steps** | Numbered list of user actions and system responses |
| **Decision points** | Where the user makes a meaningful choice that changes the path |
| **Failure modes** | What can go wrong, and what the user sees when it does |
| **Success criteria** | How we know the journey succeeded, from the user's perspective |
| **Post-conditions** | What is true after a successful journey |
| **Out of scope (pilot)** | What we explicitly are NOT doing in this journey in the pilot |

The journey assumes the user is on the mobile web app unless otherwise stated, since most pilot users will be on mobile.

---

## 3. J1 — First-time user becomes a verified citizen

### 3.1 Trigger

A new visitor lands on the platform, sees the value proposition, and decides to register.

### 3.2 Pre-conditions

- The user has not previously registered.
- The user has a smartphone with a data connection.
- The user has either:
  - An 11-digit NIN + date of birth + full name (as on their NIN), **or**
  - A government-issued photo ID (Passport, Driver's License, or Voter's Card) + a selfie for facial comparison

### 3.3 Steps

1. **User lands on home page.** Sees hero, value proposition, sample poll, and "Get started" CTA.
2. **User clicks "Get started."** Sees registration form (email, password, full name).
3. **User submits registration.** System creates an unverified account, sends a verification email, logs the user in (session created).
4. **User verifies email.** System marks email as verified. User is redirected to identity verification.
5. **User sees identity verification options.** Two cards: "Verify with NIN" (recommended, faster) and "Verify with document" (fallback).
6. **User chooses NIN path.** System collects NIN, DOB, and full name.
7. **System calls NIMC NVS API.** While waiting, user sees a clear progress indicator with a 10-second timeout. User can cancel and switch to document path.
8a. **NIMC match found.** System marks user as NIMC VERIFIED → VERIFIED. Caches result for 30 days.
8b. **NIMC no match or failure.** System suggests retrying, then offers the document path.
9. **(Document path, if used.)** User uploads ID photo + selfie. System sends to Onfido. While waiting, user sees progress.
10a. **Onfido verification clear.** System marks user as ONFIDO VERIFIED → VERIFIED.
10b. **Onfido verification failed.** System offers retry, then manual review path.
11. **User sees "You're verified" screen.** With a short explanation of what they can now do (vote, upload evidence, find a lawyer) and prominent reminder of the non-binding nature of the platform.
12. **User is taken to their profile or the home page.**

### 3.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| Registration vs. continue without account | Register or browse | Register (CTA is primary) |
| NIN vs. document verification | NIN or document | NIN (recommended) |
| Retry on failure vs. switch path | Retry or switch | Switch (after 2 failures) |

### 3.5 Failure modes

| Failure | What the user sees | What the system does |
|---------|---------------------|----------------------|
| Email already in use | "An account with this email exists. Try logging in." | Returns to login form |
| NIN format invalid | Inline error on the NIN field | No API call |
| NIMC API timeout (10s) | "Verification is taking longer than expected. You can wait, try again, or use a document." | Caches failure for 24h cool-down |
| NIMC API error (5xx) | "We can't reach the verification service right now. Please try again in a few minutes." | Retries with exponential backoff (3 retries) |
| NIMC no match | "We couldn't match your details. Check your NIN, date of birth, and name, or use a document instead." | Allows retry or path switch |
| Onfido document rejected | "We couldn't verify your document. You can try again with a different document." | Allows retry; manual review as last resort |
| User abandons mid-flow | (No action) | Account remains UNVERIFIED; user can resume later |

### 3.6 Success criteria

The user considers the journey successful if:

- They can register in ≤ 5 steps
- They understand what they're verifying for and why
- They get a clear "verified" outcome within 3 minutes on a typical connection
- They don't have to re-enter information if they switch paths
- They are explicitly told what they can do next

The platform considers the journey successful if:

- ≥ 80% of users who start verification reach a terminal state (VERIFIED, REJECTED, or in MANUAL REVIEW)
- ≥ 70% of users who start with NIN succeed with NIN (the rest fall through to Onfido or manual review)
- The full journey takes ≤ 5 minutes for a successful NIN path

### 3.7 Post-conditions

- User account exists with `VERIFIED` (or `REJECTED` / `MANUAL REVIEW`) status
- Verification result is cached in SQLite for 30 days
- Audit log entry created
- User can now access all verification-gated features

### 3.8 Out of scope (pilot)

- Social login (Google, Apple)
- Phone-number-only registration
- Biometric-only verification (fingerprint, face) — NIMC supports it but the API integration is deferred
- Local language UI on the verification screens
- Re-verification reminder system (the 30-day cache makes this not needed in pilot)

---

## 4. J2 — Verified citizen votes on a policy poll

### 4.1 Trigger

A verified citizen (Amara) is on the platform, sees a poll she has an opinion on, and decides to vote.

### 4.2 Pre-conditions

- User is logged in
- User is VERIFIED (via NIMC or Onfido)
- User resides in the poll's jurisdiction (Lagos for the pilot)
- The poll is currently in its voting window (between start and end dates)

### 4.3 Steps

1. **User sees poll on home page or polls list.** The poll is shown with: title, plain-language summary, vote CTA, voting deadline.
2. **User clicks the poll.** Sees the full poll page: title, full summary, official policy context link (if available), question, options.
3. **User reads the non-binding disclaimer** prominently displayed above the vote options.
4. **User selects an option** and clicks "Submit vote."
5. **System validates the vote:** one-per-user, in-window, jurisdiction match. Caches the result for the session.
6. **System records the vote** and returns a "Thank you for your vote" confirmation.
7. **User is shown their selection** (with a "change your vote" link if the poll is still open).
8. **(After poll closes.)** User can return to see the aggregated results.

### 4.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| View results without voting | Possible from the polls list | Available to anyone |
| Vote vs. suggest a different poll | Vote or suggest | Vote is primary |
| Change vote after submitting | Possible while poll is open | Not prominent (votes should be deliberate) |

### 4.5 Failure modes

| Failure | What the user sees | What the system does |
|---------|---------------------|----------------------|
| User not verified | "You need to verify your identity to vote." With a CTA to verification. | Returns 403; user redirected to J1 |
| User not in jurisdiction | "This poll is for [State] residents only." | Returns 403; shows the user's jurisdiction |
| User already voted | "You've already voted on this poll. See your selection above." | Returns 409; shows the user's previous selection |
| Poll not in window | "This poll is not currently open for voting. Voting opens [date]." | Returns 422 |
| Vote count is at capacity (no, polls don't have a max — N/A) | — | — |
| DB error | "Something went wrong. Please try again." | Logs error; allows retry |

### 4.6 Success criteria

The user considers the journey successful if:

- They can vote in ≤ 2 minutes from landing on the poll
- They clearly understand the poll is non-binding
- They get immediate confirmation their vote was recorded
- They can see results once the poll closes

The platform considers the journey successful if:

- ≥ 70% of users who start a poll vote (vs. abandon)
- Zero duplicate votes are recorded
- 100% of votes are correctly attributed in the audit log
- The non-binding disclaimer is visible on every results view

### 4.7 Post-conditions

- Vote record exists in DB (immutable, anonymized)
- User cannot vote again on this poll
- Audit log entry created
- When poll closes, results are computed and cached

### 4.8 Out of scope (pilot)

- Real-time results during the voting window (results are computed at close)
- Poll creation by citizens (only moderators can create, per PLATFORM.md §3.1.5)
- Comments on polls (deferred — would require moderation at scale)
- Push notification reminders to vote
- "Share to social" with pre-filled results

---

## 5. J3 — Verified citizen votes on a confidence question

### 5.1 Trigger

A verified citizen (Amara) wants to express her view on a Lagos official (governor, house member, LGA chair) during the quarterly confidence window.

### 5.2 Pre-conditions

- User is logged in
- User is VERIFIED
- User resides in the official's jurisdiction
- A confidence vote window is open (Jan, Apr, Jul, Oct; 7 days per quarter)

### 5.3 Steps

1. **User sees "Confidence votes are open" banner** on home page or polls section.
2. **User browses officials** (filterable by state, role, LGA) and selects one.
3. **User sees the official's profile** (name, role, jurisdiction, brief description of responsibilities, previous quarter's results if available).
4. **User reads the non-binding disclaimer** prominently displayed.
5. **User selects Yes / No / Uncertain** and optionally writes a brief rationale (non-binding, anonymous).
6. **User submits vote.** System validates: one-per-official-per-quarter, in-window, jurisdiction match.
7. **System records the vote** and shows confirmation.
8. **User can return to see aggregated results** (after the window closes, with trend vs. previous quarter).

### 5.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| Filter officials | By state, role, LGA | All in user's jurisdiction |
| Add a rationale | Yes / No | Optional |
| View previous quarter results before voting | Yes / No | Available but not auto-shown (avoids anchoring) |

### 5.5 Failure modes

| Failure | What the user sees | What the system does |
|---------|---------------------|----------------------|
| Already voted this quarter | "You voted on [Official] in [Quarter]. See your selection above." | Returns 409; shows previous selection |
| Window closed | "Voting for this quarter has closed. The next window opens [date]." | Returns 422 |
| Not in jurisdiction | "This official represents [State]. You're registered in [State]." | Returns 403 |

### 5.6 Success criteria

- User can complete the vote in ≤ 90 seconds
- User understands the non-binding nature
- Quarter-over-quarter trend is visible after the second quarter
- No vote can be tied back to a user beyond the eligibility check

### 5.7 Post-conditions

- Vote record exists (anonymized)
- User cannot vote on this official again this quarter
- Results computed at window close

### 5.8 Out of scope (pilot)

- Push notifications when windows open
- Comments on officials
- Following an official for updates
- Confidence votes on federal officials (pilot is Lagos-focused; federal comes with national expansion)

---

## 6. J4 — Citizen with a dispute gets matched to a lawyer

This is the most complex pilot journey. It is broken into clear sub-steps.

### 6.1 Trigger

A citizen (Tunde) has a civil dispute (landlord, employer, consumer, family) and decides to find a lawyer.

### 6.2 Pre-conditions

- User is logged in
- User is VERIFIED
- User has at least one piece of evidence (optional for the intake, recommended)

### 6.3 Steps

#### Phase 1: Intake (the user describes their case)

1. **User clicks "Find a lawyer"** from the home page or evidence section.
2. **User sees the intake form** with clear language:
   - "What kind of case is it?" (landlord-tenant, employment, consumer, family, other)
   - "What state is it in?" (defaults to user's state)
   - "What's your budget range?" (slider, with "I'm not sure" option)
   - "How urgent is it?" (within a week, within a month, no rush)
3. **User fills in the form** and clicks "Find lawyers."
4. **System validates the intake** (Zod schema) and runs the matching algorithm.

#### Phase 2: Match (the system returns lawyer profiles)

5. **User sees 3–5 matched lawyer profiles**, each showing:
   - Name and photo
   - Practice areas and jurisdictions
   - Years of experience
   - Fee structure
   - Languages spoken
   - Overall rating and number of reviews
   - "Schedule free consultation" CTA
6. **User reviews profiles** and selects one to schedule with.
7. **User sees a confirmation modal** explaining:
   - The consultation is free (15–20 minutes)
   - The platform funds the consultation; the lawyer is not paid
   - Any engagement after the consultation is between the user and the lawyer, not the platform
   - The platform does not take a percentage of any legal fee

#### Phase 3: Consultation (free, platform-funded)

8. **User selects a time slot** from the lawyer's availability.
9. **User receives a confirmation** with the consultation time and a join link.
10. **At consultation time, both parties join** the platform's video/audio/chat.
11. **Consultation happens** (15–20 minutes). Platform tracks duration for billing/analytics (the lawyer is paid a flat fee by the platform for the consultation time).

#### Phase 4: Post-consultation

12a. **User decides to engage the lawyer.** Engagement happens outside the platform. User can return to leave a review after the engagement is documented.
12b. **User decides not to engage.** No further action required. User can return to find another lawyer at any time.
13. **User is asked to rate the consultation experience** (separate from a lawyer review; this is about the platform's matching quality, not the lawyer).

### 6.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| Use the matched lawyers or search differently | Use matches or browse all | Use matches (with "see more lawyers" option) |
| Schedule consultation now or save lawyer for later | Now or save | Now is primary |
| Engage the lawyer after consultation | Engage or don't | User's choice; no platform pressure |

### 6.5 Failure modes

| Failure | What the user sees | What the system does |
|---------|---------------------|----------------------|
| No lawyers match | "We don't have a lawyer matching your case right now. We'll notify you when one joins." | Saves the intake; user is added to a waitlist |
| Lawyer doesn't respond within 24h of match | "Your lawyer hasn't responded. You can pick another or try again." | Re-opens the match; lawyer is flagged for slow response |
| Consultation is missed by lawyer | "Your lawyer didn't join the consultation. We've refunded your time and you can pick another." | Lawyer is charged a no-show fee (or noted); user can re-match |
| User's budget is below the lowest available lawyer's fee | "Based on your budget, here are lawyers who offer reduced-fee or pro bono consultations. You can also adjust your budget." | Filter; offer pro bono path |
| User tries to discuss a criminal case | "We connect citizens with lawyers for civil matters. For criminal cases, contact the Legal Aid Council or the police." | Refuses; redirects to Legal Aid Council |

### 6.6 Success criteria

- User can complete intake in ≤ 5 minutes
- Match returns 3–5 lawyers in ≤ 10 seconds
- User clearly understands the consultation is free and the engagement (if any) is separate
- User clearly understands the platform does not take a percentage of legal fees
- The free consultation starts on time and lasts 15–20 minutes
- The user can rate the consultation experience

### 6.7 Post-conditions

- Match record exists (citizen + lawyer)
- Consultation record exists (time, duration, status)
- If engaged, the engagement is documented (lawyer confirms externally; review is enabled after confirmation)
- The platform has tracked the matching quality (for the matching algorithm's improvement)

### 6.8 Out of scope (pilot)

- In-app messaging with the lawyer (uses platform tools during consultation, then off-platform)
- Document sharing with the lawyer via the platform (deferred to Year 2; uses evidence integrity for files already on the platform)
- Multi-party consultations (e.g., both parties in a dispute)
- Automated translation during consultations
- Legal aid clinic integration
- Mediation or arbitration services (we are not a court)

---

## 7. J5 — Lawyer registers and gets the first match

### 7.1 Trigger

A lawyer (Ngozi) hears about the platform, decides it could bring her qualified clients, and registers.

### 7.2 Pre-conditions

- User has a valid NBA bar license (verified)
- User has a NIN (for identity verification, via NIMC or Onfido)
- User has read and accepted the Lawyer Terms (which include the fee structure, the non-binding nature of the platform, and the bar compliance representations)

### 7.3 Steps

#### Phase 1: Registration

1. **Lawyer clicks "Register as a lawyer"** from the lawyers page.
2. **Lawyer sees a clear value proposition:** "Reach qualified clients. No percentage of your fees. Pro bono opportunities."
3. **Lawyer creates a platform account** (email, password, name) — same as a citizen, but with a "I am a lawyer" flag.
4. **Lawyer completes identity verification** (J1 path).
5. **Lawyer submits bar credentials:** bar number, year of call, jurisdictions, practice areas.
6. **System verifies bar credentials** with the NBA (or via the verification queue if NBA API not yet integrated; in pilot this is a manual check by a moderator).
7. **Lawyer accepts the Lawyer Terms.**
8. **Lawyer chooses a subscription tier** (Basic / Enhanced / Premium) and pays the first month's fee.
9. **Lawyer completes the profile:** photo, bio, languages, fee structure, availability.
10. **Profile is reviewed** by a moderator (24–48h SLA).
11. **Profile goes live.** Lawyer is now visible in matches.

#### Phase 2: First match

12. **Lawyer receives an email + in-app notification** of a new match.
13. **Lawyer reviews the case summary** (case type, jurisdiction, budget, urgency — but **not** the citizen's identity).
14. **Lawyer accepts or declines** the match.
15a. **Accepted.** System facilitates the consultation scheduling.
15b. **Declined.** System re-opens the match for the citizen.

### 7.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| Subscription tier | Basic / Enhanced / Premium | Basic (cheapest) is highlighted as "try us out" |
| Accept the match | Accept or decline | Accept is primary; decline requires a reason |
| Set availability | Hours, days, blackout dates | Default: business hours, no blackouts |

### 7.5 Failure modes

| Failure | What the lawyer sees | What the system does |
|---------|----------------------|----------------------|
| Bar verification fails | "We couldn't verify your bar license. Please double-check your bar number, or contact us." | Allows retry; manual review as fallback |
| Profile incomplete at review time | "Please complete [X, Y, Z] before your profile can go live." | Profile held in draft state |
| Match accepted but no citizen response in 48h | (No action; system reopens the match) | — |
| Lawyer declines too many matches | Lawyer is flagged for review | Moderator reaches out |

### 7.6 Success criteria

- Lawyer can register and have a live profile in ≤ 48 hours of starting
- Lawyer understands the fee structure is a flat subscription, not a percentage
- Lawyer understands the consultation is platform-funded
- Lawyer receives match notifications in real-time
- Lawyer's first match is facilitated smoothly

### 7.7 Post-conditions

- Lawyer account exists with VERIFIED + LAWYER role
- Profile is live and matchable
- Subscription is active
- First match record exists (if any)

### 7.8 Out of scope (pilot)

- Group practices / firm accounts (one account per lawyer)
- Multi-lawyer case teams
- Document automation or template library
- In-app case management
- Client-side lawyer reviews before the engagement is documented (Year 2 candidate)

---

## 8. J6 — Citizen uploads evidence and verifies it

This is a sub-journey of J4 but is large enough to warrant its own walkthrough.

### 8.1 Trigger

A citizen (Tunde, often during J4 or independently) wants to upload a piece of evidence (screenshot, photo, video, document, audio).

### 8.2 Pre-conditions

- User is logged in
- User is VERIFIED
- User has the file on their device

### 8.3 Steps

1. **User clicks "Upload evidence"** from a case page or the evidence section.
2. **User selects the file** (drag-and-drop or file picker).
3. **System computes the SHA-256 hash** and shows the file's hash and timestamp immediately.
4. **System checks the file type** and applies the appropriate pipeline:
   - **Image / video:** runs the AI detection pipeline (§4 below)
   - **Audio / document:** integrity check only; no AI detection (per [PLATFORM.md §4.3.2](../PLATFORM.md#432-scope))
5. **System displays the integrity status** (Verified) and, for image/video, the AI detection status (Low / Medium / High confidence).
6. **For High-confidence AI flags,** the file is held in pending state for moderator review. The user is told why and how long the review is expected to take.
7. **For Low / Medium flags,** the file is uploaded and the user sees both statuses with clear language:
   - Integrity: "This file is verified. It has not been changed since you uploaded it."
   - AI detection: "This file was/was not flagged for AI manipulation. This is an automated check, not a definitive verdict."
8. **User can add context** (case association, description, tags).
9. **File is stored** with hash, timestamp, uploader, and AI detection results.
10. **Audit log entry created.**

### 8.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| Associate the file with a case | Yes / No | Yes (if user has an active case) |
| Appeal a High AI flag | Yes / No | Available after moderator review |
| Add context (description, tags) | Optional | Not required |

### 8.5 Failure modes

| Failure | What the user sees | What the system does |
|---------|---------------------|----------------------|
| File too large | "Files must be under [X] MB. Try a smaller file or contact support." | Returns 413; no upload |
| Unsupported file type | "We support images (JPG, PNG, WebP), video (MP4, AVI, WebM), audio (MP3, WAV, M4A), and documents (PDF, DOCX, TXT)." | Returns 415; no upload |
| AI detection API failure | "AI detection is temporarily unavailable. Your file is still verified for integrity." | Caches failure; integrity check still applies; user can appeal later |
| High AI confidence flag | "Your file is being reviewed by a moderator. This usually takes [X] hours." | File held; user notified of review outcome |
| User tries to upload another's personal data | "Please only upload evidence related to your case. Don't share other people's private information." | Soft warning; not blocked (user is responsible) |

### 8.6 Success criteria

- User can upload a 10MB file in ≤ 5 seconds on a typical connection
- Integrity status is shown immediately
- AI detection status is shown for image/video
- High-confidence flags are reviewed before becoming visible
- User clearly understands the distinction between integrity (cryptographic) and AI detection (probabilistic)

### 8.7 Post-conditions

- File is stored with hash, timestamp, uploader
- Hash is cached in SQLite for fast re-verification
- AI detection results are stored with model version
- Audit log entry created
- File is visible to the uploader and (if associated with a case) to the matched lawyer

### 8.8 Out of scope (pilot)

- Bulk upload
- Folder organization
- File preview beyond basic thumbnails
- In-platform document signing
- Re-encryption or key rotation (deferred to Year 2; AES-256 with platform-managed keys is the pilot standard)

---

## 9. J7 — Moderator publishes a poll

### 9.1 Trigger

A poll topic is suggested (by a citizen, an NGO, or the Advisory Board) and a moderator (Kemi) is assigned to draft, review, and publish it.

### 9.2 Pre-conditions

- Moderator is logged in with the MODERATOR role
- The poll topic has been approved for drafting (by the Advisory Board or a senior moderator)

### 9.3 Steps

1. **Moderator opens the poll draft form** (in admin section).
2. **Moderator fills in:** title, summary, question, options, jurisdiction, start date, end date, official context link.
3. **System validates** the draft (Zod schema, question length, option count).
4. **Moderator submits the draft for Advisory Board review.**
5. **Advisory Board reviews** (asynchronously; notification + 7-day SLA).
6a. **Advisory Board approves.** Draft becomes eligible for publication.
6b. **Advisory Board requests changes.** Draft goes back to moderator with feedback.
7. **Moderator publishes the poll.** It becomes visible in the polls list with a clear "voting opens [date]" state.
8. **On the start date,** the poll becomes active and verified citizens in the jurisdiction can vote.
9. **On the end date,** voting closes, results are computed and cached.

### 9.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| Question type | Binary, multi-choice, scale | Binary (simplest) |
| Number of options | 2–5 | 2 (Yes/No) or 3 (Yes/No/Unsure) |
| Polling window | Custom | 7 days |

### 9.5 Failure modes

| Failure | What the moderator sees | What the system does |
|---------|--------------------------|----------------------|
| Advisory Board doesn't respond in 7 days | Poll draft is auto-flagged for senior moderator review | — |
| Question contains flagged language | Form highlights the issue | Doesn't block, but flags for AB review |
| Already a similar poll in window | "There's already a poll on this topic in this window. Consider editing it instead." | Warning, not block |

### 9.6 Success criteria

- Poll is drafted in ≤ 30 minutes
- AB review completes in ≤ 7 days
- Poll goes live on its start date
- Results are computed within 48 hours of close (per [PLATFORM.md §9.2.3](../PLATFORM.md#923-result-publication))

### 9.7 Post-conditions

- Poll exists in DB with status (DRAFT, IN_REVIEW, APPROVED, ACTIVE, CLOSED)
- Once active, verified citizens in the jurisdiction can vote
- Audit log entries for each state transition

### 9.8 Out of scope (pilot)

- Multi-language polls
- Conditional / branching questions
- Citizen-suggested poll topics going directly to the queue (they go through a senior moderator first)

---

## 10. J8 — User appeals a moderation decision

### 10.1 Trigger

A user (Tunde or Amara) has had content removed, a flag upheld, or an account action taken, and wants to appeal.

### 10.2 Pre-conditions

- User is logged in
- User has received a moderation notification within the last 30 days
- The decision is appealable (most are; see [PLATFORM.md §8.3.3](../PLATFORM.md#833-appealable-decisions))

### 10.3 Steps

1. **User sees the moderation notification** in their account or via email.
2. **User clicks "Appeal this decision"** in the notification or the relevant content's page.
3. **User sees the original decision** (what was flagged, why, by whom).
4. **User writes their appeal** (free text, ≤ 1000 characters).
5. **User submits the appeal.** System creates an appeal record and adds it to the moderation queue with a higher priority.
6. **A senior moderator (not the original reviewer) reviews** within 72 hours.
7a. **Appeal upheld.** Original decision is reversed. User is notified. Audit log updated.
7b. **Appeal denied.** User is notified with a reason. If the original action was a suspension, the suspension continues.
8. **User can request escalation to the Grievance Committee** for one final review (only for account-level decisions, not content removal).

### 10.4 Decision points

| Decision | Options | Default |
|----------|---------|---------|
| Submit appeal | Yes / No | Available for 30 days after the original decision |
| Request Grievance Committee escalation | Yes / No | Only for account-level decisions |

### 10.5 Failure modes

| Failure | What the user sees | What the system does |
|---------|---------------------|----------------------|
| Appeal window has passed (30 days) | "The appeal window for this decision has closed." | Returns 422; no appeal allowed |
| Same user repeatedly appeals similar decisions | "We've reviewed similar appeals from you. Please contact support if you have new information." | Returns 422 after a threshold |

### 10.6 Success criteria

- User can submit an appeal in ≤ 5 minutes
- Appeal is reviewed by a different moderator than the original
- User gets a clear decision within 72 hours
- Audit log captures the full appeal chain

### 10.7 Post-conditions

- Appeal record exists
- Decision is either upheld or reversed
- Audit log updated

### 10.8 Out of scope (pilot)

- Public appeals dashboard
- Group appeals (multiple users appealing the same content)
- Appeals via the API (web only in pilot)

---

## 11. Cross-Journey Principles

These principles apply to all journeys and are not repeated in each one.

### 11.1 Non-Binding Disclaimer

The non-binding disclaimer appears:

- On every poll results page (prominent)
- On every confidence vote results page (prominent)
- During onboarding (introduced, not buried)
- In every user-facing communication that mentions polls

This is not a UX nicety; it is a legal and reputational requirement. The persona of Amara specifically fears identification of her vote, and the disclaimer is part of the trust contract with her.

### 11.2 Privacy

- Votes are stored in a way that cannot be tied back to a user beyond the eligibility check
- Identity verification results are cached for 30 days, not indefinitely
- Users can request a DSAR at any time
- Users can request account deletion at any time (with a 30-day grace period for recovery)

### 11.3 Performance

- Every action in every journey has a target response time
- The platform commits to uptime ≥ 99.5% in the pilot

### 11.4 Accessibility

- Every journey must be navigable by keyboard alone
- Every journey must be screen-reader friendly
- Color is never the only signal (e.g., red/green must be paired with text)

### 11.5 Auditability

- Every state-changing action creates an audit log entry
- The audit log is queryable by admins and reviewable by the Board

---

## 12. Journey-to-Module Map

This is the operational view. It maps each journey to the modules that implement it. Modules will be specified in Phase 3.

| Journey | Modules involved |
|---------|------------------|
| J1 | Identity, Auth, Users |
| J2 | Polls, Auth, RBAC |
| J3 | Officials, Polls, RBAC |
| J4 | Lawyer Matching, Cases, Evidence, Consultations |
| J5 | Lawyer Onboarding, Bar Verification, Auth, RBAC |
| J6 | Evidence, Deepfake Detection, RBAC, Audit |
| J7 | Polls, Advisory Board, RBAC |
| J8 | Moderation, Appeals, RBAC, Audit |

---

## 13. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the actual conversion rate from registration to verified (will inform the funnel targets in §3.6)? | Product Lead | Open — pre-pilot research |
| 2 | What is the right consultation duration — 15 or 20 minutes? | Operations | Open — pilot data |
| 3 | Should the lawyer see the citizen's identity before accepting a match? | Product Lead + Legal | Open — recommend no for pilot |
| 4 | How do we handle a lawyer's profile if their bar license lapses during the pilot? | Legal | Open — pre-pilot decision |
| 5 | What is the appeal SLA for account-level decisions? | Moderation Lead | Open — propose 72h |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md).

---

## Appendix A: Glossary
- **AB** — Advisory Board
- **DSAR** — Data Subject Access Request
- **LGA** — Local Government Area
- **NBA** — Nigerian Bar Association
- **NDPR** — Nigeria Data Protection Regulation
- **NIN** — National Identification Number
- **NVS** — National Verification Service (NIMC)

## Appendix B: References
- [PRD.md §6.1 — Key User Flows](./PRD.md#61-key-user-flows)
- [Personas.md](./Personas.md)
- [UX & Design.md](./UX%20%26%20Design.md)
- [PLATFORM.md](../PLATFORM.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)

## Appendix C: User Journeys Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Product Lead | Initial draft. Eight journeys: five pilot-critical (J1–J5) plus three supporting (J6–J8). Standard format applied to each. |