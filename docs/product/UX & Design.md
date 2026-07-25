# UX & Design — Najia Community Bridge

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Design Lead*
*Reviewers: Product Lead, Engineering Lead, Accessibility Reviewer (TBD), Content Lead*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Establishes design principles, information architecture, screen inventory, design system foundations, and wireframe conventions. Visual design system and high-fidelity mockups deferred to v1.1 once the wireframes are validated with pilot users.

> **How to read this document:** This is the **operational design reference** for the Lagos pilot. It collects the design principles, screen inventory, component patterns, and accessibility rules that the design and engineering teams will use to build the product. It does not contain high-fidelity visual mockups in v1.0.0 — those come in v1.1 once the wireframes have been validated with pilot users. The strategic UX principles (trust, non-binding framing, etc.) live in [PLATFORM.md §15](../PLATFORM.md#15-user-experience-principles); this document operationalizes them.

> **Related documents:**
> - [PLATFORM.md §15 — User Experience Principles](../PLATFORM.md#15-user-experience-principles) — strategic UX principles
> - [PRD.md §6 — User Experience](./PRD.md#6-user-experience) — UX requirements for the pilot
> - [Personas.md](./Personas.md) — user archetypes
> - [User Journeys.md](./User%20Journeys.md) — end-to-end flows
> - [ARCHITECTURE.md](../ARCHITECTURE.md) — technical constraints that affect design

---

## 1. Design Principles

These are the **operational** design principles for the pilot. They translate the strategic principles in PLATFORM.md §15 into rules the design and engineering teams apply in every screen, component, and interaction.

### 1.1 Trust First

Trust is the binding constraint for the platform. Every design decision should answer: **does this build or erode trust?**

| Application | What this looks like |
|-------------|----------------------|
| Non-binding disclaimer | Visible on every poll and confidence vote page, in the onboarding flow, and in any user-facing communication that mentions polls. Not in the footer. |
| Identity verification status | Always shown clearly. Never hidden, never ambiguous. |
| Data handling | Plain-language explanations of what data is collected, why, and how long it's kept. No legalese. |
| Moderation | Users are told why their content was flagged or removed, in plain language, with an appeal path. |
| Errors | Honest. "We can't reach the verification service right now" is better than a generic "Something went wrong." |

### 1.2 Accessibility by Default

Accessibility is not a layer added at the end. It is a constraint at the start of every design decision.

| Application | Standard |
|-------------|----------|
| Reading level | Secondary education. Avoid jargon, define terms inline. |
| Color contrast | WCAG 2.1 AA. Never rely on color alone. |
| Keyboard navigation | Every interactive element must be reachable and operable by keyboard alone. |
| Screen reader | Every interactive element must have an accessible name. Every form must have labels. Every error must be announced. |
| Text size | Body text ≥ 16px on mobile, ≥ 18px on desktop. |
| Touch targets | ≥ 44x44px on mobile. |
| Captions / transcripts | Required for any video content. |

### 1.3 Mobile-First, Low-Bandwidth Aware

Most pilot users will be on mid-range Android phones over 4G with intermittent connectivity. The design must work in these conditions.

| Application | Standard |
|-------------|----------|
| Initial page weight | ≤ 200KB gzipped for the home page |
| Time to interactive | ≤ 3 seconds on 4G (slow 4G, not fast 4G) |
| Image optimization | WebP preferred, lazy-loaded, with size hints |
| Offline support | At minimum, the user can read previously-loaded content offline. Voting and evidence upload require connectivity but show a clear offline state. |
| Data usage | Show data usage hints on upload screens (e.g., "This will use ~5MB") |

### 1.4 Clear Separation of Concerns

The platform is three pillars, plus a foundation (identity). The design must make these legible without making them feel like three separate products.

| Application | What this looks like |
|-------------|----------------------|
| Navigation | The three pillars are visible as primary nav items. The foundation (identity, profile) is in a secondary area (avatar menu). |
| Cross-pillar features | When a feature crosses pillars (e.g., evidence upload from a case page), the primary action is in context but the pillar context is preserved. |
| The non-binding disclaimer | Appears in every civic context, never outside of one. (We don't want to imply that evidence or lawyer services are non-binding — they aren't.) |

### 1.5 Respect the User's Time

The user is busy and may not be back tomorrow. Every flow is designed to be completable in one sitting, with clear progress and clear recovery.

| Application | Standard |
|-------------|----------|
| Onboarding | ≤ 5 steps from landing to first action |
| Voting | ≤ 2 minutes from poll landing to vote submission |
| Evidence upload | ≤ 5 seconds for a 10MB file on 4G |
| Lawyer match | ≤ 10 seconds from intake submit to match results |
| Recovery | User can resume any flow within 7 days without losing progress |

### 1.6 Honest About Limitations

The platform does not pretend to be something it isn't. The design makes the platform's role, scope, and limitations visible.

| Application | What this looks like |
|-------------|----------------------|
| We are not a court | Stated in onboarding, in the lawyer section, in any place where a user might confuse the platform with adjudication. |
| Polls are non-binding | Stated on every poll page, in the results, in any communication. |
| AI detection is probabilistic | Stated in the evidence section, on every detection result. |
| The platform is not free of cost to operate | The cost is borne by grants, lawyer listings, and government poll fees — explained in the transparency report, not in the product UI. |

---

## 2. Information Architecture

### 2.1 Primary Navigation

The web app and mobile app share the same IA. The primary navigation is five items:

| Nav item | Pillar | Audience | Login required |
|----------|--------|----------|----------------|
| **Home** | Cross-pillar | All | No |
| **Polls** | 1 — Civic engagement | All (view), verified (vote) | Partial |
| **Evidence** | 2 — Evidence integrity | Verified | Yes |
| **Lawyers** | 3 — Lawyer marketplace | All (view), verified (match) | Partial |
| **Blog** | Educational | All | No |

A secondary "Me" menu (avatar icon) contains: profile, verification status, settings, sign out.

The admin/moderator navigation is a separate shell (different URL prefix) and is not part of the user-facing IA.

### 2.2 Site Map
/ Home
/polls Polls list
/polls/:pollId Poll detail (vote + results)
/polls/confidence Confidence votes list
/polls/confidence/:officialId Official detail (vote + results)
/evidence My evidence (verified users)
/evidence/:evidenceId Evidence detail (with verification status)
/evidence/upload Upload flow
/lawyers Lawyer directory
/lawyers/:lawyerId Lawyer profile
/lawyers/match Intake form → match results
/lawyers/:lawyerId/schedule Free consultation scheduling
/blog Blog home
/blog/category/:category Category page
/blog/:slug Blog post
/learn Legal literacy modules
/learn/:slug Module detail
/me Profile
/me/settings Settings
/me/verification Identity verification status
/auth/login Login
/auth/register Register
/auth/verify Identity verification flow
/admin/* Admin shell (RBAC-protected)

text


The `/admin/*` shell is a separate visual and navigation system. Users who have admin/moderator roles see a "Switch to admin" link in the avatar menu; clicking it swaps the entire shell.

### 2.3 The Non-Binding Disclaimer — Where It Lives

| Location | Format | Notes |
|----------|--------|-------|
| Onboarding (first poll encounter) | Banner with prominent icon | Introduced, not buried |
| Every poll results page | Banner above the results | Not in the footer |
| Every confidence vote results page | Banner above the results | Not in the footer |
| Poll detail page (pre-vote) | Inline above the vote options | Before the user commits |
| Confidence vote detail page (pre-vote) | Inline above the vote options | Before the user commits |
| Newsletter and any user comms mentioning polls | Banner or callout | Standardized language |
| About page | Section | Long-form explanation |

The standard language is: **"This is citizen sentiment only. It has no legal or electoral weight."** Variations require Design Lead approval and are tracked in the design system changelog.

### 2.4 Where the AI Detection Disclaimer Lives

| Location | Format |
|----------|--------|
| Evidence upload result (Medium confidence) | Inline with the result, with link to "What does this mean?" |
| Evidence upload result (High confidence) | Inline with the result, prominent, with explanation of moderator review |
| Evidence detail page | Below the AI detection status, with link to the full explanation |
| Help center article | Long-form explanation of how AI detection works and its limits |

The standard language is: **"This is an automated check, not a definitive verdict."** Variations require Design Lead approval.

---

## 3. Screen Inventory (Pilot)

The pilot has the following screen categories. The full screen-by-screen wireframe inventory is in `docs/wireframes/` (forthcoming). This section gives the design and engineering teams a one-page reference of what exists and what's in scope.

| # | Screen | Persona | Journey | Login | Verified |
|---|--------|---------|---------|-------|----------|
| 1 | Home (logged out) | All | — | No | No |
| 2 | Home (logged in, verified) | Amara, Tunde | — | Yes | Yes |
| 3 | Home (logged in, unverified) | All | J1 | Yes | No |
| 4 | Registration | All | J1 | No | No |
| 5 | Login | All | — | No | No |
| 6 | Email verification | All | J1 | Yes | No |
| 7 | Identity verification choice | All | J1 | Yes | No |
| 8 | NIMC verification | All | J1 | Yes | No |
| 9 | Onfido verification | All | J1 | Yes | No |
| 10 | "You're verified" success | All | J1 | Yes | Yes |
| 11 | Polls list | All | J2 | No | No |
| 12 | Poll detail (pre-vote) | Amara | J2 | Yes | Yes |
| 13 | Vote submitted confirmation | Amara | J2 | Yes | Yes |
| 14 | Poll results | All | J2 | No | No |
| 15 | Confidence votes list | All | J3 | No | No |
| 16 | Official detail (pre-vote) | Amara | J3 | Yes | Yes |
| 17 | Confidence vote results | All | J3 | No | No |
| 18 | Suggest a poll topic | Amara | J2 | Yes | Yes |
| 19 | Evidence home (my evidence) | Tunde | J6 | Yes | Yes |
| 20 | Evidence upload | Tunde | J6 | Yes | Yes |
| 21 | Evidence detail (with verification status) | Tunde | J6 | Yes | Yes |
| 22 | Evidence appeal | Tunde | J6 | Yes | Yes |
| 23 | Lawyer directory | All | J4 | No | No |
| 24 | Lawyer profile | All | J4 | No | No |
| 25 | Lawyer intake form | Tunde | J4 | Yes | Yes |
| 26 | Match results | Tunde | J4 | Yes | Yes |
| 27 | Schedule consultation | Tunde | J4 | Yes | Yes |
| 28 | Consultation (video/audio/chat) | Tunde, Ngozi | J4 | Yes | Yes |
| 29 | Post-consultation rating | Tunde | J4 | Yes | Yes |
| 30 | Lawyer registration | Ngozi | J5 | No | No |
| 31 | Lawyer profile editor | Ngozi | J5 | Yes | Yes |
| 32 | Lawyer subscription tier selection | Ngozi | J5 | Yes | Yes |
| 33 | Lawyer match notification | Ngozi | J5 | Yes | Yes |
| 34 | Lawyer match accept/decline | Ngozi | J5 | Yes | Yes |
| 35 | Blog home | All | — | No | No |
| 36 | Blog category | All | — | No | No |
| 37 | Blog post | All | — | No | No |
| 38 | Legal literacy module home | All | — | No | No |
| 39 | Legal literacy module detail | All | — | No | No |
| 40 | Legal literacy quiz | All | — | Yes | No (but recommended) |
| 41 | Profile | All | — | Yes | Yes |
| 42 | Settings | All | — | Yes | Yes |
| 43 | Verification status | All | J1 | Yes | No |
| 44 | Moderation notification | Amara, Tunde | J8 | Yes | Yes |
| 45 | Appeal form | Amara, Tunde | J8 | Yes | Yes |
| 46 | Moderation queue (admin) | Kemi | J7 | Yes | Yes (staff) |
| 47 | Poll draft editor (admin) | Kemi | J7 | Yes | Yes (staff) |
| 48 | Admin dashboard | Admin | — | Yes | Yes (staff) |
| 49 | User management (admin) | Admin | — | Yes | Yes (staff) |
| 50 | Lawyer verification (admin) | Admin | J5 | Yes | Yes (staff) |

**Pilot scope:** 50 screens. This is the design team's commitment for v1.0.0. New screens require a PRD amendment.

### 3.1 Out of Scope (Pilot Screens)

- USSD interface
- Native language UI variants
- Government dashboard
- Public API console
- Premium verification checkout
- Sponsored content management

---

## 4. Design System Foundations

The design system is in `app/components/ui/` (shadcn/ui based). The foundations are defined here; the components are built in code, not in this document.

### 4.1 Color

The color system is built for trust, accessibility, and the non-binding framing.

| Token | Use | Notes |
|-------|-----|-------|
| `brand.primary` | Primary CTAs, key accents | Calibrated for AA contrast on both white and dark surfaces |
| `brand.secondary` | Secondary actions, supportive elements | |
| `surface.default` | Page background | |
| `surface.elevated` | Cards, modals | |
| `surface.muted` | Disabled states, placeholders | |
| `text.primary` | Body text | WCAG AA on `surface.default` |
| `text.secondary` | Captions, helper text | WCAG AA on `surface.default` |
| `text.inverse` | Text on dark surfaces | |
| `status.success` | Verified, passed | Paired with text and/or icon (never color alone) |
| `status.warning` | Medium AI confidence, in-progress | Paired with text and/or icon |
| `status.danger` | Not verified, failed | Paired with text and/or icon |
| `status.info` | Neutral informational | |

The non-binding disclaimer uses a distinct `advisory` color (a muted amber, not a warning red) to avoid implying that the user has done something wrong. It is paired with an information icon and the standard text.

### 4.2 Typography

| Token | Use | Size | Weight |
|-------|-----|------|--------|
| `text.display` | Hero headlines, top of landing page | 36–48px | 700 |
| `text.h1` | Page titles | 28–32px | 700 |
| `text.h2` | Section headers | 22–24px | 600 |
| `text.h3` | Card titles | 18–20px | 600 |
| `text.body` | Body text | 16–18px | 400 |
| `text.small` | Captions, helper text | 14px | 400 |
| `text.disclaimer` | Non-binding, AI detection disclaimers | 14–16px | 500, paired with icon |

Body text is ≥ 16px on mobile and ≥ 18px on desktop. The `text.disclaimer` token is reserved for the non-binding disclaimer and AI detection warnings. Its use outside these contexts requires Design Lead approval.

### 4.3 Iconography

Icons are paired with text wherever a concept is important (verification status, AI detection status, non-binding, moderation actions). Color-only signals are never used.

Standard icons:

| Concept | Icon | Notes |
|---------|------|-------|
| Verified integrity | Shield with checkmark | |
| Not verified integrity | Shield with X | |
| AI detection Low | Shield with check | Distinct from verified |
| AI detection Medium | Shield with question | |
| AI detection High | Shield with warning | |
| Non-binding | Information circle | Always paired with the disclaimer text |
| Appeal | Gavel | |
| Moderation | Eye | |

### 4.4 Spacing and Layout

| Token | Value | Use |
|-------|-------|-----|
| `space.1` | 4px | Tightest |
| `space.2` | 8px | Inline |
| `space.3` | 12px | Within components |
| `space.4` | 16px | Between components |
| `space.6` | 24px | Between sections |
| `space.8` | 32px | Between page sections |
| `space.12` | 48px | Page-level padding |

Mobile layout uses 16px outer padding. Desktop layout uses a 12-column grid with 24px gutters, max content width 1200px.

### 4.5 Components (Pilot Set)

The pilot uses a constrained set of components to keep the design system small and the implementation fast.

| Component | Notes |
|-----------|-------|
| Button | Primary, secondary, tertiary, danger, disabled. Each has a default and a loading state. |
| Form field | Label, input, helper text, error message. All required. |
| Select | Native on mobile, custom on desktop. |
| Checkbox / radio | Paired with label text. |
| Card | Used for poll cards, lawyer cards, blog post cards, evidence cards. |
| Modal | For confirmations, lawyer profile previews, errors that need acknowledgment. |
| Toast | For non-blocking success/error notifications. |
| Banner | For the non-binding disclaimer, AI detection results, and important system messages. |
| Tabs | For poll results breakdown, lawyer profile sections, blog post sections. |
| Avatar | For users, lawyers, blog authors. |
| Badge | For verification status, role indicators, content tags. |

The components are shadcn/ui-based. Customizations are documented in `app/components/ui/CUSTOMIZATIONS.md` (forthcoming).

---

## 5. Wireframe Conventions

Wireframes for the 50 pilot screens live in `docs/wireframes/` (forthcoming). The conventions:

- Wireframes are low-fidelity, grayscale, in Figma
- Each wireframe has a one-line purpose statement
- Each wireframe shows all states: default, loading, error, empty
- Each wireframe is annotated with the persona, journey, and RBAC role
- Each wireframe has accessibility notes (focus order, screen reader text, contrast)
- Wireframes are reviewed by the Product Lead, Engineering Lead, and an accessibility reviewer (when available) before high-fidelity design

The v1.0.0 of this document does not include wireframes. They will be added as `docs/wireframes/*.fig` files and linked from this document in v1.1.

### 5.1 Annotated Example: Poll Results (Screen #14)

A representative example to make the conventions concrete:

> **Screen:** Poll results
> **Persona:** Amara (also Bola, Femi)
> **Journey:** J2
> **RBAC role:** Any
> **Purpose:** Show aggregated poll results with prominent non-binding disclaimer.
> **Focus order:** 1) Non-binding banner, 2) Poll title, 3) Summary, 4) Results chart, 5) Confidence interval, 6) Trend vs. previous (if any), 7) Share button (if any).
> **Screen reader text:** "Poll results for [poll title]. This is citizen sentiment only. It has no legal or electoral weight. [X] percent voted [option]. [Y] percent voted [option]. Confidence interval [Z] percent."
> **States:** Default (with results), default (without results — poll still in progress, no results shown), error (results failed to load), empty (poll closed with no votes — shows "Insufficient data" rather than zeros).

---

## 6. Interaction Patterns

These are the recurring interaction patterns the design and engineering teams apply consistently. Each is a short rule, not a full spec — the full implementation is in the components.

### 6.1 Forms

- One column on mobile, two on desktop (label above input)
- Labels are always visible (no floating labels)
- Required fields are marked, not just blocked on submit
- Errors are inline, immediately below the field, with the field highlighted
- Submit button is disabled until the form is valid (or shows validation on click — pick one per form and stick to it)
- Submit shows a loading state immediately (no double-clicks)
- On success, redirect to the next step or show confirmation
- On error, preserve the user's input

### 6.2 Loading

- Every async action shows a loading state within 100ms
- Skeleton screens for content; spinners for actions
- Long operations (> 2 seconds) show progress with estimated time
- The user can always cancel an in-progress action

### 6.3 Errors

- Errors are honest and specific
- Errors are recoverable: tell the user what to do next
- Errors are not alarming: use the right severity level
- Errors are logged for the engineering team but not displayed in the UI

### 6.4 Empty States

- Empty states explain what should be here and how to get there
- Empty states are not decorative; they are a CTA
- Empty states for moderation queues explain the queue is healthy and current

### 6.5 Notifications

- Toasts for non-blocking success/error
- Banners for important system messages
- Email for time-sensitive, asynchronous events
- Push notifications are out of scope for the pilot

### 6.6 Modals vs. Pages

- Confirmations and short forms: modal
- Anything that should be linkable, bookmarkable, or back-button-able: page
- Modals can be dismissed with the Escape key and by clicking outside

---

## 7. Accessibility Requirements (Operational)

The platform commits to WCAG 2.1 AA. The PRD §5 lists the high-level targets. This section gives the design and engineering teams the operational rules.

### 7.1 Per-Screen Accessibility Checklist

Every screen in the pilot must pass:

- [ ] All interactive elements reachable by keyboard
- [ ] All interactive elements have accessible names
- [ ] All form fields have labels
- [ ] All errors are announced to screen readers
- [ ] All images have alt text (or are decorative, marked as such)
- [ ] All text meets WCAG AA contrast
- [ ] Focus is visible at all times
- [ ] The page has a logical heading hierarchy
- [ ] The page has a descriptive `<title>` and meta description
- [ ] No content relies on color alone

### 7.2 Specific Patterns

| Pattern | Rule |
|---------|------|
| Modals | Focus is trapped inside; closing returns focus to the trigger |
| Tabs | Arrow keys move between tabs; Tab moves to the panel |
| Carousels | (Not used in pilot) |
| Form errors | First error receives focus on submit; subsequent errors reachable by Tab |
| Dynamic content | ARIA live regions for status changes |
| Custom controls | Built on semantic HTML or with proper ARIA roles |

### 7.3 Accessibility Review Process

- Every screen is reviewed by the Design Lead and Engineering Lead for accessibility
- An external accessibility review is conducted before pilot launch (PRD §7.3)
- Accessibility is tested with keyboard-only navigation, screen reader (NVDA on Windows, VoiceOver on iOS), and the axe-core automated tool
- Findings are tracked in the same issue tracker as other bugs, with the label `a11y`

---

## 8. Content Design

The blog and legal literacy modules are content-heavy. The design team's role is to make the content legible and the platform a pleasure to read.

### 8.1 Reading Experience

- Body text 18px on mobile, 18–20px on desktop
- Line height 1.6
- Max line length 70 characters
- Generous paragraph spacing
- Pull quotes, images, and callouts break up long text
- Reading time and progress indicator at the top of each post
- Text-to-speech support (browser-native)

### 8.2 Tone and Voice

The platform has a consistent voice:

- **Clear** — plain language, no jargon
- **Calm** — not breathless, not dramatic
- **Honest** — admits limitations
- **Respectful** — treats the reader as an adult
- **Neutral** — for political and policy content

Voice rules for specific contexts:

| Context | Voice rule |
|---------|------------|
| Polls and confidence votes | Neutral, factual. No framing that could be read as advocacy. |
| Legal content | Plain language with terms defined inline. Sources cited. |
| Error messages | Apologetic only when we are at fault. Otherwise neutral and actionable. |
| Marketing copy | Warm but not salesy. The platform is not selling anything to citizens. |
| Privacy and data | Plain language. "We collect [X] to [do Y]. We delete it after [Z]." |
| The non-binding disclaimer | Standardized language only. See §2.3. |

### 8.3 Translation and Local Language

Out of scope for the pilot. The design system must, however, accommodate languages that may be added in Year 2:

- Sufficient horizontal space for text expansion (some languages expand 30–40%)
- Font fallback stack that includes Nigerian language support
- No text in images (all UI text is real text)

---

## 9. Design QA and Review

### 9.1 Design Review Cadence

| Review | Frequency | Audience | Output |
|--------|-----------|----------|--------|
| Wireframe review | Per screen, before high-fi | Product, Engineering, Accessibility | Figma comments, sign-off |
| High-fidelity design review | Per screen, before implementation | Product, Engineering | Figma comments, sign-off |
| Pilot launch review | Once, before pilot | Project Sponsor, all leads | Sign-off on all 50 screens |
| Post-pilot design review | Once, after pilot | Product, Design, Engineering | Lessons learned, v1.1 plan |

### 9.2 Design Debt and Updates

Design changes during the pilot are tracked in the design system changelog (`app/components/ui/CHANGELOG.md`, forthcoming). Material changes that affect user-facing behavior require a Decision Log entry.

### 9.3 The "Amara Test"

Before any design is considered pilot-ready, it must pass the Amara test: **Would Amara understand the non-binding nature of the platform, see the verification status clearly, and feel safe voting?** If the answer to any of these is no, the design is not ready.

This is a quality bar, not a process step. Any team member can block a design by invoking the Amara test, and the Design Lead has the final say on whether the test is satisfied.

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Who is the external accessibility reviewer? | Project Lead | Open — needs to be contracted |
| 2 | Should the home page show poll results to non-verified users? | Product Lead | Open — recommend yes for trust |
| 3 | What is the right word for "case" in the user-facing UI? (Case, matter, dispute, issue?) | Design Lead | Open — needs user research |
| 4 | Should the lawyer match intake be a modal or a page? | Design Lead | Open — recommend page for shareability |
| 5 | Is the "switch to admin" link discoverable enough for moderators? | Design Lead | Open — test in pilot |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md).

---

## Appendix A: Glossary
- **AA** — WCAG 2.1 Level AA contrast standard
- **DSAR** — Data Subject Access Request
- **IA** — Information Architecture
- **LGA** — Local Government Area
- **WCAG** — Web Content Accessibility Guidelines

## Appendix B: References
- [PLATFORM.md §15 — User Experience Principles](../PLATFORM.md#15-user-experience-principles)
- [PRD.md §6 — User Experience](./PRD.md#6-user-experience)
- [Personas.md](./Personas.md)
- [User Journeys.md](./User%20Journeys.md)
- [ARCHITECTURE.md §15 — Error Handling](../ARCHITECTURE.md#15-error-handling) (for error message patterns)
- WCAG 2.1 AA — https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa

## Appendix C: UX & Design Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Design Lead | Initial draft. Establishes operational design principles, IA, 50-screen inventory, design system foundations, and the Amara test. Wireframes deferred to v1.1. |