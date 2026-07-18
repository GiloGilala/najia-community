# 2. Custom authentication — security audit required before launch

Date: 2025-01-01
Status: Accepted (with mandatory follow-up)

## Context

The platform architecture doc (Section 6.3.3) specifies custom authentication: JWT + a session store, with identity verification via Jumio/Onfido, and 2FA via TOTP/SMS. The same section carries an explicit warning:

> Custom authentication for a platform storing government ID hashes, legal case data, and voting records requires a significantly higher security bar. A security audit of the custom implementation before launch is essential. Consider managed authentication providers as an alternative if security budget is constrained.

This ADR records how we proceed with the custom approach and the non-negotiable gate before production launch.

## Decision

- Authentication is implemented in-house (`services/auth.service.ts`) using JWT for tokens and a server-controlled session store (`sessions` table), instantiated per the architecture doc.
- Passwords are hashed with a memory-hard algorithm — argon2id via Bun's built-in `Bun.password` (`lib/crypto/password-hasher.ts`).
- Government IDs are stored **only as a hash** (`government_id_hash`), never plaintext (doc 6.6.3).
- The identity-verification provider (Jumio/Onfido) and the contact-code notifier are injected collaborators (`lib/verification`, `lib/notify`), so they are faked in tests and swappable later.
- **A full security audit of the custom auth implementation is mandatory before launch.** No production rollout without it.
- **Managed authentication (Clerk / Auth0 / Supabase Auth) remains an explicitly sanctioned fallback** if the security review surfaces gaps the budget cannot close. If adopted, a superseding ADR will record the switch; the `services/auth.service.ts` seam is designed to keep entry points unaffected.

## Consequences

- Custom auth gives full control over the session model and voting-integrity constraints (one-person-one-vote, hash-only IDs), at the cost of owning the security burden.
- Token signing keys, session expiry policy, and rate-limiting/lockout are deferred to the login/session slices (tickets 04–05) and a follow-up hardening slice, and must be in scope for the pre-launch audit.
- This ADR is intentionally lightweight on crypto specifics; it fixes the *obligation* (audit gate) rather than pinning every parameter.
