import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdictions.ts";
import { users } from "./users.ts";

/**
 * A policy sentiment poll. Options are stored as a small JSON array of strings
 * (2–5, validated in the service). `status` is a cached convenience; the
 * authoritative open/closed state is derived from opens_at/closes_at via the
 * injected clock (see .scratch/policy-polls/spec.md).
 */
export const policyPolls = pgTable(
  "policy_polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    question: text("question").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    jurisdictionId: uuid("jurisdiction_id").notNull(),
    status: text("status").notNull(), // "scheduled" | "open" | "closed"
    opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.jurisdictionId], foreignColumns: [jurisdictions.id] }).onDelete(
      "restrict",
    ),
    foreignKey({ columns: [table.createdBy], foreignColumns: [users.id] }).onDelete(
      "restrict",
    ),
  ],
);

export type PolicyPollRow = typeof policyPolls.$inferSelect;

/** Poll lifecycle derived from the time window. */
export type PollStatus = "scheduled" | "open" | "closed";

/**
 * A single citizen vote. `voterId` is stored only for the one-person-one-vote
 * unique constraint; results are aggregate and never join back to the User.
 */
export const policyVotes = pgTable(
  "policy_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id").notNull(),
    voterId: uuid("voter_id").notNull(),
    optionIndex: integer("option_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.pollId], foreignColumns: [policyPolls.id] }).onDelete(
      "cascade",
    ),
    foreignKey({ columns: [table.voterId], foreignColumns: [users.id] }).onDelete(
      "restrict",
    ),
    uniqueIndex("policy_votes_poll_voter_unique").on(table.pollId, table.voterId),
  ],
);

export type PolicyVoteRow = typeof policyVotes.$inferSelect;
