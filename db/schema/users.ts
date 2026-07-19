import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdictions.ts";

/**
 * Platform user accounts and their verification status.
 *
 * Sensitive values are never stored in plaintext: `passwordHash` holds a hashed
 * password and `governmentIdHash` holds a hashed government ID (spec 6.6.3).
 * The government ID hash is unique so one person maps to at most one verified
 * account (one-person-one-vote).
 *
 * See .scratch/auth-identity/spec.md.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email"),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    verificationStatus: text("verification_status").notNull(),
    governmentIdHash: text("government_id_hash"),
    /** Residency: the jurisdiction the User belongs to (for poll eligibility). */
    jurisdictionId: uuid("jurisdiction_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_phone_unique").on(table.phone),
    uniqueIndex("users_government_id_hash_unique").on(table.governmentIdHash),
    foreignKey({ columns: [table.jurisdictionId], foreignColumns: [jurisdictions.id] }).onDelete(
      "set null",
    ),
  ],
);

export type UserRow = typeof users.$inferSelect;

/** Forward-only account verification lifecycle. */
export type AccountVerificationStatus =
  | "unverified"
  | "email_verified"
  | "id_verified";
