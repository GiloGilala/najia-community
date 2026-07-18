# Najia Community Bridge

A civic-technology platform connecting Nigerian citizens with governance feedback, verified evidence management, and legal access. See [`civic-platform-architecture.md`](./civic-platform-architecture.md) for the full platform documentation.

## Status

Greenfield. Active work: the **evidence-integrity pipeline** slice — see [`.scratch/evidence-integrity/spec.md`](./.scratch/evidence-integrity/spec.md) and the tickets under `.scratch/evidence-integrity/issues/`.

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
