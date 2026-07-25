Technical Architecture
Document Version: 2.0.0
Last Updated: 2026-07-20
Status: Active
Owner: Engineering Lead

Changelog:

2.0.0 (2026-07-20) — Major rewrite. This document is now the architectural overview and navigation index. The detailed technical content has been extracted into focused documents (Tech Stack, ADRs, Engineering, QA, Database, Security, Infrastructure). This rewrite eliminates duplication and prevents drift. The content that remains is the architectural overview, the cross-cutting patterns, and the navigation between the focused documents.
1.0.0 (2026-07-20) — Initial consolidated release. (Superseded by 2.0.0; see Appendix E: Changelog for the v1.0.0 changes.)
How to read this document: This is the architectural overview for the platform. It provides the system philosophy, the high-level architecture, and the cross-cutting patterns that span the focused technical documents. For any specific topic, follow the link to the relevant document. The relationship between this document and the others is documented in §13 (Document Map).

Related documents: The focused technical documents (see §13 for the full list):

Tech Stack.md — the technology choices
ADRs.md — the architectural decisions
Engineering.md — the engineering standards
QA.md — the testing strategy
Database.md — the database schema
Security.md — the security architecture
Infrastructure.md — the deployment and operations

1. System Philosophy
   1.1 Core Principles
   Technical Architecture is built on these architectural principles. Every design decision in the codebase traces back to one or more of these principles.

Principle Description Enforced by
Single source of truth All business logic resides exclusively in the services layer. Routes, actions, and components only handle validation, auth, and response shaping. Code review; architecture tests
Thin entry points Web actions and API routes only handle validation, auth, and response shaping. They do not contain business logic. Code review; the import boundary rule (§5)
Direct calls The web app calls services directly in-process. No HTTP hop for in-app operations. TanStack Start Server Functions; the architecture itself
Shared validation Zod schemas are shared across all entry points. The same schema validates the API, the Server Function, and the mobile app. The validation library placement (§5)
No reverse dependencies Services never import from web actions or API routes. The dependency graph is one-way. ESLint import/no-restricted-paths rule (Engineering.md §2.1)
Cache first Check the cache before any database query. The cache service pattern (§6)
Rate limit first Enforce rate limits before any processing. The rate limit middleware (Infrastructure.md §6.3)
Observability by default All operations are logged, traced, and monitored. The structured logger and the audit log (§9)
Least privilege Users have the minimum permissions needed for their role. CASL conditions; RBAC tests (Security.md §3.2)
These principles are not aspirational. They are enforced by code, by CI, and by code review.

1.2 What This Document Is and Isn't
This document is:

The system philosophy and the high-level architecture
The cross-cutting patterns that span the focused documents
The navigation index for the technical documentation
This document is not:

A substitute for the focused documents (Tech Stack, ADRs, Engineering, etc.)
A duplication of content that lives elsewhere
The only source of truth for any specific topic
The principle: one source of truth per topic. If you find a topic covered in two places, that's a bug — report it.

2. High-Level Architecture
   2.1 System Diagram
   text

┌─────────────────────────────────────────────────────────────────────────────┐
│ REQUEST FLOW │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│ │ Web App │ │ Mobile App │ │ Webhooks / 3rd Party │ │
│ │ (Browser) │ │ (Expo) │ │ │ │
│ └──────┬───────┘ └──────┬───────┘ └──────────┬───────────────┘ │
│ │ │ │ │
│ │ SSR/ │ HTTP/ │ HTTP/ │
│ │ Server Functions │ JSON │ JSON │
│ ▼ ▼ ▼ │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ TANSTACK START SERVER │ │
│ │ │ │
│ │ ┌─────────────────────┐ ┌─────────────────────────────┐ │ │
│ │ │ Server Functions │ │ HONO API LAYER │ │ │
│ │ │ (In-Process) │◄────────►│ (Mounted at /api) │ │ │
│ │ │ │ │ │ │ │
│ │ │ • Mutations │ │ • Mobile API │ │ │
│ │ │ • Loaders │ │ • Webhook Endpoints │ │ │
│ │ │ • SSR Rendering │ │ • Third-party Integration │ │ │
│ │ └──────────┬──────────┘ └────────────┬────────────────┘ │ │
│ │ │ │ │ │
│ │ └───────────────┬───────────────────┘ │ │
│ │ ▼ │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ SHARED SERVICES LAYER │ │ │
│ │ │ (Single Source of │ │ │
│ │ │ Truth) │ │ │
│ │ └────────────┬────────────┘ │ │
│ └──────────────────────────────┼─────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ POSTGRESQL DATABASE + SQLITE CACHE │ │
│ │ ┌────────────────┐ ┌────────────────┐ ┌──────────────────────┐ │ │
│ │ │ PostgreSQL │ │ SQLite Cache │ │ SQLite Rate Limit │ │ │
│ │ │ (Primary) │ │ (Bun.sql) │ │ (Bun.sql) │ │ │
│ │ └────────────────┘ └────────────────┘ └──────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
2.2 The Request Flow
A user request flows through the system as follows:

