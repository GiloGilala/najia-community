# Najia Community Bridge

A civic-technology platform connecting Nigerian citizens with governance feedback, verified evidence management, and legal access.

- Platform documentation: [`docs/Najia Community.md`](./docs/Najia%20Community.md)
- Technical architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## Status

**All 9 core slices built and tested (209 new tests added July 2026):**

- ✅ Authentication & Identity
- ✅ Evidence Integrity
- ✅ Policy Sentiment Polls
- ✅ Confidence Votes + Analytics (Wilson interval, regional breakdown, trend)
- ✅ Lawyer Marketplace (matching, verification)
- ✅ Lawyer Reviews (ratings, moderation)
- ✅ **Blog & Content Platform (§7)** — categories, posts, comments, legal-literacy modules & enrollments (104 tests)
- ✅ **Moderation & Content Governance (§8)** — queue, rules, warnings, suspensions, appeals (91 tests)
- ✅ **AI Manipulation Detection (§4.3)** — results, method results, models, queue, heuristic detection (6 tests)
- ✅ **Governance & Transparency Reports (§14.2)** — templates, reports, sections, schedules, audit, export (8 tests)

Each slice has a spec and tickets under [`.scratch/`](./.scratch). No slices remain from the original platform doc — next work is API routes (Hono), web UI (TanStack Start), and mobile (Expo) per `docs/ARCHITECTURE.md`.

**Merged:** PR #2 `bd49a7f` — `arena/019f98ab-najia-community` → `master`

## Stack

Bun · TypeScript · Drizzle ORM · PostgreSQL · Zod. All business logic lives in the `services/` layer (single source of truth). See [`docs/adr/`](./docs/adr) for architecture decisions.

## Getting started

```bash
bun install
```

Copy `.env.example` to `.env` if you have a Postgres instance:

```bash
cp .env.example .env   # then set DATABASE_URL
```

`DATABASE_URL` is **optional**: with it unset, tests run against an embedded in-memory PGlite database (zero setup). Set it to switch onto real Postgres.

## Commands

```bash
bun run typecheck    # tsc --noEmit
bun test             # run the test suite
bun run db:generate  # generate Drizzle migrations from the schema
bun run db:migrate   # apply migrations
```

## Layout

```
services/         # all business logic (single source of truth)
db/               # schema, migrations, client (Postgres + PGlite factories)
lib/
  validation/     # shared Zod schemas
  storage/        # FileStorage interface + in-memory fake
  clock/          # injectable Clock + fixed-clock test double
test/             # harness + tests (seam: the services layer)
docs/adr/         # architecture decision records
docs/agents/      # agent-skill configuration (issue tracker, domain, labels)
```
