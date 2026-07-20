# Najia Community Bridge

A civic-technology platform connecting Nigerian citizens with governance feedback, verified evidence management, and legal access.

- Platform documentation: [`docs/Najia Community.md`](./docs/Najia%20Community.md)
- Technical architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## Status

Core slices built: authentication & identity, evidence integrity, policy polls, confidence votes (+ analytics), lawyer marketplace, and lawyer reviews. Each slice has a spec and tickets under [`.scratch/`](./.scratch). Next slices from the platform doc not yet implemented: AI manipulation detection (§4.3), moderation & content governance (§8), blog & content platform (§7), and governance/transparency reports (§14.2).

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