Entry point: the request arrives at one of three entry points:

Web app (browser): a Server Function call (in-process) for data loading or mutations
Mobile app (Expo): an HTTP/JSON call to the Hono API at /api/_
Webhook or 3rd party: an HTTP/JSON call to the Hono API at /api/webhooks/_
Validation and auth: the entry point validates the request (Zod schema) and authenticates the user (JWT).

Rate limit: the rate limit middleware checks the per-endpoint, per-user (or per-IP) limit.

Service call: the entry point calls the corresponding service in the services layer.

Business logic: the service implements the business logic. It may:

Check the cache (§6)
Query the database
Call other services
Emit events or notifications
Response: the service returns the result. The entry point shapes the response (JSON for the API, typed objects for Server Functions).

Audit logging: every state change is audit-logged.

2.3 The Three Pillars
The platform's features are organized into three pillars plus a foundation:

Pillar Modules Reference
0 — Identity (foundation) Authentication & Identity Verification modules/Authentication & Identity Verification.md
1 — Civic engagement Policy Polls, Confidence Votes modules/Policy Polls.md, modules/Confidence Votes.md
2 — Evidence integrity Evidence Upload & Integrity modules/Evidence Upload & Integrity.md
3 — Lawyer marketplace Lawyer Onboarding & Verification, Lawyer Matching & Consultation, Lawyer Reviews modules/Lawyer Onboarding & Verification.md, modules/Lawyer Matching & Consultation.md, modules/Lawyer Reviews.md
Cross-cutting Moderation, Blog & Content, Admin & Operations modules/Moderation.md, modules/Blog & Content.md, modules/Admin & Operations.md
Platform Mobile App modules/Mobile App.md 3. Entry Points
The platform has three entry points, all sharing the same services layer.

3.1 Web App — TanStack Start
The web app is the primary user-facing interface. It uses TanStack Start for SSR, routing, and Server Functions.

What lives in the web app:

React components and routes
Server Functions (mutations, loaders, SSR)
Form handling (TanStack Form)
Server state management (TanStack Query)
Client state management (Zustand)
What does NOT live in the web app:

Business logic (lives in the services layer)
Database access (lives in the services layer)
API endpoints for the mobile app (lives in the Hono layer)
Why this matters: Server Functions call services directly in-process. There's no HTTP hop for in-app operations. The web app is fast, the type safety is end-to-end, and the business logic is in exactly one place.

Detailed: ARCHITECTURE.md §3.1 is a placeholder — for the web app details, see Tech Stack.md §2.2 and the module specs.

3.2 API — Hono
The Hono API layer is mounted at /api/\* inside the TanStack Start server. It serves:

The mobile app (Expo)
Webhook endpoints (Paystack, NIMC, Onfido)
Third-party integrations
Future public API consumers
What lives in the Hono layer:

HTTP request/response handling
Zod validation at the boundary
JWT authentication middleware
RBAC enforcement via requirePermission
Rate limiting via middleware
Calling the services layer
What does NOT live in the Hono layer:

Business logic (lives in the services layer)
Database access (lives in the services layer)
Web app-specific concerns (lives in the TanStack Start layer)
Why this matters: The mobile app and the web app share the exact same business logic. A change to a service immediately benefits both clients.

Detailed: The API endpoints are documented in API.md. The Hono-specific details are in Tech Stack.md §2.3.

3.3 Mobile App — Expo
The mobile app is a client of the Hono API. It does not contain separate business logic.

What lives in the mobile app:

