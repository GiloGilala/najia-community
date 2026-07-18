# 01 — Project skeleton & injectable collaborators

**What to build:** A minimal, runnable project skeleton that establishes the layered architecture and the test seam every later ticket will cut through. Sets up the `services/`, `db/`, and `lib/validation/` layers, defines the **file-storage interface** with an in-memory fake for tests, defines the injectable **clock**, and wires a test harness to a real test Postgres. Nothing user-facing yet — this is the prefactor that makes the following changes easy.

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] Project layout exists per Section 6.2 (`services/`, `db/`, `lib/validation/`) and builds/runs
- [x] A file-storage interface is defined (`put(key, bytes)`, `get(key) -> bytes`, `exists(key)`) with an in-memory fake implementation usable in tests
- [x] A clock collaborator (`now() -> Date`) is defined and injectable, with a fixed-clock test double
- [x] A test harness connects to a database and can be reset between tests (embedded PGlite by default; real Postgres when `DATABASE_URL` is set — see ADR 0001)
- [x] A trivial smoke test runs green through the harness, proving the seam works

## Comments

- Stack pinned in `docs/adr/0001-evidence-integrity-stack.md`: Bun + TypeScript + Drizzle + Postgres + Zod, `bun test`.
- Test DB uses embedded PGlite for now (zero external setup). Harness auto-switches to real Postgres when `DATABASE_URL` is set — no code change needed. Revisit when a test DB URL is available.
- Verified: `bun run typecheck` clean; `bun test` → 14 pass, 0 fail across 3 files.
