import { or, eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import {
  argon2PasswordHasher,
  type PasswordHasher,
} from "../lib/crypto/password-hasher.ts";
import {
  validateRegistration,
  RegistrationValidationError,
} from "../lib/validation/registration.ts";
import { generateNumericCode, hashCode } from "../lib/crypto/code.ts";
import { hashGovernmentId } from "../lib/crypto/government-id.ts";
import { createHmacTokenSigner, resolveSigningSecret, type TokenSigner } from "../lib/crypto/token.ts";
import type { Notifier } from "../lib/notify/notifier.ts";
import type { IdVerificationProvider } from "../lib/verification/id-verification-provider.ts";
import {
  users,
  type UserRow,
} from "../db/schema/users.ts";
import { contactVerifications } from "../db/schema/contact-verifications.ts";
import { sessions } from "../db/schema/sessions.ts";

export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
}

/** Raised when a contact-verification code is missing, wrong, or expired. */
export class ContactVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactVerificationError";
  }
}

/** Raised when identity verification cannot proceed (provider failure, duplicate ID). */
export class IdentityVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityVerificationError";
  }
}

/** Raised for authentication failures (login): identical for wrong password
 *  and unknown identifier, so accounts are not enumerable. */
export class AuthError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "AuthError";
  }
}

/** How long an issued contact code remains valid. */
export const CONTACT_CODE_TTL_MS = 15 * 60 * 1000;

/** How long an issued session remains valid. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthServiceDeps {
  db: DbClient;
  clock: Clock;
  /** Delivers one-time codes; faked in tests. Required for ticket 02+. */
  notifier?: Notifier;
  /** Identity verification (Jumio/Onfido); faked in tests. Required for ticket 03+. */
  idProvider?: IdVerificationProvider;
  /** Signs session tokens; reads AUTH_SECRET or an injected secret. Required for ticket 04+. */
  tokenSigner?: TokenSigner;
  /** Defaults to argon2id via Bun.password; overridable for tests. */
  passwordHasher?: PasswordHasher;
}

export interface AuthService {
  register(input: RegisterInput): Promise<UserRow>;
  issueContactVerification(args: { userId: string }): Promise<void>;
  confirmContactVerification(args: {
    userId: string;
    code: string;
  }): Promise<UserRow>;
  submitIdentityVerification(args: {
    userId: string;
    governmentId: string;
  }): Promise<{ verified: boolean; reason?: string }>;
  login(args: {
    identifier: string;
    password: string;
  }): Promise<{ token: string; expiresAt: Date }>;
  validateSession(args: { token: string }): Promise<UserRow>;
  logout(args: { token: string }): Promise<void>;
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  const { db, clock } = deps;
  const passwordHasher = deps.passwordHasher ?? argon2PasswordHasher;
  const notifier = deps.notifier;
  const idProvider = deps.idProvider;
  let tokenSigner = deps.tokenSigner;