React Native components
API client (HTTP)
Local state (Zustand, TanStack Query)
Local storage (SecureStore for tokens, AsyncStorage for non-sensitive data)
Offline support (limited; evidence upload queue and content cache)
What does NOT live in the mobile app:

Business logic (lives in the services layer on the server)
Database access (the mobile app talks to the API, not the database)
RBAC (enforced by the API; the mobile app just displays the result)
Why this matters: The mobile app is a thin client. When the business logic changes, the mobile app benefits automatically. When the mobile app needs a new feature, it's added to the services layer and exposed via the API.

Detailed: modules/Mobile App.md.

3.4 Webhooks
Webhook endpoints (e.g., Paystack subscription events) are part of the Hono API. They follow the same pattern:

Signature verification at the boundary
Validation
Service call
Detailed: API.md §12 and Security.md §3.1 (for webhook security).

4. The Services Layer
   The services layer is the single source of truth for all business logic. This is the most important architectural pattern in the codebase.

4.1 The Pattern
Every business operation is a service method. A service method:

Receives typed inputs (validated by Zod at the caller)
Performs the business logic
Queries the database (or the cache)
Calls other services as needed
Returns typed outputs
Audit-logs state changes
Emits events or notifications as needed
A service method does NOT:

Handle HTTP requests or responses
Validate request bodies (that's the caller's job)
Authenticate users (that's the middleware's job)
Render UI
4.2 The Service Modules
Service Module Purpose
auth.service.ts Authentication & Identity Verification Registration, login, identity verification, sessions
poll.service.ts Policy Polls Poll lifecycle, voting, results
confidence.service.ts Confidence Votes Official lifecycle, voting, results
evidence.service.ts Evidence Upload & Integrity Upload, hash, AI detection, integrity verification
lawyer.service.ts Lawyer Onboarding & Verification Lawyer registration, bar verification, profile, subscription
matching.service.ts Lawyer Matching & Consultation Case intake, matching, free consultation
review.service.ts Lawyer Reviews Post-consultation review prompt, review submission, moderation
moderation.service.ts Moderation The unified moderation queue, decisions, appeals
blog.service.ts Blog & Content Blog posts, legal literacy modules, editorial pipeline
admin.service.ts Admin & Operations User management, role assignment, financial reporting, transparency reports
notification.service.ts (Cross-cutting) In-app and email notifications
audit.service.ts (Cross-cutting) The audit log
rbac.service.ts (Cross-cutting) The RBAC ability definitions
Detailed per-service: the module specs linked above. Each module spec has a "Data Model", "API Surface", and "Business Rules" section that documents the corresponding service.

4.3 The Import Boundary Rule
The import boundary is the most important rule in the codebase:

text

app/ → can import from: services, lib, shared-types
server/ → can import from: services, lib, shared-types
mobile/ → can import from: shared-types (not from app/, server/, or services/)
services/ → can import from: lib, shared-types, db, cache, rate-limit
lib/ → can import from: shared-types, db (for query helpers)
db/ → can import from: shared-types
cache/ → can import from: shared-types
rate-limit/ → can import from: shared-types
shared-types/ → no imports from other internal modules
The reverse is forbidden. services/ cannot import from app/, server/, or mobile/. This is enforced by ESLint.

Why this matters: The import boundary ensures that business logic is in one place. If the mobile app and the web app have different logic, the boundary is being violated.

Detailed: Engineering.md §2.1.

4.4 Service Method Conventions
Every service method follows these conventions:

Typed inputs and outputs: TypeScript types throughout; Zod schemas for runtime validation
Errors as values: typed errors (e.g., Result<T, E>) rather than thrown exceptions for business errors
Audit logging: every state change creates an audit log entry
No I/O in constructors: services are stateless; the database and cache are injected
Pure where possible: methods that don't depend on the database or external services are pure functions
Documented: every public method has JSDoc
Detailed: Engineering.md §4.

5. Data Layer
   The data layer is documented in detail in Database.md. This section provides the architectural overview.

5.1 The Two Stores
The platform uses two data stores:

