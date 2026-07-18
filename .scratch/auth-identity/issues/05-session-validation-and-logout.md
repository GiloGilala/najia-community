# 05 — Session validation & logout

**What to build:** A logged-in user's token can be validated on later requests, and they can log out to invalidate it. `validateSession()` resolves a live, unexpired, unrevoked token to its user and rejects anything else; `logout()` revokes the session so it can no longer be validated. Demoable: validate a freshly issued token → the user; validate an expired, unknown, or revoked token → rejected; after logout the token no longer validates.

**Blocked by:** 04 — Login & session issuance

**Status:** ready-for-agent

- [ ] `validateSession({ token })` resolves a live, unexpired, unrevoked session to its user record
- [ ] An expired token is rejected
- [ ] An unknown token is rejected
- [ ] A revoked token is rejected
- [ ] `logout({ token })` revokes the session; the token no longer validates afterward
