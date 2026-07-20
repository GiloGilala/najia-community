import { pgTable, uuid, text, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdictions.ts";

/**
 * An elected official eligible for confidence votes. Platform-managed entity
 * (not user-submitted). `term_starts_at` / `term_ends_at` bound the period the
 * official may be evaluated; a null `term_ends_at` means the term has no fixed
 * end (still in office).
 *
 * See .scratch/confidence-votes/spec.md and architecture §3.2.3.
 */
export const officials = pgTable(
  "officials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    jurisdictionId: uuid("jurisdiction_id").notNull(),
    termStartsAt: timestamp("term_starts_at", { withTimezone: true }).notNull(),
    termEndsAt: timestamp("term_ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.jurisdictionId], foreignColumns: [jurisdictions.id] }).onDelete(
      "restrict",
    ),
  ],
);

export type OfficialRow = typeof officials.$inferSelect;

/** Allowed confidence-vote responses. */
export type ConfidenceOption = "yes" | "no" | "uncertain";