Store Purpose Technology Why
Primary database All persistent data (users, polls, evidence, lawyers, etc.) PostgreSQL 14+ Relational integrity, complex queries, full-text search, NDPR compliance via self-hosting
Cache Verification cache, query cache, poll results cache SQLite (via bun:sql) Sub-millisecond reads, no separate service, ACID-compliant
Rate limit Per-endpoint and per-user rate limits SQLite (via bun:sql) Same as cache; can be shared or separate
The choice of two stores is deliberate. The primary database is for persistent, relational data with strong integrity requirements. The cache and rate limit are for high-throughput, low-latency operations where ACID-compliance and sub-millisecond reads matter more than relational integrity.

5.2 The Schema Conventions
Prefixed text IDs: usr*, cse*, pll*, evd*, lwr*, mtch*, cnslt*, rvw*, mod*, enr*, qi*, dec*, etc.
Timestamps: created_at / updated_at on every table, stored as timestamptz
Status enums: Postgres enums rather than free-text strings
Foreign keys: always indexed; cascade behavior documented per-table
RBAC overrides: stored separately from the main tables (per-user permission overrides)
Detailed: Database.md §1.3.

5.3 The Anonymization Pattern
The most important data model decision in the platform is the voter anonymization. The poll_votes and confidence_votes tables have no user_id column. Instead, they store a voter_token_hash that cannot be reversed.

This is the platform's commitment to the Amara persona's trust constraint. It's enforced at the schema level (no user_id column), the service level (the service does not accept a user_id for the vote), and the DB level (the UNIQUE constraint on the hash prevents double-voting without needing the user_id).

Detailed: ADR-009, Database.md §4.3.

5.4 The Fee Model Pattern
The most important compliance data model decision is the flat subscription model. The lawyer_subscriptions table has a fixed monthly amount per tier, not a percentage of legal fees. This is enforced at four levels: data model, service code, CI grep, and code review.

Detailed: ADR-011, Engineering.md §6.

6. The Cache and Rate Limiting Layers
   The cache and rate limiting layers are cross-cutting concerns that are used by almost every service. They're documented in detail in Infrastructure.md §4 (for the cache table schema) and Database.md §16.

6.1 The Cache Pattern
Every read checks the cache before the database. Every write invalidates the cache. The cache is best-effort; a miss is acceptable; a stale value is acceptable within the TTL.

The cache key pattern:

text

{resource_type}:{identifier[:subidentifier]}
Examples:

permissions:usr_9f2a — the RBAC permissions for a user
poll:results:pll_44 — the cached results for a poll
evidence:hash:9e107d9d... — the cached hash for an evidence file
The cache invalidation pattern:

TTL-based: the cache entry expires after a configurable TTL
Tag-based: bulk invalidation by tag (e.g., invalidateCacheByTag('user:usr_9f2a') to invalidate all entries for a user)
Write-through: write the new value to the cache when writing to the database
6.2 The Rate Limiting Pattern
Every endpoint is rate-limited. The rate limit is per-endpoint and per-user (or per-IP for unauthenticated endpoints). The algorithm is sliding window (not fixed bucket), which is more accurate for burst detection.

The rate limit middleware:

Reads the rate limit configuration from the database (or the cache)
Checks the current count for the key (user + endpoint + window)
Increments the count
Returns 429 with a Retry-After header if the limit is exceeded
The default rate limits are in Infrastructure.md §6.3. Module-specific overrides are in the module specs.

6.3 The "Cache First, Rate Limit First" Principle
Both layers are checked before any processing. This is the "cache first, rate limit first" principle from §1.1. The order matters:

Rate limit first: if the request is rate-limited, reject it immediately. Don't waste time on cache lookups for malicious traffic.
Cache first: if the cache has the value, return it. Don't waste database queries for repeated requests.
Database: only if the cache misses, query the database.
Write: if the request is a mutation, write to the database and invalidate the cache.
This order is enforced by the request middleware stack.

7. Authentication and Authorization
   The authentication and authorization patterns are documented in detail in Security.md §3 and RBAC.md. This section provides the architectural overview.

7.1 Authentication
The platform uses JWT-based authentication:

Token format: JWT, signed with HS256
Token lifetime: 7 days (sliding window)
Token storage (web): httpOnly cookie, Secure, SameSite=Strict
Token storage (mobile): Expo SecureStore (encrypted)
The identity verification (NIMC NVS API or Onfido) is the foundation for all gated features. Verified users can vote, upload evidence, and be matched with lawyers.

Detailed: Security.md §3.1, modules/Authentication & Identity Verification.md.

