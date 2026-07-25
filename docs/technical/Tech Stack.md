# Tech Stack

_Document Version: 1.0.0_
_Last Updated: 2026-07-20_
_Status: Active_
_Owner: Engineering Lead_

> **Changelog:**
>
> - 1.0.0 (2026-07-20) — Initial set. Quick-reference extraction from ARCHITECTURE.md §1.3 and §1.4, with rationale, version, and alternatives for each choice.

> **How to read this document:** This is the **quick-reference cheat sheet** for the platform's technology stack. It points to [ARCHITECTURE.md §1.3 and §1.4](../ARCHITECTURE.md#13-technology-stack-summary) for the full discussion. For the "why" behind each decision, see the corresponding [ADR](../ADRs.md).

> **Related documents:**
>
> - [ARCHITECTURE.md §1.3](../ARCHITECTURE.md#13-technology-stack-summary) — the full stack table
> - [ARCHITECTURE.md §1.4](../ARCHITECTURE.md#14-key-technical-decisions) — the key decisions and rationale
> - [ADRs.md](../ADRs.md) — the architectural decision records
> - [Engineering.md §A](./Engineering.md#appendix-a-tools-and-versions) — the full tool list with versions

---

## 1. Stack at a Glance

| Layer                     | Technology                           | Version     | ADR                                                                              |
| ------------------------- | ------------------------------------ | ----------- | -------------------------------------------------------------------------------- |
| **Runtime**               | Bun                                  | 1.0+        | [ADR-001](../ADRs.md#adr-001--bun-as-the-runtime)                                |
| **Web framework**         | TanStack Start                       | Latest      | [ADR-002](../ADRs.md#adr-002--tanstack-start--hono-as-the-web-and-api-framework) |
| **API framework**         | Hono                                 | Latest      | [ADR-002](../ADRs.md#adr-002--tanstack-start--hono-as-the-web-and-api-framework) |
| **Mobile**                | React Native + Expo                  | 0.72+ / 50+ | (No ADR; follows web stack)                                                      |
| **ORM**                   | Drizzle ORM                          | Latest      | [ADR-005](../ADRs.md#adr-005--drizzle-orm-as-the-database-orm)                   |
| **Primary DB**            | PostgreSQL                           | 14+         | [ADR-003](../ADRs.md#adr-003--postgresql-as-the-primary-database)                |
| **Cache store**           | SQLite (via `bun:sql`)               | 3+          | [ADR-004](../ADRs.md#adr-004--sqlite-for-cache-and-rate-limiting)                |
| **Rate limit store**      | SQLite (via `bun:sql`)               | 3+          | [ADR-004](../ADRs.md#adr-004--sqlite-for-cache-and-rate-limiting)                |
| **State management**      | TanStack Query + Zustand             | Latest      | (No ADR; standard)                                                               |
| **UI library**            | Tailwind CSS + shadcn/ui             | Latest      | (No ADR; standard)                                                               |
| **Forms**                 | TanStack Form                        | Latest      | (No ADR; standard)                                                               |
| **Validation**            | Zod                                  | Latest      | (No ADR; standard)                                                               |
| **RBAC**                  | CASL                                 | Latest      | [ADR-006](../ADRs.md#adr-006--casl-as-the-rbac-library)                          |
| **File storage**          | Cloudflare R2 / Bunny CDN / ImageKit | —           | (ADR forthcoming)                                                                |
| **Identity verification** | NIMC NVS API + Onfido                | —           | (No ADR; required by NGA)                                                        |
| **Payments**              | Paystack                             | —           | (No ADR; required by NGA market)                                                 |
| **Realtime**              | WebSockets                           | —           | (No ADR; standard)                                                               |
| **Content format**        | MDX                                  | 2.0+        | (No ADR; standard)                                                               |
| **Hosting**               | Self-hosted VPS behind WireGuard VPN | —           | [ADR-008](../ADRs.md#adr-008--self-hosted-vps-behind-wireguard-vpn)              |
| **Email**                 | Nodemailer                           | Latest      | (ADR forthcoming)                                                                |

---

## 2. Layer-by-Layer

For each layer: what we chose, why, version, alternatives, and where it's documented in detail.

### 2.1 Runtime — Bun

**What:** Bun 1.0+
**Why:**

- Significantly faster cold start than Node.js
- Native TypeScript support (no compilation step)
- Built-in `bun:sql`, `Bun.password`, `Bun.cron` reduce dependencies
- First-class SQLite support (used for cache and rate limiting)
- Built-in test runner

**Alternatives considered:** Node.js (mature but slower), Deno (TS-native but smaller ecosystem)
**ADR:** [ADR-001](../ADRs.md#adr-001--bun-as-the-runtime)
**Detailed:** [ARCHITECTURE.md §1.4.1](../ARCHITECTURE.md#141-why-bun)

### 2.2 Web Framework — TanStack Start

**What:** TanStack Start (latest)
**Why:**

- Full-stack React with SSR and Server Functions
- Server Functions call services directly in-process (no HTTP hop)
- Type-safe end-to-end
- Same codebase as the API (single deployable service)

**Alternatives considered:** Next.js (mature but two stacks), Remix + Hono (Remix Server Functions less mature)
**ADR:** [ADR-002](../ADRs.md#adr-002--tanstack-start--hono-as-the-web-and-api-framework)
**Detailed:** [ARCHITECTURE.md §1.4.2](../ARCHITECTURE.md#142-why-tanstack-start--hono)

### 2.3 API Framework — Hono

**What:** Hono (latest)
**Why:**

- Lightweight, fast, TypeScript-first
- Mounted inside TanStack Start server at `/api/*`
- Clean JSON API for mobile, webhooks, and third-party integrations
- Same services layer as the web app

**Alternatives considered:** Express (mature but less modern), Fastify (fast but heavier)
**ADR:** [ADR-002](../ADRs.md#adr-002--tanstack-start--hono-as-the-web-and-api-framework)
**Detailed:** [ARCHITECTURE.md §1.4.2](../ARCHITECTURE.md#142-why-tanstack-start--hono)

### 2.4 Mobile — React Native + Expo

**What:** React Native 0.72+ with Expo SDK 50+
**Why:**

- Cross-platform (iOS + Android from one codebase)
- Expo's managed workflow reduces native code complexity
- Large ecosystem and community
- Same business logic as the web app (via the shared services layer)
- TanStack Query for server state, Zustand for client state

**Alternatives considered:** Native iOS + Android (more work, separate codebases), Flutter (Dart, smaller ecosystem for our needs)
**ADR:** (No ADR; the mobile app is a wrapper, not a separate stack)
**Detailed:** [ARCHITECTURE.md §3.3](../ARCHITECTURE.md#33-mobile-application--expo), [modules/Mobile App.md](../modules/Mobile%20App.md)

### 2.5 ORM — Drizzle ORM

**What:** Drizzle ORM (latest)
**Why:**

- TypeScript-first with excellent type inference
- Schema-as-code (TypeScript files, not decorators)
- Lightweight and performant
- Good migration tooling
- Works well with Bun

**Alternatives considered:** Prisma (mature but heavier, less Bun-friendly), TypeORM (mature but decorator-based, less type-safe)
**ADR:** [ADR-005](../ADRs.md#adr-005--drizzle-orm-as-the-database-orm)
**Detailed:** [ARCHITECTURE.md §1.4.2](../ARCHITECTURE.md#142-why-tanstack-start--hono)

### 2.6 Primary Database — PostgreSQL

**What:** PostgreSQL 14+, self-hosted
**Why:**

- Strong relational integrity (foreign keys, constraints)
- Excellent query performance and planner
- Built-in full-text search (`tsvector`)
- JSON support for flexible schemas
- Mature, well-understood
- Self-hosting supports NDPR data sovereignty

**Alternatives considered:** MySQL (weaker full-text search), MongoDB (weaker relational integrity), managed cloud (data sovereignty concerns)
**ADR:** [ADR-003](../ADRs.md#adr-003--postgresql-as-the-primary-database)
**Detailed:** [ARCHITECTURE.md §1.4.3](../ARCHITECTURE.md#143-why-sqlite-for-cacherate-limits), [Database.md](./Database.md)

### 2.7 Cache and Rate Limit Store — SQLite

**What:** SQLite 3+ via `bun:sql`
**Why:**

- Sub-millisecond read/write
- No separate service to deploy
- ACID-compliant
- Native Bun support
- Simple operations (file-based)

**Alternatives considered:** Redis (more features but operationally heavier), in-memory (no persistence), PostgreSQL extensions (adds complexity)
**ADR:** [ADR-004](../ADRs.md#adr-004--sqlite-for-cache-and-rate-limiting)
**Detailed:** [ARCHITECTURE.md §1.4.3](../ARCHITECTURE.md#143-why-sqlite-for-cacherate-limits)

### 2.8 State Management — TanStack Query + Zustand

**What:**

- **TanStack Query** (latest) for server state (web and mobile)
- **Zustand** (latest) for client state (web and mobile)

**Why:**

- TanStack Query handles caching, refetching, optimistic updates — eliminates boilerplate
- Zustand is small, simple, and doesn't require providers
- Same patterns across web and mobile
- TypeScript-first

**Alternatives considered:** Redux Toolkit (heavier, more boilerplate), Recoil (less popular), Jotai (atomic but less common)
**ADR:** (No ADR; standard modern choices)
**Detailed:** [ARCHITECTURE.md §3.3.1](../ARCHITECTURE.md#331-architecture) (for mobile usage)

### 2.9 UI — Tailwind CSS + shadcn/ui

**What:**

- **Tailwind CSS** (latest) for utility-first styling
- **shadcn/ui** (latest) for component primitives

**Why:**

- Tailwind's utility-first approach is fast to iterate
- shadcn/ui provides accessible, consistent components (built on Radix UI)
- Customizable without vendor lock-in (shadcn/ui is copy-paste, not a dependency)
- Works for both web and mobile (via React Native styling adaptations)

**Alternatives considered:** Material UI (heavier, harder to customize), Chakra UI (less popular for our use case), Ant Design (less customizable)
**ADR:** (No ADR; standard modern choices)
**Detailed:** [UX & Design.md §4](../product/UX%20%26%20Design.md#4-design-system-foundations)

### 2.10 Forms — TanStack Form

**What:** TanStack Form (latest)
**Why:**

- Type-safe, works well with Zod validation
- Pairs with TanStack Query (consistent data layer)
- Headless (no styling lock-in)

**Alternatives considered:** React Hook Form (mature but less type-safe), Formik (older, more boilerplate)
**ADR:** (No ADR; standard)
**Detailed:** [ARCHITECTURE.md §1.3](../ARCHITECTURE.md#13-technology-stack-summary)

### 2.11 Validation — Zod

**What:** Zod (latest)
**Why:**

- Runtime validation with TypeScript type inference
- Shared schemas across web, API, and mobile
- Standard for the Zod → TanStack Form → Server Function pipeline

**Alternatives considered:** Yup (less type-safe), Joi (heavier, less TypeScript-friendly), Valibot (newer, smaller community)
**ADR:** (No ADR; standard)
**Detailed:** [Engineering.md §3.4](./Engineering.md#34-zod-validation)

### 2.12 RBAC — CASL

**What:** CASL (latest)
**Why:**

- Supports role-based, resource-based, and conditional permissions
- TypeScript-first
- Testable (ability definitions are pure functions)
- Framework-agnostic (works in services and routes)

**Alternatives considered:** Custom RBAC (reinventing the wheel), Permit (simpler but less powerful), AccessControl (JavaScript-first)
**ADR:** [ADR-006](../ADRs.md#adr-006--casl-as-the-rbac-library)
**Detailed:** [RBAC.md](./RBAC.md) (forthcoming in detail)

### 2.13 File Storage — Cloudflare R2 / Bunny CDN / ImageKit

**What:** TBD (one of Cloudflare R2, Bunny CDN, or ImageKit)
**Why:**

- Cost-effective for evidence files (which can be up to 100 MB)
- Optimized media delivery (CDN)
- Nigerian accessibility (some providers have better latency in Nigeria)

**Alternatives considered:** AWS S3 (more expensive for our scale), Cloudinary (higher cost), self-hosted (operational overhead)
**ADR:** (Forthcoming)
**Detailed:** [ARCHITECTURE.md §1.3](../ARCHITECTURE.md#13-technology-stack-summary) (table), [modules/Evidence Upload & Integrity.md §7](../modules/Evidence%20Upload%20%26%20Integrity.md#7-dependencies)

### 2.14 Identity Verification — NIMC NVS API + Onfido

**What:**

- **NIMC NVS API** (Nigerian National Identity Management Commission, National Verification Service) — primary
- **Onfido** — fallback (document-based)

**Why:**

- NIMC is government-recognized; required for Nigerian identity verification
- Onfido is a fallback for users without NIN
- Both are SDK-friendly and well-documented

**Alternatives considered:** None — these are the only viable options for Nigerian identity verification
**ADR:** (No ADR; required by NGA)
**Detailed:** [PLATFORM.md §6](../PLATFORM.md#6-identity-verification), [ARCHITECTURE.md §5](../ARCHITECTURE.md#5-identity-verification), [modules/Authentication & Identity Verification.md](../modules/Authentication%20%26%20Identity%20Verification.md)

### 2.15 Payments — Paystack

**What:** Paystack
**Why:**

- Nigerian payment processor (founded in Nigeria, dominant in the market)
- Supports subscriptions (for lawyer marketplace)
- Supports webhooks for subscription events
- Well-documented API

**Alternatives considered:** Stripe (not as strong in Nigeria), Flutterwave (alternative Nigerian processor, but Paystack is more mature for subscriptions)
**ADR:** (No ADR; Paystack is the standard for Nigerian SaaS)
**Detailed:** [Business Case §3.2.1](../business/Business.md#321-lawyer-listings-primary-revenue-stream-from-year-2)

### 2.16 Realtime — WebSockets

**What:** WebSockets for realtime features (consultation room, live queue updates, notifications)
**Why:**

- Native browser and mobile support
- Standard protocol
- Works with our stack (Hono supports it)

**Alternatives considered:** Server-Sent Events (one-way only), long polling (legacy)
**ADR:** (No ADR; standard)
**Detailed:** [ARCHITECTURE.md §1.3](../ARCHITECTURE.md#13-technology-stack-summary)

### 2.17 Content Format — MDX

**What:** MDX 2.0+ (Markdown with JSX)
**Why:**

- Markdown is the standard for content authoring
- MDX allows embedding React components (for charts, callouts, etc.)
- Compatible with our React stack
- Sandboxed execution (preventing arbitrary code injection is a security feature)

**Alternatives considered:** Plain Markdown (less flexible), rich text editors (heavier, more bug-prone), HTML (unsafe)
**ADR:** (No ADR; standard)
**Detailed:** [modules/Blog & Content.md §7](../modules/Blog%20%26%20Content.md#7-dependencies)

### 2.18 Hosting — Self-Hosted VPS Behind WireGuard VPN

**What:** Self-hosted VPS in Nigeria, all connections via WireGuard VPN
**Why:**

- Data sovereignty: all data within Nigeria (NDPR compliance)
- Full operational control
- Cost predictability
- WireGuard VPN adds network security

**Alternatives considered:** Managed cloud (easier but data sovereignty concerns), on-premises (more control but more operational overhead)
**ADR:** [ADR-008](../ADRs.md#adr-008--self-hosted-vps-behind-wireguard-vpn)
**Detailed:** [ARCHITECTURE.md §1.4.4](../ARCHITECTURE.md#144-why-a-self-hosted-vpn-server), [Infrastructure.md](./Infrastructure.md) (forthcoming)

2.19 Email — Nodemailer
What: Nodemailer (latest)
Why:

Most mature Node.js email library with 10+ years of production use

Supports SMTP, SES, and other transports

Well-documented and widely adopted

Works with Bun (compatible with Node.js APIs)

Template support (HTML, plain text, and attachments)

Handles delivery status notifications (DSN)

No external dependencies for core functionality

Alternatives considered:

Resend — newer, API-first, but less mature and requires external service

Postmark — excellent deliverability but paid-only and external dependency

SendGrid — reliable but external service with rate limits

AWS SES — cost-effective but requires AWS credentials and setup

EmailJS — client-side only, not suitable for server-side transactional email

Brevo (Sendinblue) — good but external service with monthly limits

ADR: (Forthcoming)
Use cases:

Transactional emails (welcome, verification, password reset)

Lawyer subscription receipts (Paystack webhook → email receipt)

Poll notifications (new policy polls, results)

Consultation reminders (appointment confirmations)

System alerts (security events, administrative notifications)

Daily/weekly digests (content updates, activity summaries)

Configuration:

SMTP server (self-hosted or third-party like Mailgun, SendGrid, SES)

Email templates using EJS, Handlebars, or React Email (with Bun's JSX support)

Queue system for async email sending (bun:sql as queue store)

Rate limiting to prevent abuse

## Detailed: ARCHITECTURE.md §1.3 (update table)

## 3. What We Explicitly Did NOT Choose

For each major layer, here are the alternatives we considered and rejected, and why. This is as important as what we did choose — for new team members who wonder "why didn't we use X?"

| Layer         | Rejected                  | Why rejected                                                   |
| ------------- | ------------------------- | -------------------------------------------------------------- |
| Runtime       | Node.js                   | Slower cold start, no native TypeScript, no built-in utilities |
| Runtime       | Deno                      | Smaller ecosystem, different package management                |
| Web framework | Next.js                   | Mature but two stacks (web + API), duplicated business logic   |
| Web framework | Remix                     | Mature but Server Functions less developed than TanStack Start |
| ORM           | Prisma                    | Mature but heavier, less Bun-friendly                          |
| ORM           | TypeORM                   | Mature but decorator-based, less type-safe                     |
| Primary DB    | MySQL                     | Weaker full-text search, less feature-rich                     |
| Primary DB    | MongoDB                   | Weaker relational integrity, joins are harder                  |
| Primary DB    | Managed cloud (RDS, etc.) | Data sovereignty concerns, unpredictable costs                 |
| Cache         | Redis                     | More features but operationally heavier, separate service      |
| Cache         | In-memory                 | No persistence, loses data on restart                          |
| State         | Redux Toolkit             | Heavier, more boilerplate                                      |
| State         | Recoil                    | Less popular, smaller community                                |
| UI            | Material UI               | Heavier, harder to customize                                   |
| UI            | Chakra UI                 | Less popular for our use case                                  |
| Forms         | React Hook Form           | Mature but less type-safe than TanStack Form                   |
| Forms         | Formik                    | Older, more boilerplate                                        |
| Validation    | Yup                       | Less type-safe than Zod                                        |
| RBAC          | Custom                    | Reinventing the wheel                                          |
| RBAC          | Permit                    | Simpler but less powerful for conditional permissions          |
| File storage  | AWS S3                    | More expensive for our scale                                   |
| File storage  | Cloudinary                | Higher cost                                                    |
| File storage  | Self-hosted               | Operational overhead                                           |
| Hosting       | Managed cloud             | Data sovereignty concerns                                      |
| Hosting       | On-premises               | More control but more operational overhead                     |
| Email         | Resend                    | Newer, less mature, requires external service                  |
| Email         | SendGrid                  | External service, additional cost, rate limits                 |
| Email         | Postmark                  | Paid-only, external service                                    |
| Email         | AWS SES                   | Requires AWS setup, additional credentials management          |
| Email         | EmailJS                   | Client-side only, not suitable for transactional email         |

---

## 4. Versioning Policy

- **Bun, PostgreSQL, Expo:** pinned to major versions; minor and patch updates allowed
- **TanStack Start, Hono, Drizzle, CASL, shadcn/ui, Tailwind v4, Zod:** `latest` (these are rapidly evolving; we follow their releases)
- **Drizzle Kit, TanStack Query, TanStack Form, Zustand:** `latest`
- **React, React Native:** pinned to the version supported by the current TanStack Start / Expo

Version updates are tracked in the [Decision Log](../business/Decision%20Log.md) when they represent a material change.

---

## 5. Adding a New Dependency

Before adding a new dependency, answer:

1. **Is it necessary?** Can we achieve the same with existing tools?
2. **Is it maintained?** Active commits, recent releases, responsive maintainers
3. **Is the license compatible?** MIT, Apache 2.0, BSD preferred; GPL requires legal review
4. **Does it work with Bun?** (If runtime dependency)
5. **What's the bundle size impact?** (If frontend dependency)
6. **What's the security posture?** Any known vulnerabilities, recent security advisories

The review is done in the PR that adds the dependency. The Legal Director reviews license compatibility. The Engineering Lead reviews technical fit.

---

## 6. Migrating Off a Dependency

If a dependency becomes unmaintained, insecure, or otherwise problematic:

1. **Open an ADR** documenting the issue and the proposed migration
2. **Assess impact** (where is it used, what's the migration cost)
3. **Plan the migration** (often behind a feature flag)
4. **Execute in a phased rollout** (with rollback plan)
5. **Remove the old dependency** when the migration is complete

Migrations are tracked in the [Decision Log](../business/Decision%20Log.md) and the ADRs.

---

## 7. Tool Categories (for Onboarding)

For new team members, here are the tool categories and what each is for:

| Category          | Tools                                                          | Purpose                    |
| ----------------- | -------------------------------------------------------------- | -------------------------- |
| **Runtime**       | Bun                                                            | Server-side execution      |
| **Language**      | TypeScript                                                     | All code is TypeScript     |
| **Frameworks**    | TanStack Start (web), Hono (API), React Native + Expo (mobile) | Web, API, mobile           |
| **Data**          | PostgreSQL (primary), SQLite (cache), Drizzle (ORM)            | Data storage and access    |
| **Validation**    | Zod                                                            | Runtime validation         |
| **State**         | TanStack Query (server), Zustand (client)                      | Data state management      |
| **UI**            | Tailwind CSS, shadcn/ui                                        | Web UI                     |
| **Forms**         | TanStack Form                                                  | Form handling              |
| **Auth/RBAC**     | CASL                                                           | Role-based access control  |
| **Storage**       | Cloudflare R2 / Bunny CDN / ImageKit (TBD)                     | File storage               |
| **Verification**  | NIMC NVS, Onfido                                               | Identity verification      |
| **Payments**      | Paystack                                                       | Lawyer subscriptions       |
| **Realtime**      | WebSockets                                                     | Consultation, live updates |
| **Content**       | MDX                                                            | Blog and legal literacy    |
| **Hosting**       | Self-hosted VPS, WireGuard VPN                                 | Deployment                 |
| **Observability** | (TBD: Sentry, Datadog, PostHog)                                | Errors, metrics, analytics |
| **Testing**       | Bun test (unit), Playwright (web e2e), Maestro (mobile e2e)    | Testing                    |
| **Email**         | Nodemailer                                                     | Transactional email        |

---

## 8. Onboarding Checklist

For new team members:

- [ ] Read [ARCHITECTURE.md](../ARCHITECTURE.md) end-to-end
- [ ] Read all 12 [ADRs](../ADRs.md)
- [ ] Read [Engineering.md](./Engineering.md) and [QA.md](./QA.md)
- [ ] Read at least 3 module specs in depth (e.g., [Authentication & Identity Verification](../modules/Authentication%20%26%20Identity%20Verification.md), [Policy Polls](../modules/Policy%20Polls.md), [Lawyer Onboarding & Verification](../modules/Lawyer%20Onboarding%20%26%20Verification.md))
- [ ] Set up the local development environment (per [DEPLOYMENT.md](./DEPLOYMENT.md) when it exists)
- [ ] Run the test suite successfully
- [ ] Deploy a sample change to staging
- [ ] Shadow a senior engineer for a sprint
- [ ] Lead a small PR with code review

---

## Appendix A: Related Documents

- [ARCHITECTURE.md](../ARCHITECTURE.md) — the full architecture
- [ADRs.md](../ADRs.md) — the architectural decisions
- [Engineering.md](./Engineering.md) — the engineering standards
- [QA.md](./QA.md) — the testing strategy
- [Database.md](./Database.md) — the database schema
- [Module Specs](../modules/) — the per-module design
- [Decision Log](../business/Decision%20Log.md) — the business decisions

## Appendix B: Tech Stack Revision History

| Version | Date       | Author           | Changes                                                                                                                                                                                                    |
| ------- | ---------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-07-20 | Engineering Lead | Initial set. Quick-reference extraction from ARCHITECTURE.md §1.3 and §1.4. Documents the stack, the rationale for each choice, the alternatives considered, and the explicit list of what was NOT chosen. |
