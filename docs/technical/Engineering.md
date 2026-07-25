# Engineering Standards

_Document Version: 1.0.0_
_Last Updated: 2026-07-20_
_Status: Active_
_Owner: Engineering Lead_

> **Changelog:**
>
> - 1.0.0 (2026-07-20) — Initial set. Establishes coding standards, CI enforcement, the fee model grep audit, code review requirements, and the engineering practices that aren't in the architecture document.

> **How to read this document:** This is the **"how we write code"** document. It complements [ARCHITECTURE.md](../ARCHITECTURE.md) (the "what we built") and [ADRs.md](../ADRs.md) (the "why we decided"). For the testing strategy, see [QA.md](./QA.md) (forthcoming). For the operational deployment, see [Infrastructure.md](./Infrastructure.md) (forthcoming).

> **Related documents:**
>
> - [ARCHITECTURE.md](../ARCHITECTURE.md) — the architectural context
> - [ADRs.md](../ADRs.md) — the architectural decisions
> - [API.md](./API.md) — the API contract
> - [QA.md](./QA.md) — the testing strategy (forthcoming)
> - [Database.md](./Database.md) — the database schema (forthcoming)

---

## 1. Core Principles

These are the engineering principles that guide every decision. They are not aspirational; they are enforced by code review and CI.

| Principle                   | Application                                                                                                                         | Enforcement                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Single source of truth**  | All business logic lives in the services layer. Routes, actions, and components only handle validation, auth, and response shaping. | Code review; architecture tests          |
| **No reverse dependencies** | Services never import from web actions or API routes.                                                                               | ESLint rule (import boundaries)          |
| **Cache first**             | Every request checks the cache before any database query.                                                                           | Code review                              |
| **Rate limit first**        | Every endpoint enforces rate limits before any processing.                                                                          | Code review; integration tests           |
| **Type safety end-to-end**  | TypeScript strict mode, Zod validation at boundaries, no `any` without justification.                                               | `tsc` strict mode; ESLint rule for `any` |
| **Test before merge**       | Every PR must include unit tests and integration tests where applicable.                                                            | CI check                                 |
| **Audit by default**        | Every state change is audit-logged.                                                                                                 | Code review; schema check                |
| **Least privilege**         | Users have minimum permissions needed for their role.                                                                               | CASL conditions; RBAC tests              |

---

## 2. Project Structure