7.2 Authorization
The platform uses CASL for RBAC. The permission model is in RBAC.md. Key principles:

Role-based defaults: each role has a default set of abilities (defined in defineAbilityFor)
Per-user overrides: admins can grant or revoke individual permissions (stored in user_permissions)
Conditional permissions: abilities can include conditions (e.g., { uploaderId: user.id })
Defense in depth: RBAC is enforced at the API route, the service layer, and the database query layer
Self-protection: admins cannot suspend themselves, change their own role, or remove the last admin
Detailed: Security.md §3.2, RBAC.md.

7.3 The Voter Token Anonymization (Special Case)
The most important authorization design is the voter token hash. Per ADR-009:

poll_votes and confidence_votes have no user_id column
The voter_token_hash is SHA-256(user_id + poll_id + pepper)
The pepper is shared between poll_votes and confidence_votes to prevent cross-table correlation
The pepper is rotated annually and on staff departure
The DB-level UNIQUE constraint prevents double-voting
This is the binding constraint for the Amara persona. Every design decision around voting must satisfy this constraint.

8. Security
   The security architecture is documented in detail in Security.md. This section provides the architectural overview.

8.1 The Security Principles
Principle Application
Defense in depth RBAC at three layers; encryption at multiple layers; audit logging at every state change
Least privilege CASL conditions; per-user overrides; no implicit grants
Zero trust Every request authenticated and authorized, even from "internal" sources
Encryption everywhere TLS 1.3 in transit; AES-256 at rest for sensitive data
Audit by default Every state change logged; append-only logs; 7-year retention for NDPR
Fail safe When something goes wrong, deny access by default
No secrets in code Environment variables only; rotated annually
No PII in logs Structured logger; PII only at DEBUG in development
Verify, don't trust Zod at every boundary; CASL at every authorization check
Detailed: Security.md §1.

8.2 The Compliance Posture
The platform is designed to comply with:

NDPR (Nigeria Data Protection Regulation): data sovereignty, DSAR, breach notification, retention
NBA (Nigerian Bar Association) Rules: no fee-splitting, no advertising by lawyers, confidentiality
Electoral Act: non-binding nature of polls, election-adjacent restrictions
Cybercrime Act: content moderation, user safety
Consumer Protection Act: transparent pricing, clear ToS
NIMC Act: national identity verification compliance
Detailed: Security.md §9.

8.3 The Incident Response
The incident response workflow is in Security.md §10. Severity levels, response times, and the post-mortem policy are documented.

9. Observability
   The observability architecture is documented in Infrastructure.md §6. This section provides the architectural overview.

9.1 The Three Pillars
The platform uses the three pillars of observability:

Pillar What Where
Logs Structured JSON logs with request ID, user ID, action, status, duration stdout → log aggregator → searchable
Metrics Counters, gauges, histograms for request rate, error rate, latency, cache hit rate, queue size, etc. Prometheus-compatible → dashboard
Traces Request ID propagated through the call chain; slow operations traced explicitly OpenTelemetry-compatible (when we adopt it)
9.2 The Structured Logger
All logs are structured JSON. The fields:

JSON

{
"level": "info",
"timestamp": "2026-07-20T10:30:00.000Z",
"message": "API request",
"method": "POST",
"path": "/api/cases",
"status": 201,
"duration": 124,
"userId": "usr_9f2a",
"requestId": "req_abc123"
}
What is NOT logged: passwords, API keys, full NIN, full NVS response, vote choice, PII at INFO level, session tokens.

Detailed: Engineering.md §10.4.

9.3 The Audit Log
Every state change creates an audit log entry. The audit log is:

Append-only (no edits or deletes, except for DSAR-driven deletion which is itself logged)
Comprehensive (who, what, whom, why, before/after, when, where)
Retained per the legal requirements (7 years for NDPR)
Queryable by the engineering team and the Board
Separate from the main audit log is the admin audit log, which captures high-stakes admin actions (suspensions, role changes, etc.) with full context.

Detailed: Database.md §12, Engineering.md §10.4.

10. Error Handling
    The error handling pattern is a cross-cutting concern. The pattern:

10.1 The Error Hierarchy
The platform has a hierarchy of typed errors. Each module defines its own error types in services/<module>/errors.ts.

text

