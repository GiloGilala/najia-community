import { or, eq } from "drizzle-orm";

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
import { users, type UserRow } from "../db/schema/users.ts";

export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthServiceDeps {
  db: DbClient;
  clock: Clock;
  /** Defaults to argon2id via Bun.password; overridable for tests. */
  passwordHasher?: PasswordHasher;
}

export interface AuthService {
  register(input: RegisterInput): Promise<UserRow>;
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  const { db, clock } = deps;
  const passwordHasher = deps.passwordHasher ?? argon2PasswordHasher;

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
  };
}
