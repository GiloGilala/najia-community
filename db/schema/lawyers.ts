import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  foreignKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

/**
 * A verified legal professional. A lawyer *is* a User (the profile is keyed by
 * `user_id`), so no separate auth exists — the underlying User carries the
 * account. `verification_status` starts `pending` and becomes `verified` via a
 * platform action (Bar-API integration is deferred). Only `verified` lawyers are
 * matchable.
 *
 * See .scratch/lawyer-marketplace/spec.md (architecture §5.2–5.4).
 */
export const lawyers = pgTable(
  "lawyers",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id, {
      onDelete: "cascade",
    }),
    barNumber: text("bar_number").notNull(),
    practiceAreas: jsonb("practice_areas").$type<string[]>().notNull(),
    licensedJurisdictionIds: jsonb("licensed_jurisdiction_ids")
      .$type<string[]>()
      .notNull(),
    yearsPracticing: integer("years_practicing").notNull(),
    languages: jsonb("languages").$type<string[]>().notNull(),
    proBono: boolean("pro_bono").notNull().default(false),
    verificationStatus: text("verification_status").notNull(), // "pending" | "verified"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("lawyers_bar_number_unique").on(table.barNumber),
  ],
);

export type LawyerRow = typeof lawyers.$inferSelect;

/** Lawyer verification lifecycle for this slice. */
export type LawyerVerificationStatus = "pending" | "verified";