Error
├── ValidationError
│ ├── InvalidInputError
│ ├── MissingFieldError
│ └── FormatError
├── AuthenticationError
│ ├── InvalidTokenError
│ ├── ExpiredTokenError
│ └── InvalidCredentialsError
├── AuthorizationError
│ ├── InsufficientPermissionError
│ ├── ResourceAccessError
│ └── RoleRequiredError
├── BusinessError
│ ├── DuplicateVoteError
│ ├── PollClosedError
│ ├── CaseStatusError
│ └── InsufficientEvidenceError
├── VerificationError
│ ├── NIMCVerificationError
│ ├── OnfidoVerificationError
│ └── ManualVerificationError
├── RateLimitError
│ ├── LimitExceededError
│ └── BlockedError
└── SystemError
├── DatabaseError
├── CacheError
├── StorageError
└── ExternalServiceError
10.2 The Error Response Format
All API errors return the same format:

JSON

{
"success": false,
"error": {
"code": "ERROR_CODE",
"message": "Human-readable message",
"details": { /_ error-specific context _/ }
},
"meta": {
"timestamp": "2026-07-20T10:30:00.000Z",
"requestId": "req_abc123"
}
}
The code is from a standard set; the message is human-readable and actionable; the details are error-specific (e.g., the missing field, the rate limit count).

Detailed: API.md §1.5, ARCHITECTURE.md §10.2.

10.3 The Error Handling Strategy
Layer What it does
Service layer Throws typed errors; includes context; logs before throwing (with correlation IDs)
API layer Catches all service errors; maps to HTTP status codes; formats the error response; adds rate limit headers (if applicable); adds permission details (for 403 errors)
Web layer Catches errors in Server Functions; shows user-friendly messages; logs with stack traces
The error never leaks internal details to the client. Stack traces are only in the logs, not in the response. Internal error messages are logged at DEBUG; user-facing messages are at INFO.

Detailed: Engineering.md §4.5.

11. Performance
    The performance targets are summarized here. The detailed targets per endpoint are in the module specs and in Infrastructure.md §6.

11.1 The Performance Budget
Category Target Notes
API read (cache hit) < 50ms P95 The cache is the first line
API read (cache miss) < 200ms P95 Database query + cache write
API write (simple) < 100ms P95 Single-row update
API write (complex) < 500ms P95 Multi-row update, joins, notifications
Evidence upload (10 MB) < 5s P95
NIMC verification < 3s P95
Onfido verification < 10s P95
Mobile app cold start < 3s
Mobile API call < 1s P95
Web app initial load < 2s P95
11.2 The Performance Practices
Practice Where
Cache first Every read checks the cache before the database
Connection pooling Database connections are pooled
Index everything Every foreign key and frequently-queried column is indexed
Lazy load Frontend lazy loads non-critical resources
Compress Images are compressed; data is compressed on the wire
Minimize Bundle sizes are minimized; tree-shaking is enabled
Detailed: Engineering.md §15, Infrastructure.md §6.

12. The Engineering Workflow
    The engineering workflow is documented in detail in Engineering.md. This section provides the architectural overview.

12.1 The Development Cycle
Spec first: every feature starts with a module spec
Branch: feature branches off main
Code: with the standards (Engineering.md §4)
Test: with the strategy (QA.md)
Review: with the checklist (Engineering.md §11)
CI: every PR runs the full test suite + the fee model grep + the security tests
Merge: to main after approval
Deploy: to staging, then to production (blue-green)
Monitor: for 1 hour after the swap
12.2 The Two Pairs of Eyes Rule
Some changes require two reviewers because of their impact:

Schema changes affecting PII
Authentication or authorization changes
Fee model changes
External-facing API changes
The rule is not bureaucratic; it's the platform's commitment to not making consequential changes in haste.

Detailed: Engineering.md §11.4.

12.3 The Decision Log
Every meaningful decision is recorded in the Decision Log. Technical decisions are also recorded as ADRs in ADRs.md. This is the institutional memory.

13. Document Map
    The technical documentation is organized into focused documents. This section is the navigation index.

