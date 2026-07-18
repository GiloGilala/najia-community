# 04 — Login & session issuance

**What to build:** A user can log in with their credentials and receive a session. On correct credentials the service issues a signed token and records a session row (token stored as a hash, with an expiry via the injected clock), returning the raw token to the caller once. Failed logins are indistinguishable between an unknown account and a wrong password, so accounts cannot be enumerated. Demoable: log in with good credentials → a session token; a wrong password and an unknown identifier both fail identically.

**Blocked by:** 01 — User registration & password hashing

**Status:** resolved

- [x] `sessions` table exists: id, user_id, token_hash, expires_at, created_at, revoked_at (nullable)
- [x] `login({ identifier, password })` verifies the password against the stored hash
- [x] On success it issues a signed token and records a session row with an expiry from the injected clock
- [x] The raw token is returned to the caller once; only its hash is persisted
- [x] A wrong password and an unknown identifier fail with an identical, non-enumerable error

## Comments

- `db/schema/sessions.ts` + migration `0003`.
- `lib/crypto/token.ts`: compact HMAC-SHA256 token (base64url payload + signature), `createHmacTokenSigner`, `resolveSigningSecret` (env `AUTH_SECRET` or injected). `verify` checks the signature but defers expiry to the session store (no clock in the signer).
- `services/auth.service.ts`: added `tokenSigner` dep, `AuthError`, `SESSION_TTL_MS` (7d), `login()`. Single query path so wrong-password and unknown-identifier throw the same `AuthError` (no account enumeration). Signer resolved lazily so constructing the service for other methods doesn't require `AUTH_SECRET`.
- Verified: `bun run typecheck` clean; `bun test` → 57 pass, 0 fail.