The folder structure is defined in [ARCHITECTURE.md §2.1](../ARCHITECTURE.md#21-complete-folder-structure). The key rules:

### 2.1 Import Boundaries

Imports must follow the dependency graph. The ESLint configuration enforces this:
app/ → can import from: services, lib, shared-types
server/ → can import from: services, lib, shared-types
mobile/ → can import from: shared-types (not from app/, server/, or services/)
services/ → can import from: lib, shared-types, db, cache, rate-limit
lib/ → can import from: shared-types, db (for query helpers)
db/ → can import from: shared-types
cache/ → can import from: shared-types
rate-limit/ → can import from: shared-types
shared-types/ → no imports from other internal modules

text

The reverse is forbidden. `services/` cannot import from `app/`, `server/`, or `mobile/`. This is enforced by an ESLint rule (`import/no-restricted-paths`).

### 2.2 File Naming

- **Folders:** `kebab-case` (e.g., `lawyer-onboarding/`)
- **Files (TypeScript):** `camelCase` for utilities, `PascalCase` for React components
- **Files (TypeScript):** `kebab-case` for React pages (e.g., `page-1.tsx`, `page-2.ts`)
- **Files (SQL):** `snake_case` for migrations (e.g., `0001_polls.sql`)
- **Files (Markdown):** `kebab-case` for documents (e.g., `user-journeys.md`)

### 2.3 Module Organization

Each module is a self-contained folder with:

- The service(s) that implement the business logic
- The schema(s) that define the data model
- The tests (unit, integration, e2e)
- The documentation (module spec)

Cross-module dependencies are explicit. A module may import another module's service only via a documented interface, not via direct file imports.

---

## 3. TypeScript Standards

### 3.1 Compiler Configuration

`tsconfig.json` is configured with:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `strictBindCallApply: true`
- `strictPropertyInitialization: true`
- `noImplicitThis: true`
- `alwaysStrict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

These flags are not negotiable. Any relaxation requires a documented ADR.

### 3.2 The `any` Rule

`any` is forbidden. Use:

- `unknown` when the type is genuinely unknown
- A specific type or interface when the type is known
- A generic (`<T>`) when the type is parametric
- `// eslint-disable-next-line` with a comment explaining why when `any` is genuinely necessary (e.g., a third-party type that's wrong)

ESLint enforces this with `@typescript-eslint/no-explicit-any: "error"`.

### 3.3 Type Organization

- **Types vs. interfaces:** Prefer `type` for unions, intersections, and mapped types. Prefer `interface` for object shapes that may be extended. Be consistent.
- **Naming:** `PascalCase` for types and interfaces. No `I` prefix.
- **Exports:** Export types from a `types.ts` file when used across modules. Don't export from a service file unless necessary.
- **Comments:** JSDoc comments for public types. Inline comments for non-obvious choices.

### 3.4 Zod Validation

Zod is the standard for runtime validation. Every API boundary (request body, query params, response shape) is validated with Zod.

- Zod schemas live in `lib/validation/`
- Schemas are the source of truth for both runtime validation and TypeScript types (use `z.infer<typeof schema>`)
- Every endpoint has a Zod schema for its request and response
- Schemas are versioned with the API

### 3.5 Bun-Specific Types

Bun has its own types (`Bun.serve`, `Bun.sql`, `Bun.password`, etc.). Use them directly. Don't wrap Bun APIs in abstractions unless the abstraction adds clear value.

---

## 4. Code Style

### 4.1 Formatter and Linter

- **Formatter:** Prettier (the team's standard config)
- **Linter:** ESLint with the TypeScript plugin and the import boundaries plugin
- **Pre-commit:** Husky + lint-staged runs Prettier and ESLint on staged files
- **CI:** ESLint and Prettier run on every PR

### 4.2 Naming Conventions

| Construct            | Convention                                     | Example                           |
| -------------------- | ---------------------------------------------- | --------------------------------- |
| Variables            | `camelCase`                                    | `userId`, `isVerified`            |
| Functions            | `camelCase`                                    | `getUserById`, `verifyNin`        |
| Classes              | `PascalCase`                                   | `UserService`, `PollStateMachine` |
| Interfaces           | `PascalCase`                                   | `User`, `PollResults`             |
| Types                | `PascalCase`                                   | `UserRole`, `PollStatus`          |
| Enums                | `PascalCase` (members: `SCREAMING_SNAKE_CASE`) | `PollStatus.ACTIVE`               |
| Constants            | `SCREAMING_SNAKE_CASE`                         | `MAX_UPLOAD_SIZE`                 |
| Files (utilities)    | `camelCase`                                    | `userService.ts`, `hashToken.ts`  |
| Files (components)   | `PascalCase`                                   | `PollCard.tsx`, `UserProfile.tsx` |
| Database tables      | `snake_case` (plural)                          | `users`, `poll_votes`             |
| Database columns     | `snake_case`                                   | `user_id`, `poll_id`              |
| API endpoints        | `kebab-case` (in URLs)                         | `/api/lawyer-matching`            |
| API resources (JSON) | `camelCase`                                    | `userId`, `pollId`                |

### 4.3 Imports

- Use explicit imports (not `import * as`)
- Group imports: external, internal, types
- Sort imports alphabetically within each group
- Use `import type` for type-only imports
- No circular imports (enforced by ESLint)

### 4.4 Functions

- Prefer pure functions where possible
- Functions should do one thing
- Functions should be short (< 50 lines is a soft target)
- Use early returns to reduce nesting
- Use named parameters (object destructuring) for functions with multiple parameters
- Document public functions with JSDoc

### 4.5 Error Handling

- Use typed errors (defined per module in `services/<module>/errors.ts`)
- Never swallow errors silently
- Never use `any` in catch blocks
- Log errors with context (request ID, user ID where appropriate)
- Return typed errors from services; routes translate to HTTP responses
- Errors are documented in the module spec (§3.5 of each spec)

### 4.6 Comments

- Comments explain _why_, not _what_
- Code is self-documenting where possible
- JSDoc for public APIs (services, routes, utilities)
- TODO comments include the owner's name and a date
- No commented-out code (delete it; Git remembers)

### 4.7 Async/Await

- Always use `async`/`await`, not `.then()`
- Handle promise rejections explicitly
- Use `Promise.all` for parallel async operations
- Use `Promise.allSettled` when partial failure is acceptable
- Never use `async` in a non-async function (no `async () =>` returning a non-Promise)

---

## 5. Testing Standards

See [QA.md](./QA.md) (forthcoming) for the full testing strategy. Summary:

| Test type                 | Coverage target                                                       | Owner            |
| ------------------------- | --------------------------------------------------------------------- | ---------------- |
| Unit tests (services)     | ≥ 85%                                                                 | Module owner     |
| Unit tests (lib)          | ≥ 90%                                                                 | Module owner     |
| Integration tests (API)   | ≥ 70% of endpoints                                                    | Module owner     |
| E2E tests (user journeys) | All 8 journeys from [User Journeys.md](../product/User%20Journeys.md) | QA Lead          |
| Security tests            | All modules marked with "Security Tests (required)"                   | Engineering Lead |

**The negative test rule:** For every "user can do X" test, there must be a matching "user cannot do X" test. This is especially important for RBAC and privacy features.

**The CI check:** All tests run on every PR. No PR can be merged with failing tests.

---

## 6. The Fee Model Grep Audit

This is the most important CI check in the codebase. It enforces [ADR-011](../ADRs.md#adr-011--flat-subscription-model-for-lawyer-marketplace): the platform must never take a percentage of legal fees.

### 6.1 The Rule

Any code that calculates a percentage of a monetary value in the context of a lawyer–client engagement is a violation. The patterns to detect include (but are not limited to):

- `* 0.X` where the left operand is a fee and the right is a percentage
- `Math.round(... * 100) / 100` patterns applied to fees
- Comments containing "percentage", "split", "cut", "commission" in fee-related files
- New fields named `percentage`, `commission`, `platform_cut`, etc.

### 6.2 The Grep

The audit runs as a CI step. The current patterns:

```bash
# In services/ and any file that touches lawyer fees:

# Pattern 1: percentage calculations on fees
grep -rE '\b(legalFee|consultationFee|hourlyRate)\b.*\*\s*0\.[0-9]+' \
  services/ modules/ lib/

# Pattern 2: percentage-related field names
grep -rE '\b(percentage|commission|platformCut|platformFee|revenueShare)\b' \
  services/ db/schema/ \
  | grep -v node_modules

# Pattern 3: comments about fee splitting
grep -rE '(percentage|split|cut|commission).*(fee|legal|consultation)' \
  services/ modules/ lib/ \
  | grep -v node_modules
If any pattern matches, the build fails.

6.3 False Positives
The grep may have false positives (e.g., the word "percentage" in a non-fee context). The Legal Director reviews any false positive and adds an explicit allowlist to the grep configuration.

6.4 Updating the Patterns
The patterns are updated as the codebase evolves. Any new pattern that could encode a percentage-of-fees calculation must be added to the grep. The Legal Director reviews all changes to the grep configuration.

6.5 Bypassing the Grep
There is no bypass. If a legitimate use case requires a pattern that the grep flags, the code is wrong, not the grep. The Engineering Lead and Legal Director must approve any change to the grep.

7. The Voter Token Pepper Management
This is the most security-sensitive constant in the codebase. Per ADR-009, the pepper is used to anonymize votes.

7.1 The Rule
The pepper is a 256-bit random value stored as an environment variable. It is loaded at server startup and held in memory. It is never logged, never written to a file (except the env file on the server), and never sent to the client.

7.2 Access Control
The environment variable is set in the server's environment (not in code)
The env file is readable only by the server process and the Engineering Lead
The pepper is not in version control (the env file is gitignored)
The pepper is not in the codebase (no fallback values, no comments about it)
7.3 Rotation
Annual rotation (scheduled): the pepper is rotated once a year. All existing votes become invalid; users must re-vote on active polls.
Emergency rotation (on compromise): the pepper is rotated immediately. The same invalidation applies. The Board is notified. NDPC is notified if required by breach notification rules.
Rotation is documented in the runbook. The Legal Director signs off on every rotation.
7.4 Verification
The pepper is verified at server startup with a self-test:

The server generates a test hash with a known input
The server verifies the hash matches the expected output
If the test fails, the server refuses to start
This catches configuration errors (e.g., a typo in the env var) before they reach production.

8. Database Migrations
Drizzle migrations are used to evolve the schema. The rules:

8.1 Migration Files
One migration per change
Migrations are append-only (never edited after being committed)
Migration files are named NNNN_description.sql (sequential number, underscore-separated description)
Migrations include both the up and down SQL (Drizzle generates both)
8.2 Migration Workflow
Modify the schema in db/schema/*.ts
Generate the migration: bun drizzle-kit generate
Review the generated SQL for correctness
Test the migration on the staging database
Apply the migration to production: bun drizzle-kit migrate
Verify the schema and data
Commit the schema, the migration, and the test
8.3 Dangerous Migrations
Some migrations are dangerous:

Adding a NOT NULL column without a default: breaks existing rows
Dropping a column: loses data
Changing a column type: may fail for existing data
Adding a unique constraint: may fail if duplicates exist
Dangerous migrations require:

A review by the Engineering Lead
A staging dry-run
A documented rollback plan
A communication to the team before the production deploy
8.4 Backwards Compatibility
Schema changes that break the API require a versioned deployment (new code first, then the migration). The reverse is forbidden (migration first would break the running code).

9. API Design
The API is documented in API.md. The design rules:

9.1 REST Conventions
Use HTTP methods correctly: GET for reads, POST for creates, PUT for updates, DELETE for deletes
Use plural nouns for resources (/api/polls, not /api/poll)
Use kebab-case in URLs (/api/lawyer-matching, not /api/lawyerMatching)
Use HTTP status codes correctly: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 429 (Too Many Requests), 500 (Internal Server Error), 503 (Service Unavailable)
Use the response format from ARCHITECTURE.md §13.1 for all responses
9.2 Error Codes
Error codes are uppercase, snake-case (POLL_NOT_ACTIVE, VERIFICATION_REQUIRED)
Error codes are stable (don't change once published)
Error codes are documented in the module spec
Error messages are human-readable, in plain language, and actionable
9.3 Pagination
Use cursor-based pagination (not offset-based) for all lists
Default page size: 20
Max page size: 100
The cursor is opaque (base64-encoded JSON; clients should not parse it)
9.4 Versioning
Breaking changes require a new version prefix (/api/v2/)
The previous version is supported for at least 6 months
Deprecated endpoints return Deprecation and Sunset headers
The OpenAPI spec is versioned with the API
10. Security Practices
The security architecture is in ARCHITECTURE.md §12. The engineering practices:

10.1 Secrets Management
All secrets are environment variables (never in code)
The .env file is gitignored
The .env.example file documents the required variables (with placeholder values)
Secrets are rotated per the schedule in the runbook
Secrets are never logged, even in debug mode
10.2 Input Validation
Every API request is validated with Zod at the boundary
Every database query uses parameterized queries (Drizzle does this by default)
Every file upload is validated for type, size, and (where applicable) content
User input is never trusted; always validated
10.3 Authentication and Authorization
JWTs are short-lived (7 days, refreshed)
JWTs are stored in httpOnly cookies (web) or SecureStore (mobile)
RBAC is enforced at the API route AND the service layer (defense in depth)
The Amara test, Tunde test, Ngozi test, and Kemi test are applied to every design that affects the corresponding persona
10.4 Logging
Use the structured logger from lib/logger.ts
Never log PII, secrets, or tokens
Log levels: ERROR (failures), WARN (rate limits, permission denied, performance), INFO (user actions, API calls), DEBUG (development only)
Every log entry includes a request ID for correlation
Logs are queryable by the engineering team and the Board for oversight
10.5 Dependency Management
Use bun.lock for reproducible installs
Run bun audit weekly for vulnerability scanning
Update dependencies monthly (or immediately for security advisories)
Pin major versions in package.json; allow minor and patch updates
Review new dependencies before adding them (license, maintenance, security)
11. Code Review
11.1 The Review Process
The author opens a PR
CI runs: type check, lint, tests, the fee model grep, the voter token pepper self-test
The author requests a review from the appropriate reviewer(s)
The reviewer reviews the code, the tests, and the documentation
The reviewer either approves or requests changes
The author addresses feedback
The reviewer approves
The PR is merged
11.2 Reviewer Assignments
Change type	Reviewer(s)
General code	One Engineering team member
Service layer	Engineering Lead
Database schema	Engineering Lead
Security-sensitive code (auth, encryption, RBAC)	Engineering Lead + Legal Director
Fee model changes	Engineering Lead + Legal Director (joint sign-off)
Voter token pepper changes	Engineering Lead + Legal Director (joint sign-off)
API endpoints	Engineering Lead
UI components	Design Lead + Engineering Lead
Content (blog, legal literacy)	Content Lead
Documentation	Document owner
11.3 Review Checklist
The reviewer checks:

 Code follows the style guide
 TypeScript is strict (no any without justification)
 Tests are included and pass
 The fee model grep passes
 The change doesn't break the import boundaries
 Security practices are followed
 Audit logging is in place for state changes
 Documentation is updated (if applicable)
 The change is tested manually (for non-trivial changes)
 The change doesn't introduce new dependencies without review
11.4 The "Two Pairs of Eyes" Rule
Some changes require two reviewers because of their impact:

Schema changes affecting PII: Engineering Lead + Legal Director
Authentication or authorization changes: Engineering Lead + Legal Director
Fee model changes: Engineering Lead + Legal Director
External-facing API changes: Engineering Lead + Product Lead
This is not bureaucratic; it's the platform's commitment to not making consequential changes in haste.

12. Git Workflow
12.1 Branching
Main branch: main (always deployable)
Feature branches: feature/<short-description> (e.g., feature/policy-polls-anonymization)
Bugfix branches: bugfix/<short-description> (e.g., bugfix/login-rate-limit)
Hotfix branches: hotfix/<short-description> (e.g., hotfix/ai-detection-crash) — branched from main, merged back to main and the current release branch
12.2 Commit Messages
Use the Conventional Commits format:

text

<type>(<scope>): <description>

[optional body]

[optional footer]
Types:

feat — a new feature
fix — a bug fix
docs — documentation only
style — formatting, no code change
refactor — code change that neither fixes a bug nor adds a feature
perf — performance improvement
test — adding or fixing tests
chore — build, CI, or other tooling
Example:

text

feat(policy-polls): implement voter token hash anonymization

Implements ADR-009: votes are stored as SHA-256(user_id + poll_id + pepper)
with no user_id column. The pepper is loaded from the environment.

Closes #123
12.3 Pull Requests
PRs are small (< 500 lines of code change is a soft target)
PRs have a clear description: what, why, how
PRs reference the relevant module spec, ADR, or issue
PRs are reviewed before merge
PRs are squashed and merged to main
13. Documentation
13.1 Code Documentation
JSDoc for public APIs (services, routes, utilities)
Inline comments for non-obvious choices
README in each module folder (if the module is complex)
Architecture Decision Records for significant decisions (see ADRs.md)
13.2 API Documentation
The API is documented in API.md and the OpenAPI spec
Every endpoint is documented
Every error code is documented
The OpenAPI spec is the machine-readable contract; the human-readable doc and the spec are kept in sync via CI
13.3 Module Documentation
Every module has a module spec (see Module Specification Template)
The module spec is the contract: business rules, data model, API surface, business rules, permissions, UX, NFRs, acceptance criteria
The module spec is updated when the module changes
14. Observability
The observability architecture is in ARCHITECTURE.md §9. The engineering practices:

14.1 Logging
Use the structured logger from lib/logger.ts
Every log entry includes: timestamp, level, message, request ID, user ID (where appropriate)
Log levels are used correctly (ERROR for failures, WARN for warnings, INFO for actions, DEBUG for development)
Logs are queryable by the engineering team
14.2 Metrics
Key metrics are defined in ARCHITECTURE.md §9.2
Metrics are emitted to the monitoring system (e.g., Datadog, Prometheus)
Dashboards are maintained for the key metrics
Alerts are configured for the key thresholds
14.3 Tracing
Request IDs are generated at the API entry point and propagated through the call chain
The request ID is included in all log entries for that request
Tracing is implemented for slow operations (> 500ms) and critical paths
14.4 Health Checks
/health endpoint returns the platform health
Health checks are deep (database, cache, rate limit, external services)
Health checks are lightweight (don't add load)
Health checks are used by the monitoring system and the load balancer
15. Performance Practices
The performance targets are in ARCHITECTURE.md §14. The engineering practices:

15.1 Caching
Check the cache before any database query (per the "cache first" principle)
Use appropriate TTLs (verification: 30 days, poll results: 1 hour, query: 5 minutes)
Invalidate the cache on writes
Use tagged invalidation for bulk operations
15.2 Database
Use indexes for frequently queried columns
Use connection pooling (configured for the expected load)
Use prepared statements (Drizzle does this)
Use pagination for all list queries
Avoid N+1 queries (use eager loading or batch queries)
Monitor slow queries and optimize
15.3 Frontend
Lazy load non-critical resources
Use the design system components (consistent, optimized)
Optimize images (WebP, lazy loading, size hints)
Minimize bundle size (tree-shake, code-split)
Cache API responses (TanStack Query)
15.4 Mobile
Same as frontend, plus:
Minimize local storage (use SecureStore only for sensitive data)
Compress images before upload
Use the offline queue for evidence uploads
Support low-bandwidth connections
16. Incident Response
16.1 Incident Severity
Severity	Definition	Response time
P1	Service is down or a critical feature is broken	Immediate (on-call)
P2	A non-critical feature is broken or significantly degraded	< 1 hour
P3	A minor issue or a question	< 1 business day
16.2 Incident Workflow
The issue is detected (alert, user report, monitoring)
The on-call engineer is notified
The on-call engineer assesses the severity
The on-call engineer takes action (investigate, mitigate, fix)
The on-call engineer communicates the status (transparency report, status page)
The incident is resolved
A post-mortem is written (for P1 and P2 incidents)
Action items are tracked
16.3 Post-Mortems
Post-mortems are blameless. The goal is to learn, not to blame. The post-mortem includes:

Timeline
Root cause
What went well
What went poorly
Action items
17. Open Standards Practices
17.1 Open Source
The codebase is not currently open source (decision pending)
Dependencies are open source where possible
Security advisories are monitored for all dependencies
17.2 Accessibility
WCAG 2.1 AA is the standard (per PLATFORM.md §15.1)
Every UI component is tested for accessibility
Accessibility is part of the definition of done
17.3 Internationalization
English only in the pilot
Local language support is a Year 2 feature
The data model supports translations (reserved)
Appendix A: Tools and Versions
Tool	Version	Purpose
Bun	1.0+	Runtime
TypeScript	5+	Language
Prettier	latest	Formatter
ESLint	latest	Linter
Husky	latest	Pre-commit hooks
lint-staged	latest	Run linters on staged files
Drizzle ORM	latest	Database ORM
Drizzle Kit	latest	Migration tool
Zod	latest	Runtime validation
TanStack Query	latest	Server state (web/mobile)
TanStack Form	latest	Form state (web)
TanStack Start	latest	Web framework
Hono	latest	API framework
CASL	latest	RBAC
shadcn/ui	latest	UI components
Tailwind CSS	latest	Styling
React Native	0.72+	Mobile framework
Expo	50+	Mobile toolchain
Jest or Bun test	latest	Unit testing
Supertest or Hono test	latest	API integration testing
Playwright or Maestro	latest	E2E testing
Sentry or similar	latest	Error tracking
Datadog or similar	latest	Metrics and monitoring
PostHog or similar	latest	Analytics
Appendix B: Related Documents
ARCHITECTURE.md — the architectural context
ADRs.md — the architectural decisions
API.md — the API contract
QA.md — the testing strategy (forthcoming)
Database.md — the database schema (forthcoming)
Security.md — the security architecture (forthcoming)
Infrastructure.md — the deployment architecture (forthcoming)
Decision Log — business-level decisions
Appendix C: Engineering Standards Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead	Initial set. Establishes coding standards, CI enforcement, the fee model grep audit (the most important CI check), the voter token pepper management, code review requirements, and the engineering practices that aren't in the architecture document.
```