13.1 The Focused Documents
Document What it covers When to read it
ARCHITECTURE.md System philosophy, high-level architecture, cross-cutting patterns First read; navigation
Tech Stack.md The technology choices, versions, alternatives When choosing or evaluating a dependency
ADRs.md The architectural decisions (12+ ADRs) When understanding why a decision was made
Engineering.md Coding standards, CI, code review, the fee model grep Daily reference; the "how we write code"
QA.md Testing strategy, the negative test rule, security tests When writing tests; the "how we verify the code"
Database.md The database schema, conventions, the anonymization pattern When querying the schema; the "what the data looks like"
Security.md Threat model, controls, compliance, incident response When evaluating a security change; the "what we defend against"
Infrastructure.md Deployment, backup, scaling, monitoring, runbooks When deploying; the "how we run it"
API.md The API reference (endpoints, request/response) When integrating with the API; the "what the API does"
RBAC.md The RBAC model, roles, permissions, conditions When implementing a permission check; the "who can do what"
13.2 The Module Specifications
Each of the 11 modules has its own spec. The module specs are the contract for each module: business rules, data model, API surface, business rules, permissions, UX, NFRs, acceptance criteria.

Module Reference
Authentication & Identity Verification modules/Authentication & Identity Verification.md
Policy Polls modules/Policy Polls.md
Confidence Votes modules/Confidence Votes.md
Evidence Upload & Integrity modules/Evidence Upload & Integrity.md
Lawyer Onboarding & Verification modules/Lawyer%20Onboarding%20&%20Verification.md
Lawyer Matching & Consultation modules/Lawyer Matching & Consultation.md
Lawyer Reviews modules/Lawyer Reviews.md
Moderation modules/Moderation.md
Blog & Content modules/Blog & Content.md
Admin & Operations modules/Admin & Operations.md
Mobile App modules/Mobile App.md
13.3 The Cross-References
Many topics span multiple documents. Here are the most important cross-references:

Topic Where it's covered Cross-references
Voter anonymization ADR-009 Database.md §4.3, Security.md §3.3, Engineering.md §7
Flat subscription model ADR-011 Engineering.md §6, Business.md §5.4
Self-hosted VPS ADR-008 Infrastructure.md §2, Security.md §12
Single service architecture ADR-007 ARCHITECTURE.md §1.2
Manual bar verification ADR-012 modules/Lawyer Onboarding & Verification.md §3.3
The negative test rule QA.md §8 Engineering.md §3.6, every module spec's "Acceptance Criteria" section
The fee model grep Engineering.md §6 ADR-011
13.4 The Onboarding Path
For new team members, the recommended reading order:

PLATFORM.md — what we're building and why
ARCHITECTURE.md — this document, the system philosophy
ADRs.md — the 12 key architectural decisions
Tech Stack.md — the technology choices
Engineering.md — the engineering standards
QA.md — the testing strategy
Database.md — the schema
Security.md — the security architecture
Infrastructure.md — the deployment
At least 3 module specs in depth (recommend: Authentication, Policy Polls, Lawyer Onboarding) 14. Open Architectural Questions

# Question Owner Status

