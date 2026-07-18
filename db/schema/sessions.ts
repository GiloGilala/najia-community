import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

/**
 * Server-controlled session rows. The raw token is returned to the caller once
 * at login; only its hash is stored. Sessions are invalidated by setting
 * `revoked_at` (or by expiry/`expires_at`).
 *
 * See .scratch/auth-identity/spec.md.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export type SessionRow = typeof sessions.$inferSelect;
