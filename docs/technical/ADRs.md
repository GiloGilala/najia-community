# Architectural Decision Records (ADRs)

_Document Version: 1.0.0_
_Last Updated: 2026-07-20_
_Status: Active_
_Owner: Engineering Lead_

> **Changelog:**
>
> - 1.0.0 (2026-07-20) — Initial set. 12 ADRs covering the foundational technical decisions referenced in ARCHITECTURE.md and the module specs.

> **How to read this document:** ADRs document one decision each, with the context, the decision, the consequences, and the alternatives considered. The index below lists all ADRs; click into any ADR to see its full content. ADRs are append-only — once accepted, they are never edited (only superseded by a new ADR).

> **Related documents:**
>
> - [ADR Template](../templates/ADR%20Template.md) — the template used for each ADR
> - [ARCHITECTURE.md](../ARCHITECTURE.md) — the architectural context
> - [Decision Log](../business/Decision%20Log.md) — business-level decisions

---

## 1. ADR Index

| ADR                                                                    | Title                                              | Status      | Date       | Category              |
| ---------------------------------------------------------------------- | -------------------------------------------------- | ----------- | ---------- | --------------------- |
| [ADR-001](#adr-001--bun-as-the-runtime)                                | Bun as the Runtime                                 | ✅ Accepted | 2026-07-20 | Stack                 |
| [ADR-002](#adr-002--tanstack-start--hono-as-the-web-and-api-framework) | TanStack Start + Hono as the Web and API Framework | ✅ Accepted | 2026-07-20 | Stack                 |
| [ADR-003](#adr-003--postgresql-as-the-primary-database)                | PostgreSQL as the Primary Database                 | ✅ Accepted | 2026-07-20 | Storage               |
| [ADR-004](#adr-004--sqlite-for-cache-and-rate-limiting)                | SQLite for Cache and Rate Limiting                 | ✅ Accepted | 2026-07-20 | Storage               |
| [ADR-005](#adr-005--drizzle-orm-as-the-database-orm)                   | Drizzle ORM as the Database ORM                    | ✅ Accepted | 2026-07-20 | Stack                 |
| [ADR-006](#adr-006--casl-as-the-rbac-library)                          | CASL as the RBAC Library                           | ✅ Accepted | 2026-07-20 | Stack                 |
| [ADR-007](#adr-007--single-deployable-service-with-two-entry-points)   | Single Deployable Service with Two Entry Points    | ✅ Accepted | 2026-07-20 | Architecture          |
| [ADR-008](#adr-008--self-hosted-vps-behind-wireguard-vpn)              | Self-Hosted VPS Behind WireGuard VPN               | ✅ Accepted | 2026-07-20 | Infrastructure        |
| [ADR-009](#adr-009--voter-anonymization-via-hash-without-user-id)      | Voter Anonymization via Hash Without User ID       | ✅ Accepted | 2026-07-20 | Security/Privacy      |
| [ADR-010](#adr-010--sha-256-as-the-evidence-hash-algorithm)            | SHA-256 as the Evidence Hash Algorithm             | ✅ Accepted | 2026-07-20 | Security              |
| [ADR-011](#adr-011--flat-subscription-model-for-lawyer-marketplace)    | Flat Subscription Model for Lawyer Marketplace     | ✅ Accepted | 2026-07-20 | Business/Architecture |
| [ADR-012](#adr-012--manual-bar-verification-by-moderator)              | Manual Bar Verification by Moderator               | ✅ Accepted | 2026-07-20 | Process               |

**Status values:**

- ✅ Accepted — Decision is in effect
- 🟡 Proposed — Under discussion
- ⛔ Deprecated — No longer applies
- 🔄 Superseded — Replaced by a newer ADR

---

## 2. ID Convention

ADR IDs follow the format `ADR-NNNN` where NNNN is a zero-padded sequence number. ADRs are numbered in the order they are written, not in order of importance.

---

## 3. The ADRs

---

### ADR-001 — Bun as the Runtime

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead, Project Lead

#### Context

We need a JavaScript/TypeScript runtime for the server. The team is comfortable with Node.js but open to alternatives. The platform requires:

- Fast startup (cold start matters for the pilot's cost structure)
- Native TypeScript support (the codebase is TypeScript-first)
- Built-in utilities (SQL, password hashing, cron) to reduce dependencies
- Compatibility with the TanStack Start + Hono stack

#### Decision

We will use **Bun** as the runtime for the server.

#### Consequences

**Positive:**

- Significantly faster cold start than Node.js
- Native TypeScript support (no compilation step)
- Built-in `bun:sql`, `Bun.password`, `Bun.cron` reduce dependencies
- First-class SQLite support (used for cache and rate limiting)
- Built-in test runner

**Negative:**

- Smaller ecosystem than Node.js (some npm packages may have issues)
- Team is less experienced with Bun than Node.js
- Production deployment requires Bun-specific knowledge

**Risks:**

- Bun compatibility issues with specific npm packages → mitigated by early testing in Phase 0
- Team learning curve → mitigated by dedicated learning time in Phase 0
- Production operational risk → mitigated by self-hosted VPS with full control

#### Alternatives Considered

- **Node.js:** Mature, well-known, but slower cold start and no native TypeScript
- **Deno:** Native TypeScript, but smaller ecosystem and different package management
- **Node.js with tsx:** TypeScript via tsx, but still no built-in utilities

**Why rejected:** Bun's combination of performance, native TypeScript, and built-in utilities is the best fit for our requirements.

---

### ADR-002 — TanStack Start + Hono as the Web and API Framework

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead, Project Lead

#### Context

We need a web framework for the user-facing app and an API framework for the mobile app, webhooks, and third-party integrations. The team wants to avoid duplicating business logic across two stacks.

#### Decision

We will use **TanStack Start** for the web app (with Server Functions for direct service calls) and **Hono** for the API layer (mounted at `/api` inside the same TanStack Start server). Both entry points call the same services layer.

#### Consequences

**Positive:**

- Single codebase, single deployment, single set of dependencies
- Web app calls services directly in-process (no HTTP hop)
- Mobile app, webhooks, and integrations have a clean JSON API
- Hono is lightweight and TypeScript-first
- Server Functions are type-safe end-to-end

**Negative:**

- TanStack Start is relatively new (the team is learning the patterns)
- Coupling between web and API entry points (deployments affect both)
- Less flexibility than separate stacks for divergent needs

**Risks:**

- TanStack Start maturity → mitigated by thorough testing in Phase 0
- Operational coupling → mitigated by feature flags and careful deployment practices
- Team learning curve → mitigated by dedicated learning time

#### Alternatives Considered

- **Next.js + separate Express API:** Mature, but two stacks, two deployments, duplicated business logic
- **Remix + Hono:** Mature, but Server Functions are less developed than TanStack Start's
- **Single Hono app with HTML rendering:** Simpler, but loses React's component model and SSR benefits

**Why rejected:** TanStack Start + Hono's single-stack approach with two entry points is the best fit for our "single source of truth" principle.

---

### ADR-003 — PostgreSQL as the Primary Database

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead, Project Lead, Legal Director

#### Context

We need a primary database for the platform. The database must:

- Support relational integrity (cases, evidence, lawyers, votes are all relational)
- Support complex queries (the matching algorithm, the transparency report)
- Support full-text search (the blog search)
- Be NDPR-compliant (data sovereignty: all data within Nigeria)
- Be operationally manageable by a small team

#### Decision

We will use **PostgreSQL 14+** as the primary database, self-hosted on a VPS in Nigeria.

#### Consequences

**Positive:**

- Strong relational integrity (foreign keys, constraints)
- Excellent query performance and planner
- Built-in full-text search (`tsvector`)
- JSON support for flexible schemas (e.g., `category_ratings` in reviews)
- Mature, well-understood by the team
- Self-hosting supports NDPR data sovereignty

**Negative:**

- Operational overhead (backups, monitoring, scaling)
- Single point of failure (mitigated by replication)
- Self-hosting requires infrastructure management

**Risks:**

- Data loss → mitigated by daily backups, WAL archiving, RPO < 1 hour
- Performance issues → mitigated by connection pooling, query optimization
- Operational incidents → mitigated by runbooks and on-call rotation

#### Alternatives Considered

- **MySQL:** Mature, but weaker full-text search and less feature-rich
- **MongoDB:** Flexible, but weaker relational integrity and joins
- **Managed cloud (e.g., AWS RDS):** Easier operationally, but data sovereignty concerns

**Why rejected:** PostgreSQL's feature set is the best fit, and self-hosting addresses the NDPR constraint.

---

### ADR-004 — SQLite for Cache and Rate Limiting

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead

#### Context

We need a cache layer and a rate limiting layer. These have different requirements from the primary database:

- High throughput (every request touches the cache and rate limiter)
- Low latency (sub-millisecond reads)
- No need for cross-instance consistency in the pilot (single VPS)
- Simple operations (no replication, no backup beyond the file itself)

#### Decision

We will use **SQLite** (managed via `bun:sql`) for the cache layer and the rate limiting layer, stored as local files on the same VPS.

#### Consequences

**Positive:**

- Sub-millisecond read/write
- No separate service to deploy
- ACID-compliant (transaction-safe)
- Native Bun support
- Simple operations (file-based)

**Negative:**

- Single-instance only (not horizontally scalable)
- File-based (requires disk I/O, though minimal)
- Not suitable for cross-instance consistency

**Risks:**

- File corruption → mitigated by WAL mode, regular backups
- Disk I/O contention → mitigated by WAL mode, fast SSD
- Not horizontally scalable → mitigated by accepting single-instance constraint in pilot; Redis is a Y2 candidate

#### Alternatives Considered

- **Redis:** Excellent for caching and rate limiting, but requires a separate service and operationally heavier
- **In-memory (no persistence):** Fast, but loses data on restart
- **PostgreSQL extensions (e.g., pg_cron, pg_rate_limit):** Possible, but adds complexity to the primary database

**Why rejected:** SQLite's simplicity and Bun's native support make it the right choice for the pilot. Redis is a Y2 candidate if multi-instance cache coherence becomes a bottleneck.

---

### ADR-005 — Drizzle ORM as the Database ORM

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead

#### Context

We need an ORM for PostgreSQL. The ORM must:

- Be TypeScript-first (the codebase is TypeScript)
- Support Drizzle's schema-as-code approach
- Generate type-safe queries
- Support migrations
- Work well with Bun

#### Decision

We will use **Drizzle ORM** as the database ORM.

#### Consequences

**Positive:**

- TypeScript-first with excellent type inference
- Schema-as-code (TypeScript files, not decorators)
- Lightweight and performant
- Good migration tooling
- Works well with Bun

**Negative:**

- Smaller community than Prisma or TypeORM
- Some advanced queries require raw SQL
- Team is less experienced with Drizzle than other ORMs

**Risks:**

- Team learning curve → mitigated by thorough examples and documentation
- Missing features → mitigated by ability to use raw SQL when needed
- Ecosystem maturity → mitigated by the active development and growing community

#### Alternatives Considered

- **Prisma:** Mature, but heavier and less Bun-friendly
- **TypeORM:** Mature, but decorator-based and less type-safe
- **Raw SQL with pg:** No ORM, but loses type safety and migration tooling

**Why rejected:** Drizzle's TypeScript-first approach and Bun compatibility are the best fit.

---

### ADR-006 — CASL as the RBAC Library

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead, Legal Director

#### Context

We need an RBAC library to enforce role-based and resource-based permissions. The library must:

- Support role-based and resource-based permissions
- Support conditional permissions (e.g., "own case" vs. "all cases")
- Be TypeScript-first
- Be testable
- Work with our architecture (services + API routes)

#### Decision

We will use **CASL** as the RBAC library.

#### Consequences

**Positive:**

- Supports role-based and resource-based permissions
- Supports conditional permissions (essential for our access control)
- TypeScript-first
- Testable (ability definitions are pure functions)
- Framework-agnostic (works in services and routes)

**Negative:**

- Learning curve (the conditions syntax is unusual)
- Some patterns require careful design (e.g., role inheritance is not automatic)
- Documentation can be dense

**Risks:**

- Misuse of conditions → mitigated by code review and the RBAC test patterns
- Role hierarchy confusion → mitigated by the explicit note in [RBAC.md](./RBAC.md#22-role-hierarchy-vs-explicit-grants) about numeric hierarchy vs. explicit grants

#### Alternatives Considered

- **Custom RBAC:** Full control, but reinventing the wheel
- **Permit (Node.js):** Simpler, but less powerful for conditional permissions
- **AccessControl:** Mature, but JavaScript-first

**Why rejected:** CASL's combination of role-based, resource-based, and conditional permissions is the best fit for our access control needs.

---

### ADR-007 — Single Deployable Service with Two Entry Points

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead, Project Lead

#### Context

We need to decide how to deploy the platform. The options range from a monolith to a fully distributed microservices architecture.

#### Decision

We will deploy a **single service** with two entry points (TanStack Start for the web app, Hono for the API). All business logic is in the services layer.

#### Consequences

**Positive:**

- Single deployment artifact, single set of dependencies
- No inter-service communication overhead
- Easy to reason about (everything is in one process)
- Easy to operate (one service to monitor, one set of logs)
- Web app calls services directly (no HTTP hop)

**Negative:**

- Cannot scale web and API independently
- All components share the same process (a memory leak in one affects all)
- Tight coupling between components (changes to one can affect others)

**Risks:**

- Memory leak → mitigated by monitoring and regular restarts
- Independent scaling need → mitigated by feature flags and gradual rollout
- Process-level failure → mitigated by process supervision (systemd, Docker restart policies)

#### Alternatives Considered

- **Microservices:** Maximum flexibility, but operational complexity and inter-service overhead
- **Modular monolith with extractable modules:** Same as our decision, but with explicit module boundaries; we adopt this implicitly
- **Separate web and API deployments:** Two services, but duplicated business logic

**Why rejected:** A single service is the right operational model for a small team. Module boundaries within the services layer allow future extraction if needed.

---

### ADR-008 — Self-Hosted VPS Behind WireGuard VPN

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead, Project Lead, Legal Director

#### Context

We need a deployment environment. The platform must:

- Keep all citizen data within Nigeria (NDPR compliance)
- Provide operational control (full visibility into the stack)
- Be cost-predictable (the platform is grant-funded in Year 1)
- Support the expected pilot traffic (500 MAU, 1,000 poll participants, 20 cases)

#### Decision

We will self-host on a **VPS in Nigeria**, with all connections going through a **WireGuard VPN**.

#### Consequences

**Positive:**

- Data sovereignty: all data within Nigeria (NDPR compliance)
- Full operational control
- Cost predictability (fixed VPS cost vs. per-request cloud pricing)
- WireGuard VPN adds a layer of network security

**Negative:**

- Operational overhead (provisioning, monitoring, backups)
- Single VPS = single point of failure (mitigated by backup VPS)
- No managed services (we operate everything)

**Risks:**

- Data center incident → mitigated by off-site backups, RTO < 30 minutes
- DDoS attack → mitigated by DDoS protection service, WireGuard's limited attack surface
- Operational mistake → mitigated by runbooks, staging environment, gradual rollouts

#### Alternatives Considered

- **Managed cloud (e.g., AWS, GCP, Azure):** Easier operationally, but data sovereignty concerns and unpredictable costs
- **Multiple cloud providers:** Geographic distribution, but operational complexity
- **On-premises:** Maximum control, but operational overhead and physical security concerns

**Why rejected:** A self-hosted VPS with WireGuard VPN is the right balance of control, cost, and operational complexity for the pilot.

---

### ADR-009 — Voter Anonymization via Hash Without User ID

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead, Legal Director, Project Lead

#### Context

Policy polls and confidence votes collect citizen sentiment. The votes must be anonymized so that:

- No one (including platform staff) can identify who voted for which option
- Double-voting is prevented (one vote per user per poll)
- The Amara persona's trust constraint is met (she fears identification)

#### Decision

The `poll_votes` and `confidence_votes` tables will have **no `user_id` column**. Instead, they will store a `voter_token_hash` computed as `SHA-256(user_id + poll_id + pepper)` where the pepper is a server-side secret. The DB uniqueness constraint on `(poll_id, voter_token_hash)` prevents double-voting.

The same pepper is used across both Policy Polls and Confidence Votes to prevent cross-table correlation by hash analysis.

#### Consequences

**Positive:**

- Votes cannot be tied back to a user (even by platform staff)
- Double-voting is prevented at the DB level
- Cross-table correlation is prevented by the shared pepper
- The Amara persona's trust constraint is met

**Negative:**

- Users cannot change their vote (would create a duplicate hash)
- DSAR cannot retrieve a user's votes (the link is lost at write time)
- Pepper rotation requires invalidating all existing votes (catastrophic case)

**Risks:**

- Pepper compromise → mitigated by rotation policy, documented in the runbook
- Reversal attack → mitigated by the pepper and the SHA-256 construction
- Cross-table correlation → mitigated by the shared pepper

#### Alternatives Considered

- **Encrypted user ID:** Reversible, violates the anonymization guarantee
- **Random per-poll tokens:** Loses the cross-table correlation defense
- **User ID with strict access controls:** Still reversible by staff, violates the trust contract

**Why rejected:** Hash-without-user-id is the only design that meets the non-reversibility requirement.

---

### ADR-010 — SHA-256 as the Evidence Hash Algorithm

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Engineering Lead

#### Context

Evidence files are hashed at upload time and re-hashed on every access to detect tampering. The hash algorithm must:

- Be cryptographically secure (collision-resistant, preimage-resistant)
- Be fast for large files (evidence can be up to 100 MB)
- Be widely supported and audited
- Be available in Bun's standard library

#### Decision

We will use **SHA-256** for evidence hashing, computed in a streaming manner for large files.

#### Consequences

**Positive:**

- Cryptographically secure (NIST-approved, widely audited)
- Fast for large files with streaming computation
- Native Bun support
- Wide ecosystem support

**Negative:**

- Not quantum-resistant (acceptable for the pilot; Y2 may consider post-quantum alternatives)
- SHA-256 hashes are 32 bytes per file (acceptable overhead)

**Risks:**

- Quantum computing attack → mitigated by being a long-term concern, not a pilot concern
- Implementation bug → mitigated by using a vetted library (Bun's crypto)

#### Alternatives Considered

- **SHA-3:** Newer, but not natively supported in Bun
- **BLAKE2:** Faster, but less widely audited
- **MD5:** Broken, not acceptable

**Why rejected:** SHA-256's combination of security, performance, and ecosystem support is the best fit.

---

### ADR-011 — Flat Subscription Model for Lawyer Marketplace

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Project Sponsor, Legal Director, Engineering Lead, Finance Director

#### Context

The lawyer marketplace needs a revenue model. The Nigerian Bar Association (NBA) Rules of Professional Conduct prohibit fee-splitting between lawyers and non-lawyers. This rules out any model that takes a percentage of legal fees.

#### Decision

The platform will charge lawyers a **flat monthly subscription** (Basic / Enhanced / Premium tiers). The platform will **never** take a percentage of legal fees, consultation fees, or any fee that flows from a lawyer–client engagement.

This constraint is enforced at four levels:

1. **Data model:** No field or relation between the platform and a lawyer's fees
2. **Service code:** No method or function that takes a percentage of legal fees
3. **CI grep:** A build-time check that fails if a percentage-of-fees pattern is introduced
4. **Code review:** Legal Director reviews every change to the subscription or lawyer service

#### Consequences

**Positive:**

- Compliant with NBA Rules of Professional Conduct
- Predictable revenue (lawyers know their monthly cost)
- No conflict of interest (the platform's incentive is not aligned with the lawyer's fees)
- Defensible to the Bar Association

**Negative:**

- Limits revenue potential (the platform cannot scale with lawyer success)
- Requires market validation (will lawyers pay a flat fee?)
- May not match what some lawyers are willing to pay (vs. a per-case model)

**Risks:**

- Bar Association interpretation changes → mitigated by ongoing NBA engagement
- Lawyer churn if the value isn't there → mitigated by the marketplace value (matching, free consultations)
- CI grep false positives → mitigated by careful pattern design and review

#### Alternatives Considered

- **Percentage of legal fees:** Bar Association rule violation
- **Per-case marketplace fee:** Similar to percentage; arguably a form of fee-splitting
- **Free for lawyers, paid by citizens:** Would create access barriers (conflicts with free access principle)
- **Hybrid (subscription + per-case):** Ambiguous under Bar Association rules

**Why rejected:** A flat subscription is the only model that is unambiguously compliant with NBA Rules and aligns with the platform's mission.

---

### ADR-012 — Manual Bar Verification by Moderator

**Date:** 2026-07-20
**Status:** ✅ Accepted
**Deciders:** Project Lead, Legal Director, Engineering Lead

#### Context

Lawyers must be verified before they can practice on the platform. The verification is against the Nigerian Bar Association (NBA) / Body of Benchers public register. Currently, the NBA does not offer a public API for bar status verification.

#### Decision

Bar verification will be **manual**, performed by a trained moderator who checks the lawyer's bar number against the Body of Benchers public register (or contacts the NBA directly for ambiguous cases). The SLA is 3 business days (95% within this window).

#### Consequences

**Positive:**

- Works with the current NBA infrastructure (no API required)
- Human judgment handles edge cases (name variations, etc.)
- Defensible to the Bar Association (a real person checks)

**Negative:**

- Slow (3-day SLA vs. instant verification if an API existed)
- Operational overhead (moderator time)
- Bottleneck if lawyer volume grows
- Subject to human error (mitigated by the moderator training and audit)

**Risks:**

- Moderator error → mitigated by training, audit, and the appeal process
- Volume growth → mitigated by adding moderators and potentially an API integration in Y2
- Fraudulent bar numbers → mitigated by the audit log and the manual check

#### Alternatives Considered

- **NBA API integration:** Not available in the pilot
- **Third-party verification service:** No credible Nigerian provider exists
- **Self-attestation only:** No verification, not acceptable
- **Automated public register scraping:** Brittle, no official sanction

**Why rejected:** Manual verification is the only viable option given the current NBA infrastructure. It's slow but defensible.

---

## 4. Future ADRs

ADRs that should be written before or during the build:

- ADR-013: Storage layer selection (Cloudflare R2 vs. Bunny CDN vs. ImageKit)
- ADR-014: AI detection vendor selection (open-source vs. commercial)
- ADR-015: Email service selection (Resend, Postmark, SendGrid)
- ADR-016: WebRTC consultation infrastructure (peer-to-peer vs. TURN server)
- ADR-017: Analytics service selection (PostHog, Amplitude, etc.)
- ADR-018: Error tracking service selection (Sentry, etc.)
- ADR-019: CI/CD pipeline architecture
- ADR-020: Backup and disaster recovery specifics

These will be added to the index as they are written.

---

## 5. ADR Lifecycle

1. **Proposed:** A team member identifies a decision that needs to be made. They draft an ADR using the [template](../templates/ADR%20Template.md) and add it to the index with 🟡 status.
2. **Review:** The ADR is reviewed by the deciders (usually the Engineering Lead, sometimes with the Legal Director or Project Lead). Comments are addressed.
3. **Accepted:** The deciders agree. The ADR status is updated to ✅.
4. **Implementation:** The decision is implemented. The ADR is referenced from the relevant code and documents.
5. **Superseded:** A new decision reverses or replaces the original. The new ADR is written and links to the old one. The old ADR's status is updated to 🔄 with a link to the new one.

ADRs are never deleted. They are append-only, like the audit log.

---

## 6. Conventions

- ADRs are numbered in the order they are written
- ADRs use the [template](../templates/ADR%20Template.md)
- ADRs are written in Markdown
- ADRs are stored in `technical/adr/` (or in this document for v1.0.0)
- The index at the top of this document is the canonical reference

---

## Appendix A: Related Documents

- [ADR Template](../templates/ADR%20Template.md)
- [Decision Log](../business/Decision%20Log.md) — business-level decisions
- [ARCHITECTURE.md](../ARCHITECTURE.md) — the architectural context
- [RBAC.md](./RBAC.md) — for ADRs related to RBAC
- [Security.md](./Security.md) — for ADRs related to security (forthcoming)

## Appendix B: ADR Revision History

| Version | Date       | Author           | Changes                                                                                                                                                                                                                                                                                                             |
| ------- | ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-07-20 | Engineering Lead | Initial set. 12 ADRs covering the foundational technical decisions referenced in ARCHITECTURE.md and the module specs. ADRs cover: runtime, web/API framework, primary database, cache, ORM, RBAC, deployment architecture, hosting, voter anonymization, evidence hashing, lawyer fee model, and bar verification. |
