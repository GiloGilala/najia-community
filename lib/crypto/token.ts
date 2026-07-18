/**
 * Session-token signing (compact HMAC-signed token).
 *
 * The platform issues a signed token at login and stores only its hash in the
 * session store. The token is a base64url(payload).hmac(payload, secret) where
 * the payload carries sessionId, userId, and exp (unix seconds). Signing is
 * behind a small interface so tests inject a fixed secret; production reads the
 * secret from `AUTH_SECRET`.
 *
 * Note: `verify` checks the signature but does NOT enforce `exp` — the signer
 * has no clock and issuance uses an injected clock. Session expiry is enforced
 * by the session store (`sessions.expires_at`) via the service's injected
 * clock, which is the authoritative expiry gate.
 *
 * SECURITY-AUDIT-REQUIRED: see docs/adr/0002-custom-auth-security.md.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface SessionTokenClaims {
  sessionId: string;
  userId: string;
  exp: number;
}

export interface TokenSigner {
  sign(claims: Omit<SessionTokenClaims, "exp">, expiresAt: Date): string;
  verify(token: string): SessionTokenClaims | null;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

/** Resolve the signing secret: explicit override, else AUTH_SECRET. */
export function resolveSigningSecret(override?: string): string {
  const secret = override ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "No auth signing secret: pass one explicitly or set AUTH_SECRET",
    );
  }
  return secret;
}

export function createHmacTokenSigner(secret: string): TokenSigner {
  function signature(payloadB64: string): string {
    return createHmac("sha256", secret).update(payloadB64).digest("base64url");
  }

  return {
    sign(claims, expiresAt) {
      const payload: SessionTokenClaims = {
        ...claims,
        exp: Math.floor(expiresAt.getTime() / 1000),
      };
      const payloadB64 = b64url(JSON.stringify(payload));
      const sig = signature(payloadB64);
      return `${payloadB64}.${sig}`;
    },
    verify(token) {
      const dot = token.indexOf(".");
      if (dot < 0) return null;
      const payloadB64 = token.slice(0, dot);
      const providedSig = token.slice(dot + 1);
      const expectedSig = signature(payloadB64);
      const a = Buffer.from(providedSig);
      const b = Buffer.from(expectedSig);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return null;
      }
      try {
        const payload = JSON.parse(
          b64urlDecode(payloadB64).toString("utf8"),
        ) as SessionTokenClaims;
        // Expiry is NOT enforced here: the signer has no clock and issuance
        // uses an injected clock. Session expiry is enforced by the session
        // store (sessions.expires_at) via the service's injected clock.
        if (typeof payload.exp !== "number") {
          return null;
        }
        return payload;
      } catch {
        return null;
      }
    },
  };
}
