# 04 — Login & session issuance

**What to build:** A user can log in with their credentials and receive a session. On correct credentials the service issues a signed token and records a session row (token stored as a hash, with an expiry via the injected clock), returning the raw token to the caller once. Failed logins are indistinguishable between an unknown account and a wrong password, so accounts cannot be enumerated. Demoable: log in with good credentials → a session token; a wrong password and an unknown identifier both fail identically.

**Blocked by:** 01 — User registration & password hashing

**Status:** ready-for-agent

- [ ] `sessions` table exists: id, user_id, token_hash, expires_at, created_at, revoked_at (nullable)
- [ ] `login({ identifier, password })` verifies the password against the stored hash
- [ ] On success it issues a signed token and records a session row with an expiry from the injected clock
- [ ] The raw token is returned to the caller once; only its hash is persisted
- [ ] A wrong password and an unknown identifier fail with an identical, non-enumerable error
