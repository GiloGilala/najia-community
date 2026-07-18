# 05 — Session validation & logout

**What to build:** A logged-in user's token can be validated on later requests, and they can log out to invalidate it. `validateSession()` resolves a live, unexpired, unrevoked token to its user and rejects anything else; `logout()` revokes the session so it can no longer be validated. Demoable: validate a freshly issued token → the user; validate an expired, unknown, or revoked token → rejected; after logout the token no longer validates.

**Blocked by:** 04 — Login & session issuance

**Status:** resolved

- [x] `validateSession({ token })` resolves a live, unexpired, unrevoked session to its user record
- [x] An expired token is rejected
- [x] An unknown token is rejected
- [x] A revoked token is rejected
- [x] `logout({ token })` revokes the session; the token no longer validates afterward

## Comments

- `services/auth.service.ts`: added `validateSession` and `logout`. Validation checks token signature, then the session row (not revoked, not expired per the injected clock), then the user. Logout sets `revoked_at` (idempotent). All rejections throw the same `AuthError` as login.
- Completes the auth slice. Verified: `bun run typecheck` clean; `bun test` → 62 pass, 0 fail.