1 When do we need to migrate to horizontal scaling? (What's the trigger metric?) Engineering Lead Open — based on capacity monitoring
2 Should we adopt OpenTelemetry for distributed tracing? Engineering Lead Open — Y2 candidate
3 Should we migrate to a managed PostgreSQL service (RDS, etc.)? Engineering Lead Open — NDPR may require self-hosting
4 Should we move to a different cache (Redis) in Y2? Engineering Lead Open — based on multi-instance need
5 Should we add a public API for third-party developers? Engineering Lead + Product Lead Open — Y3 candidate
Resolved questions move to the Decision Log and the ADRs.

Appendix A: Cross-Cutting Concerns Quick Reference
Concern Where it lives How it's enforced
Authentication services/auth.service.ts JWT middleware in the API and Server Functions
Authorization (RBAC) lib/rbac/ability.ts CASL conditions; requirePermission middleware
Rate limiting rate-limit/ Per-endpoint middleware; sliding window
Caching cache/ Cache-first principle; TTL + tag-based invalidation
Audit logging services/audit.service.ts Every state change logs; append-only
Observability lib/logger.ts, lib/metrics.ts Structured logs; metrics; traces
Error handling services/<module>/errors.ts Typed errors; standard response format
Validation lib/validation/ Zod schemas; shared across all entry points
Security Cross-cutting TLS 1.3, encryption at rest, RBAC, audit
Performance Cross-cutting Cache first, indexes, lazy load, compress
Appendix B: Architectural Constraints Summary
These constraints come from the platform's mission, the regulatory environment, and the trust contract with the users. They are non-negotiable.

Constraint Source Enforced by
All polls are non-binding PLATFORM.md §2.2, PLATFORM.md §3.1.7 Disclaimers on every poll page; the Amara test
Votes are anonymized ADR-009 No user_id column; hash; pepper rotation
The platform does not take a percentage of legal fees ADR-011 Data model; service code; CI grep; code review
Data is stored within Nigeria (NDPR) ADR-008 Self-hosted VPS in Nigeria
All state changes are audit-logged Security.md §8 The audit log service
Moderation is human-in-the-loop PLATFORM.md §8.5.2 The AI only flags; humans decide
Lawyers cannot see citizen identity before consultation modules/Lawyer Matching & Consultation.md §3.6 API-level enforcement; the Ngozi test
Evidence integrity is verified on every access modules/Evidence Upload & Integrity.md §3.1.2 Re-hash on access; integrity mismatch triggers alert
Admin actions are audit-logged and require reason modules/Admin & Operations.md §3.1.1 The admin audit log; reason codes
The same moderator cannot decide both the original and the appeal modules/Moderation.md §3.3 Reviewer reassignment at the queue level
Appendix C: The "Why" Behind the Architecture
This appendix captures the most important "why" questions and points to where the answer is:

Why question Where it's answered
Why a single deployable service? ADR-007
Why TanStack Start + Hono? Tech Stack.md §2.2, Tech Stack.md §2.3, ADR-002
Why Bun? Tech Stack.md §2.1, ADR-001
Why PostgreSQL? Tech Stack.md §2.6, ADR-003
Why SQLite for cache and rate limit? Tech Stack.md §2.7, ADR-004
Why CASL? Tech Stack.md §2.12, ADR-006
Why Drizzle? Tech Stack.md §2.5, ADR-005
Why self-hosted VPS? Tech Stack.md §2.18, ADR-008
Why no user_id on vote tables? ADR-009
Why flat subscription, not percentage? ADR-011
Why manual bar verification? ADR-012
Why the negative test rule? QA.md §8
Why the fee model grep? Engineering.md §6, ADR-011
Appendix D: Glossary
AB — Advisory Board
ADR — Architectural Decision Record
AI — Artificial Intelligence
API — Application Programming Interface
CASL — JavaScript library for role-based access control
CDN — Content Delivery Network
DSAR — Data Subject Access Request (under NDPR)
GC — Grievance Committee
JWT — JSON Web Token
LGA — Local Government Area
MDX — Markdown with JSX
NBA — Nigerian Bar Association
NDPR — Nigeria Data Protection Regulation
NDPC — Nigeria Data Protection Commission
NIN — National Identification Number
NVS — National Verification Service (NIMC)
RBAC — Role-Based Access Control
RPO — Recovery Point Objective
RTO — Recovery Time Objective
SHA-256 — Secure Hash Algorithm 256-bit
SLA — Service Level Agreement
SSR — Server-Side Rendering
TLS — Transport Layer Security
UGC — User-Generated Content
VPN — Virtual Private Network
WCAG — Web Content Accessibility Guidelines
Appendix E: Changelog
Version Date Author Changes
2.0.0 2026-07-20 Engineering Lead Major rewrite. The document is now the architectural overview and navigation index. The detailed technical content has been extracted into focused documents (Tech Stack, ADRs, Engineering, QA, Database, Security, Infrastructure). The architectural principles, the high-level diagram, the services layer pattern, the data layer overview, the cache and rate limiting patterns, the authentication and authorization overview, the security principles, the observability overview, the error handling pattern, the performance budget, the engineering workflow overview, and the document map remain here. Everything else is in the focused documents.
1.0.0 2026-07-20 Engineering Lead Superseded by 2.0.0. First consolidated release. Changes from the prior draft: removed the duplicated permissions matrix (was in both §4.3 and §12.2 — now §12.2 references §4.3), filled in the previously empty Cache Client, Cache Key Patterns, and Schema Design sections, standardized the cache table name to cache_entries everywhere, and fixed invalid inline INDEX syntax in the rate-limit SQL (moved to standalone CREATE INDEX statements, which is required by both PostgreSQL and SQLite)