  async function requireUser(userId: string): Promise<UserRow> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!row) {
      throw new ContactVerificationError("User not found");
    }
    return row;
  }

  return {
    async register(input) {
      const validated = validateRegistration(input);

      // Pre-check for an existing contact channel to return a clear error; the
      // DB unique constraint remains the ultimate guard against races.
      const conditions = [];
      if (validated.email !== undefined) {
        conditions.push(eq(users.email, validated.email));
      }
      if (validated.phone !== undefined) {
        conditions.push(eq(users.phone, validated.phone));
      }
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(conditions.length === 1 ? conditions[0] : or(...conditions))
        .limit(1);
      if (existing.length > 0) {
        throw new RegistrationValidationError(
          "An account with this email or phone already exists",
        );
      }

      const passwordHash = await passwordHasher.hash(validated.password);
      const now = clock.now();

      const [row] = await db
        .insert(users)
        .values({
          email: validated.email ?? null,
          phone: validated.phone ?? null,
          passwordHash,
          verificationStatus: "unverified",
          governmentIdHash: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to insert user row");
      }
      return row;
    },

    async issueContactVerification({ userId }) {
      if (!notifier) {
        throw new Error("No notifier configured for contact verification");
      }
      await requireUser(userId);
      const now = clock.now();
      const code = generateNumericCode();
      await db.insert(contactVerifications).values({
        userId,
        codeHash: hashCode(code),
        expiresAt: new Date(now.getTime() + CONTACT_CODE_TTL_MS),
        consumedAt: null,
        createdAt: now,
      });
      const channel = (
        await db.select({ email: users.email, phone: users.phone }).from(users).where(eq(users.id, userId)).limit(1)
      )[0];
      const target = channel?.email !== null ? "email" : "phone";
      await notifier.sendCode({ userId, channel: target, code });
    },

    async confirmContactVerification({ userId, code }) {
      const user = await requireUser(userId);
      const now = clock.now();
      const rows = await db
        .select()
        .from(contactVerifications)
        .where(
          and(
            eq(contactVerifications.userId, userId),
            eq(contactVerifications.codeHash, hashCode(code)),
          ),
        );
      // Prefer the most recently issued, still-valid code.
      const valid = rows
        .filter(
          (r) => r.consumedAt === null && r.expiresAt.getTime() > now.getTime(),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const match = valid[0];
      if (!match) {
        throw new ContactVerificationError("Invalid or expired code");
      }
      // Forward-only: only advance from unverified.
      if (user.verificationStatus !== "unverified") {
        throw new ContactVerificationError(
          "Contact verification already completed",
        );
      }
      await db
        .update(contactVerifications)
        .set({ consumedAt: now })
        .where(eq(contactVerifications.id, match.id));
      await db
        .update(users)
        .set({ verificationStatus: "email_verified", updatedAt: now })
        .where(eq(users.id, userId));
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return updated!;
    },

    async submitIdentityVerification({ userId, governmentId }) {
      if (!idProvider) {
        throw new Error("No ID verification provider configured");
      }
      const user = await requireUser(userId);

      const result = await idProvider.verify({
        governmentId,
        channel: user.email !== null ? "email" : "phone",
      });

      if (!result.verified) {
        return { verified: false, reason: result.reason };
      }

      // Forward-only lifecycle: identity verification requires contact
      // verification to have completed first.
      if (user.verificationStatus !== "email_verified") {
        return {
          verified: false,
          reason: "Contact verification must be completed before identity verification",
        };
      }

      const govIdHash = hashGovernmentId(governmentId);
      // The unique constraint on government_id_hash guards one verified
      // account per person; a concurrent insert with the same ID is rejected.
      try {
        await db
          .update(users)
          .set({ governmentIdHash: govIdHash, verificationStatus: "id_verified", updatedAt: clock.now() })
          .where(eq(users.id, userId));
      } catch {
        throw new IdentityVerificationError(
          "This government ID is already linked to another account",
        );
      }
      return { verified: true };
    },

    async login({ identifier, password }) {
      // Resolve the signer lazily so constructing the service for other
      // methods (e.g. register) does not require AUTH_SECRET.
      const signer = tokenSigner ?? createHmacTokenSigner(resolveSigningSecret());

      // Non-enumerable: a single query path; the same AuthError is thrown for
      // an unknown account or a wrong password.
      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.email, identifier), eq(users.phone, identifier)))
        .limit(1);

      const passwordHash = user?.passwordHash ?? "";
      const ok = await passwordHasher.verify(password, passwordHash);
      if (!user || !ok) {
        throw new AuthError();
      }

      const now = clock.now();
      const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
      const sessionId = randomUUID();
      const token = signer.sign({ sessionId, userId: user.id }, expiresAt);

      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        tokenHash: hashCode(token),
        expiresAt,
        createdAt: now,
        revokedAt: null,
      });

      return { token, expiresAt };
    },

    async validateSession({ token }) {
      const signer = tokenSigner ?? createHmacTokenSigner(resolveSigningSecret());
      const claims = signer.verify(token);
      if (!claims) {
        throw new AuthError();
      }
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, claims.sessionId))
        .limit(1);
      if (!session || session.revokedAt !== null) {
        throw new AuthError();
      }
      if (session.expiresAt.getTime() <= clock.now().getTime()) {
        throw new AuthError();
      }
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      if (!user) {
        throw new AuthError();
      }
      return user;
    },

    async logout({ token }) {
      const signer = tokenSigner ?? createHmacTokenSigner(resolveSigningSecret());
      const claims = signer.verify(token);
      if (!claims) {
        throw new AuthError();
      }
      // Idempotent: a missing/already-revoked session is a no-op, not an error.
      await db
        .update(sessions)
        .set({ revokedAt: clock.now() })
        .where(eq(sessions.id, claims.sessionId));
    },
  };
}
