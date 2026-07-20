import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { officials } from "./officials.ts";
import { users } from "./users.ts";

/**
 * A citizen's confidence vote on an official for a given quarter.
 * `voterId` is stored only for the one-vote-per-quarter unique constraint;
 * results are aggregate and never join back to the User.
 *
 * See .scratch/confidence-votes/spec.md.
 */
export const confidenceVotes = pgTable(
  "confidence_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    officialId: uuid("official_id").notNull(),
    voterId: uuid("voter_id").notNull(),
    option: text("option").notNull(), // "yes" | "no" | "uncertain"
    quarter: text("quarter").notNull(), // "YYYY-Qn"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.officialId], foreignColumns: [officials.id] }).onDelete(
      "cascade",
    ),
    foreignKey({ columns: [table.voterId], foreignColumns: [users.id] }).onDelete(
      "restrict",
    ),
    uniqueIndex("confidence_votes_official_voter_quarter_unique").on(
      table.officialId,
      table.voterId,
      table.quarter,
    ),
  ],
);

export type ConfidenceVoteRow = typeof confidenceVotes.$inferSelect;
