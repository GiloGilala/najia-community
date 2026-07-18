# 1. Backend stack for the evidence-integrity pipeline (and platform foundation)

Date: 2025-01-01
Status: Accepted

## Context

Najia Community Bridge is greenfield. The first buildable slice is the evidence-integrity pipeline (`.scratch/evidence-integrity/spec.md`). The platform architecture doc (`civic-platform-architecture.md`, Section 6.3) specifies the stack in generic terms: Bun runtime, TypeScript, PostgreSQL, a "type-safe ORM", and Zod validation, with all business logic in a single services layer consumed by both a web app and a public/mobile API.

We need concrete tool choices for the foundation ticket (project skeleton + injectable collaborators + test harness) without committing the not-yet-built web/mobile layers.

## Decision

- **Runtime:** Bun (verified 1.3.14 locally) — native TypeScript, built-in test runner.
- **Language:** TypeScript, strict.
- **Test runner:** `bun test` (zero-config, no extra deps).
- **Database:** PostgreSQL.
- **ORM:** Drizzle (`drizzle-orm`) + `drizzle-kit` for migrations — the "type-safe ORM" from the doc.
- **Postgres driver:** `postgres` (postgres-js) for production and real test databases.
- **Validation:** Zod (`lib/validation/`), shared across entry points.
- **Collaborators are injected, not global:** a `FileStorage` interface (`lib/storage/`) and a `Clock` interface (`lib/clock/`). Services receive these so behaviour is deterministic and testable.
- **Test database driver is swappable behind one `DbConnection` shape:**
  - If `DATABASE_URL` is set, the harness uses real Postgres via postgres-js.
  - If unset, it falls back to embedded in-memory **PGlite** (`@electric-sql/pglite`), so tests run with zero external setup.

## Consequences

- The evidence service will be tested at a single seam (the service layer) with injected fake storage, a fixed clock, and a live DB (pglite by default), per the spec's agreed testing seam.
- **Test DB is currently PGlite**, chosen for zero-setup onboarding. This is a deliberate, temporary trade-off: PGlite is close to Postgres but not identical. When a real test `DATABASE_URL` is available, setting that env var switches both the harness and production onto postgres-js with no code change. Revisit/supersede this ADR if we standardise on real Postgres in CI.
- Web framework, mobile framework, object-store provider, and public-API framework are intentionally **not** decided here — they belong to later slices and their own ADRs.
- First PGlite query in a test process incurs a one-time WASM init cost (~few seconds); subsequent queries are fast.
