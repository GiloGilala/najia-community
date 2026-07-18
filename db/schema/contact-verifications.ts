import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

/**
 * One-time contact-verification codes. Append-style: a new row per issuance;
 * `consumedAt` marks a code as used. Codes are stored only as a hash.
 *
 * See .scratch/auth-identity/spec.md.
 */
export const contactVerifications = pgTable("contact_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type ContactVerificationRow = typeof contactVerifications.$inferSelect;
